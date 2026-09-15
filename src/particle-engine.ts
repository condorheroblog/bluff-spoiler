import type { BluffSpoilerOptions, Context2DLike, FragmentRect, ParticleMotion, ParticleShape } from "./types";
import { ticker } from "./ticker";
import { DENSITY_AREA } from "./types";

interface Particle {
	/** Current render position in content space (union box of fragments). */
	x: number
	y: number
	/**
	 * Flow position integrated in flow modes (`up`/`down`); equals x/y while
	 * no wander offset is applied. Unused in `orbit` mode.
	 */
	fx: number
	fy: number
	/** Base flow velocity in CSS pixels per second (signed by direction). */
	vx: number
	vy: number
	/** Fixed anchor around which the particle circles in `orbit` mode. */
	ax: number
	ay: number
	/** Current orbit angle (rad) and signed angular speed (rad/s). */
	angle: number
	angularSpeed: number
	/** Per-particle orbit radius multiplier so circles are not uniform. */
	radiusFactor: number
	/** Per-particle multiplier of the alpha-breathing period. */
	fadeFactor: number
	/** Phase offset for wander / irregularity / breathing oscillations. */
	phase: number
	/** Motion mode this particle was initialized for. */
	motion: ParticleMotion
	size: number
}

interface FragmentSurface {
	rect: FragmentRect
	canvas: HTMLCanvasElement
	ctx: Context2DLike
}

const TWO_PI = Math.PI * 2;
const MAX_DEVICE_PIXEL_RATIO = 2;
const SPRITE_CACHE_LIMIT = 64;

/** Base flow speed range at `speed: 1` (CSS px/s). */
const FLOW_SPEED_MIN = 4;
const FLOW_SPEED_MAX = 12;
/** Angular speed range of orbit particles at `speed: 1` (rad/s). */
const ORBIT_ANGULAR_MIN = 0.35;
const ORBIT_ANGULAR_MAX = 0.8;
/** Wander oscillation frequencies (rad/s) — incommensurate pairs look organic. */
const WANDER_FREQ_X = 1.1;
const WANDER_FREQ_Y = 1.7;
/** Vertical wander uses a smaller amplitude than horizontal wander. */
const WANDER_VERTICAL_FACTOR = 0.6;
/** Per-particle fade period varies by ±40 % so particles breathe out of sync. */
const FADE_PERIOD_MIN_FACTOR = 0.6;
const FADE_PERIOD_VARIANCE = 0.8;

/** Pre-rendered bloom sprites keyed by visual configuration. */
const spriteCache = new Map<string, HTMLCanvasElement>();

/**
 * Breathing alpha multiplier at time `nowMs`: a cosine that cycles a
 * particle from fully transparent (0) to fully opaque (1) and back once per
 * `periodMs`. Each particle carries its own phase and period factor.
 */
function breathingAlpha(nowMs: number, phase: number, periodMs: number, factor: number): number {
	const period = periodMs * factor;
	return 0.5 - 0.5 * Math.cos((nowMs / period) * TWO_PI + phase);
}

function traceShape(
	ctx: Context2DLike,
	shape: ParticleShape,
	x: number,
	y: number,
	radius: number,
): void {
	ctx.beginPath();
	switch (shape) {
		case "circle":
			ctx.arc(x, y, radius, 0, TWO_PI);
			break;
		case "square":
			ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
			break;
		case "triangle":
			ctx.moveTo(x, y - radius);
			ctx.lineTo(x + radius * 0.9, y + radius * 0.8);
			ctx.lineTo(x - radius * 0.9, y + radius * 0.8);
			ctx.closePath();
			break;
		case "diamond":
			ctx.moveTo(x, y - radius);
			ctx.lineTo(x + radius, y);
			ctx.lineTo(x, y + radius);
			ctx.lineTo(x - radius, y);
			ctx.closePath();
			break;
	}
}

function getBloomSprite(
	shape: ParticleShape,
	size: number,
	color: string,
	dpr: number,
): HTMLCanvasElement {
	const key = `${shape}|${size}|${color}|${dpr}`;
	const cached = spriteCache.get(key);
	if (cached)
		return cached;

	const cssSize = Math.max(8, size * 6);
	const pixelSize = Math.ceil(cssSize * dpr);
	const canvas = document.createElement("canvas");
	canvas.width = pixelSize;
	canvas.height = pixelSize;

	const ctx = canvas.getContext("2d") as unknown as Context2DLike | null;
	if (ctx) {
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.translate(cssSize / 2, cssSize / 2);
		// The glow is baked into a sprite once, avoiding per-frame shadowBlur.
		ctx.shadowColor = color;
		ctx.shadowBlur = size * 2.2;
		ctx.fillStyle = color;
		traceShape(ctx, shape, 0, 0, size);
		ctx.fill();
		// Crisp core so the glow does not wash the shape out.
		ctx.shadowBlur = 0;
		traceShape(ctx, shape, 0, 0, size);
		ctx.fill();
	}

	spriteCache.set(key, canvas);
	if (spriteCache.size > SPRITE_CACHE_LIMIT) {
		const oldest = spriteCache.keys().next().value;
		if (oldest !== undefined)
			spriteCache.delete(oldest);
	}
	return canvas;
}

/**
 * Owns the particle simulation and the per-line-fragment canvases.
 *
 * Particles live in a single content-space the size of the spoiler's union
 * box; every fragment canvas only draws the particles intersecting it, which
 * keeps the animation seamless across line breaks.
 */
export class ParticleEngine {
	#layer: HTMLElement;
	#getOptions: () => BluffSpoilerOptions;
	#surfaces: FragmentSurface[] = [];
	#particles: Particle[] = [];
	#width = 0;
	#height = 0;
	#rectSignature = "";
	#dpr = 1;
	#active = true;
	#reducedMotion = false;

	constructor(layer: HTMLElement, getOptions: () => BluffSpoilerOptions) {
		this.#layer = layer;
		this.#getOptions = getOptions;
	}

	get particles(): readonly Particle[] {
		return this.#particles;
	}

	/** Rebuild canvases from host-relative fragment rectangles. */
	setRects(rects: FragmentRect[]): void {
		this.#width = rects.reduce((max, rect) => Math.max(max, rect.x + rect.width), 0);
		this.#height = rects.reduce((max, rect) => Math.max(max, rect.y + rect.height), 0);

		const signature = JSON.stringify(rects);
		if (signature !== this.#rectSignature) {
			this.#rectSignature = signature;
			this.#buildSurfaces(rects);
		}

		this.#rebalance();
		this.render();
		this.#updateTicker();
	}

	/** Pause/resume animation (e.g. via IntersectionObserver or reveal). */
	setActive(active: boolean): void {
		this.#active = active;
		this.#updateTicker();
	}

	setReducedMotion(reduced: boolean): void {
		this.#reducedMotion = reduced;
		this.#updateTicker();
		if (reduced)
			this.render();
	}

	/** Re-sync particle count/size with options and paint a static frame. */
	refresh(): void {
		this.#rebalance();
		this.render();
		this.#updateTicker();
	}

	tick(deltaSeconds: number, now: number): void {
		if (this.#reducedMotion)
			return;
		this.#simulate(deltaSeconds, now);
		this.render(now);
	}

	/** Paint one frame onto every fragment canvas. */
	render(now: number = performance.now()): void {
		const options = this.#getOptions();
		const fadePeriod = options.fade;

		for (const surface of this.#surfaces) {
			const { ctx, rect } = surface;
			ctx.setTransform(this.#dpr, 0, 0, this.#dpr, 0, 0);
			ctx.globalAlpha = 1;
			// Transparent backdrop: the masked glyphs are hidden via
			// `color: transparent`, so only the particles are painted and the
			// field blends seamlessly with the surrounding page.
			ctx.clearRect(0, 0, rect.width, rect.height);

			for (const particle of this.#particles) {
				// Culling margin must also cover wander radius / orbit radius.
				const margin = (options.bloom ? particle.size * 3 + 2 : particle.size + 1) + options.jitter;
				if (
					particle.x < rect.x - margin
					|| particle.x > rect.x + rect.width + margin
					|| particle.y < rect.y - margin
					|| particle.y > rect.y + rect.height + margin
				) {
					continue;
				}

				// Every particle continuously breathes between transparent
				// and its configured opacity while moving (fade: 0 = steady).
				// The reduced-motion fallback paints one fully opaque frame so
				// the masked text never relies on a random breathing phase.
				ctx.globalAlpha = fadePeriod === 0 || this.#reducedMotion
					? options.opacity
					: options.opacity * breathingAlpha(now, particle.phase, fadePeriod, particle.fadeFactor);

				const localX = particle.x - rect.x;
				const localY = particle.y - rect.y;
				if (options.bloom) {
					const sprite = getBloomSprite(options.shape, particle.size, options.color, this.#dpr);
					const cssSize = sprite.width / this.#dpr;
					ctx.drawImage(sprite, localX - cssSize / 2, localY - cssSize / 2, cssSize, cssSize);
				}
				else if (options.shape === "square") {
					ctx.fillStyle = options.color;
					ctx.fillRect(
						localX - particle.size,
						localY - particle.size,
						particle.size * 2,
						particle.size * 2,
					);
				}
				else {
					ctx.fillStyle = options.color;
					traceShape(ctx, options.shape, localX, localY, particle.size);
					ctx.fill();
				}
			}
		}
	}

	dispose(): void {
		ticker.remove(this);
		this.#surfaces = [];
		this.#particles = [];
		this.#width = 0;
		this.#height = 0;
		this.#rectSignature = "";
		this.#layer.replaceChildren();
	}

	#buildSurfaces(rects: FragmentRect[]): void {
		this.#dpr = Math.min(
			MAX_DEVICE_PIXEL_RATIO,
			Math.max(1, globalThis.devicePixelRatio || 1),
		);
		this.#layer.replaceChildren();
		this.#surfaces = rects.map((rect) => {
			const canvas = document.createElement("canvas");
			canvas.className = "bluff-particle-canvas";
			canvas.style.position = "absolute";
			canvas.style.left = `${rect.x}px`;
			canvas.style.top = `${rect.y}px`;
			canvas.style.width = `${rect.width}px`;
			canvas.style.height = `${rect.height}px`;
			canvas.setAttribute("aria-hidden", "true");
			canvas.width = Math.max(1, Math.round(rect.width * this.#dpr));
			canvas.height = Math.max(1, Math.round(rect.height * this.#dpr));
			this.#layer.appendChild(canvas);
			const ctx = canvas.getContext("2d") as unknown as Context2DLike | null;
			return { rect, canvas, ctx: ctx as Context2DLike };
		});
	}

	#rebalance(): void {
		const options = this.#getOptions();
		for (const particle of this.#particles) {
			particle.size = options.size;
			// The motion algorithm changed: reseed the particle for the new
			// mode (velocities / anchors are mode-specific).
			if (particle.motion !== options.motion)
				this.#initParticle(particle, options.motion);
		}
		if (this.#width === 0 || this.#height === 0) {
			this.#particles.length = 0;
			return;
		}
		const target = options.count ?? Math.max(0, Math.round((this.#width * this.#height / DENSITY_AREA) * options.density));

		while (this.#particles.length < target) {
			const particle = { size: options.size } as Particle;
			this.#initParticle(particle, options.motion);
			this.#particles.push(particle);
		}
		if (this.#particles.length > target)
			this.#particles.length = target;
	}

	/** Seed every motion field of a particle for the given mode. */
	#initParticle(particle: Particle, motion: ParticleMotion): void {
		const phase = Math.random() * TWO_PI;
		particle.phase = phase;
		particle.motion = motion;
		particle.vx = 0;
		particle.vy = 0;
		particle.ax = 0;
		particle.ay = 0;
		particle.angle = phase;
		particle.angularSpeed = 0;
		particle.radiusFactor = 0.6 + Math.random() * 0.7;
		particle.fadeFactor = FADE_PERIOD_MIN_FACTOR + Math.random() * FADE_PERIOD_VARIANCE;

		if (motion === "orbit") {
			// Anchor inside the union box; the circling radius (jitter) is
			// added at simulation time.
			particle.ax = Math.random() * this.#width;
			particle.ay = Math.random() * this.#height;
			particle.x = particle.ax;
			particle.y = particle.ay;
			particle.fx = particle.ax;
			particle.fy = particle.ay;
			const angular = ORBIT_ANGULAR_MIN + Math.random() * (ORBIT_ANGULAR_MAX - ORBIT_ANGULAR_MIN);
			particle.angularSpeed = angular * (Math.random() < 0.5 ? -1 : 1);
			return;
		}

		particle.fx = Math.random() * this.#width;
		particle.fy = Math.random() * this.#height;
		particle.x = particle.fx;
		particle.y = particle.fy;
		// A slight horizontal slant keeps the flow from looking mechanical.
		particle.vx = -3 + Math.random() * 6;
		const flowSpeed = FLOW_SPEED_MIN + Math.random() * (FLOW_SPEED_MAX - FLOW_SPEED_MIN);
		// `cross` assigns each particle independently to one of the two
		// directions, so the opposing streams interleave naturally.
		const direction = motion === "down"
			? 1
			: motion === "up"
				? -1
				: Math.random() < 0.5 ? -1 : 1;
		particle.vy = flowSpeed * direction;
	}

	#simulate(deltaSeconds: number, now: number): void {
		this.#rebalance();
		const options = this.#getOptions();
		const time = now / 1000;

		if (options.motion === "orbit") {
			for (const particle of this.#particles) {
				particle.angle += particle.angularSpeed * options.speed * deltaSeconds;

				const radius = options.jitter * particle.radiusFactor;
				// Slowly modulated radius plus tangential noise turns the
				// perfect circle into an irregular looping path.
				const wobblyRadius = radius * (1 + 0.35 * Math.sin(time * 0.9 + particle.phase * 2));
				particle.x = particle.ax + Math.cos(particle.angle) * wobblyRadius + Math.sin(time * 1.3 + particle.phase) * radius * 0.25;
				particle.y = particle.ay + Math.sin(particle.angle) * wobblyRadius + Math.cos(time * 1.1 + particle.phase * 1.7) * radius * 0.25;
			}
			return;
		}

		// Flow modes: the flow position integrates only the directional
		// velocity and wraps at the edges; the jitter wander is an analytic
		// sine offset around that path, so its amplitude stays exactly within
		// the configured pixel radius instead of accumulating integration
		// error.
		const margin = options.size + options.jitter + 4;
		const spanX = this.#width + margin * 2;
		const spanY = this.#height + margin * 2;
		const jitter = options.jitter;

		for (const particle of this.#particles) {
			particle.fx += particle.vx * options.speed * deltaSeconds;
			particle.fy += particle.vy * options.speed * deltaSeconds;

			while (particle.fx < -margin)
				particle.fx += spanX;
			while (particle.fx > this.#width + margin)
				particle.fx -= spanX;
			while (particle.fy < -margin)
				particle.fy += spanY;
			while (particle.fy > this.#height + margin)
				particle.fy -= spanY;

			particle.x = particle.fx + jitter * Math.sin(time * WANDER_FREQ_X + particle.phase);
			particle.y = particle.fy + jitter * WANDER_VERTICAL_FACTOR * Math.sin(time * WANDER_FREQ_Y + particle.phase * 1.3);
		}
	}

	#updateTicker(): void {
		const options = this.#getOptions();
		// speed 0 freezes movement and orbit particles with zero radius never
		// leave their anchor — but alpha breathing still needs frames when
		// enabled, so the loop may only stop when both effects are idle.
		const movementIdle = options.speed === 0 || (options.motion === "orbit" && options.jitter === 0);
		const shouldRun = this.#active && !this.#reducedMotion && (!movementIdle || options.fade > 0) && this.#width > 0 && this.#height > 0;
		if (shouldRun)
			ticker.add(this);
		else
			ticker.remove(this);
	}
}
