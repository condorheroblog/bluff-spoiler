import type { BluffSpoilerOptions, Context2DLike, ParticleShape } from "./types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ParticleEngine } from "./particle-engine";
import { DEFAULT_PARTICLE_OPTIONS } from "./types";

function createLayer(): HTMLDivElement {
	return document.createElement("div");
}

const liveEngines: ParticleEngine[] = [];

function createEngine(
	overrides: Partial<BluffSpoilerOptions> = {},
): { layer: HTMLDivElement, engine: ParticleEngine, options: BluffSpoilerOptions } {
	const layer = createLayer();
	const options: BluffSpoilerOptions = { ...DEFAULT_PARTICLE_OPTIONS, ...overrides };
	const engine = new ParticleEngine(layer, () => options);
	liveEngines.push(engine);
	return { layer, engine, options };
}

function getCanvasContexts(layer: HTMLElement): Context2DLike[] {
	return [...layer.querySelectorAll("canvas")].map(
		canvas => canvas.getContext("2d") as unknown as Context2DLike,
	);
}

function rafTick(time: number): void {
	(globalThis as unknown as { __rafTick__: (t: number) => void }).__rafTick__(time);
}
function rafPending(): number {
	return (globalThis as unknown as { __rafPending__: () => number }).__rafPending__();
}

describe("particleEngine", () => {
	beforeEach(() => {
		vi.spyOn(Math, "random").mockReturnValue(0.5);
	});

	afterEach(() => {
		for (const engine of liveEngines.splice(0))
			engine.dispose();
		vi.restoreAllMocks();
	});

	it("creates one transparent canvas per inline fragment on single-line content", () => {
		const { layer, engine } = createEngine({ shape: "circle" });
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);

		const canvases = layer.querySelectorAll("canvas");
		expect(canvases).toHaveLength(1);

		const canvas = canvases[0];
		expect(canvas.style.left).toBe("0px");
		expect(canvas.style.top).toBe("0px");
		expect(canvas.style.width).toBe("100px");
		expect(canvas.style.height).toBe("20px");
		expect(canvas.className).toBe("bluff-particle-canvas");

		const ctx = getCanvasContexts(layer)[0];
		// every frame is cleared, but no backdrop rectangle is ever painted —
		// circle particles use paths, so fillRect must never be called
		expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 100, 20);
		expect(ctx.fillRect).not.toHaveBeenCalled();
	});

	it("creates one canvas per fragment for content that wraps across lines", () => {
		const { layer, engine } = createEngine();
		engine.setRects([
			{ x: 0, y: 0, width: 200, height: 20 },
			{ x: 0, y: 24, width: 80, height: 20 },
		]);

		expect(layer.querySelectorAll("canvas")).toHaveLength(2);
		const [first, second] = [...layer.querySelectorAll("canvas")];
		expect(second.style.top).toBe("24px");
		expect(second.style.width).toBe("80px");
		expect(first.style.width).toBe("200px");
	});

	it("paints particles on wrapped fragments that start further left than the first fragment", () => {
		const { layer, engine } = createEngine({ count: 4, bloom: false });
		// Union-relative geometry: the second line (x:0) wraps further left
		// than the first (x:100). Both canvases must render particles.
		engine.setRects([
			{ x: 100, y: 0, width: 100, height: 20 },
			{ x: 0, y: 20, width: 100, height: 20 },
		]);
		const contexts = getCanvasContexts(layer);
		expect(contexts[0].arc).toHaveBeenCalled();
		expect(contexts[1].arc).toHaveBeenCalled();
	});

	it("scales canvas backing stores by devicePixelRatio", () => {
		Object.defineProperty(globalThis, "devicePixelRatio", { value: 2, configurable: true });
		const { layer, engine } = createEngine();
		engine.setRects([{ x: 0, y: 0, width: 50, height: 20 }]);

		const canvas = layer.querySelector("canvas")!;
		expect(canvas.width).toBe(100);
		expect(canvas.height).toBe(40);

		const ctx = getCanvasContexts(layer)[0];
		expect(ctx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
	});

	it("derives particle count from density when no explicit count is provided", () => {
		const { layer, engine } = createEngine({ density: 12 });
		// 100 x 20 = 2000px² -> 2000 / 10000 * 12 = 2.4 -> 2 particles
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);

		const ctx = getCanvasContexts(layer)[0];
		expect(engine.particles).toHaveLength(2);
		expect(ctx.arc).toHaveBeenCalledTimes(2);
	});

	it("prefers explicit particleCount over density", () => {
		const { engine } = createEngine({ count: 7, density: 1000 });
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		expect(engine.particles).toHaveLength(7);
	});

	it("produces zero particles when there is no visible fragment", () => {
		const { engine } = createEngine({ count: 5 });
		engine.setRects([]);
		expect(engine.particles).toHaveLength(0);
	});

	it.each<[ParticleShape, string]>([
		["circle", "arc"],
		["square", "fillRect"],
		["triangle", "closePath"],
		["diamond", "closePath"],
	])("draws %s particles with the expected path calls", (shape, trackedCall) => {
		const { layer, engine } = createEngine({ shape, count: 3, bloom: false });
		engine.setRects([{ x: 0, y: 0, width: 200, height: 40 }]);
		const ctx = getCanvasContexts(layer)[0] as unknown as Record<string, ReturnType<typeof vi.fn>>;

		if (shape === "circle") {
			expect(ctx.arc).toHaveBeenCalledTimes(3);
		}
		else if (shape === "square") {
			// no backdrop fill — exactly one fillRect per square particle
			expect(ctx.fillRect).toHaveBeenCalledTimes(3);
		}
		else {
			expect(ctx.moveTo).toHaveBeenCalledTimes(3);
			expect(ctx[trackedCall]).toHaveBeenCalledTimes(3);
		}
	});

	it("paints particles using particleColor and particleOpacity", () => {
		const { layer, engine } = createEngine({ color: "#ff0000", opacity: 0.5, count: 1, fade: 0 });
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);

		const ctx = getCanvasContexts(layer)[0];
		// fillStyle is last assigned to the particle color
		expect(ctx.fillStyle).toBe("#ff0000");
		expect(ctx.globalAlpha).toBe(0.5);
	});

	it("renders bloom particles through cached glow sprites instead of path fills", () => {
		const { layer, engine } = createEngine({ bloom: true, count: 4, color: "#00ff88" });
		engine.setRects([{ x: 0, y: 0, width: 200, height: 40 }]);

		const ctx = getCanvasContexts(layer)[0];
		expect(ctx.drawImage).toHaveBeenCalledTimes(4);
		expect(ctx.arc).not.toHaveBeenCalled();
	});

	it("shares a single bloom sprite across engines with identical configuration", () => {
		const first = createEngine({ bloom: true, color: "#abcdef", size: 3, shape: "diamond" });
		first.engine.setRects([{ x: 0, y: 0, width: 100, height: 40 }]);
		const firstSprite = (getCanvasContexts(first.layer)[0].drawImage as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];

		const second = createEngine({ bloom: true, color: "#abcdef", size: 3, shape: "diamond" });
		second.engine.setRects([{ x: 0, y: 0, width: 100, height: 40 }]);
		const secondSprite = (getCanvasContexts(second.layer)[0].drawImage as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];

		expect(firstSprite).toBe(secondSprite);
	});

	it("moves particles upward in up mode and wraps them at content edges", () => {
		const { engine } = createEngine({ speed: 1, jitter: 0, motion: "up" });
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		const particle = engine.particles[0];
		const startY = particle.y;

		engine.tick(0.1, 100);
		expect(particle.y).toBeLessThan(startY);
		expect(particle.vy).toBeLessThan(0);

		// move the flow position far beyond the edges, then tick -> it wraps
		particle.fy = -50;
		particle.fx = -50;
		engine.tick(0.1, 200);
		expect(particle.fy).toBeGreaterThanOrEqual(0);
		expect(particle.y).toBe(particle.fy);
		expect(particle.fx).toBeLessThanOrEqual(100 + particle.size + 2);
		expect(particle.x).toBe(particle.fx);
	});

	it("flows particles downward in down mode", () => {
		const { engine } = createEngine({ speed: 1, jitter: 0, motion: "down" });
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		const particle = engine.particles[0];
		expect(particle.vy).toBeGreaterThan(0);
		const startY = particle.y;

		engine.tick(0.1, 100);
		expect(particle.y).toBeGreaterThan(startY);
	});

	it("splits cross-mode particles into two interleaved opposing streams", () => {
		// Real randomness: the only robust assertion against internal random
		// call ordering is the statistical 50/50 split over many particles.
		vi.restoreAllMocks();
		const { engine } = createEngine({ speed: 1, jitter: 0, motion: "cross", count: 100 });
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);

		const upward = engine.particles.filter(particle => particle.vy < 0).length;
		const downward = engine.particles.filter(particle => particle.vy > 0).length;
		expect(upward).toBeGreaterThan(20);
		expect(downward).toBeGreaterThan(20);
		expect(upward + downward).toBe(100);
	});

	it("is the default motion and paints particles of both directions", () => {
		const { engine } = createEngine({ count: 2 });
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		expect(engine.particles[0].motion).toBe("cross");
	});

	it("breathes particle alpha from transparent to colored and back over the fade period", () => {
		const { layer, engine } = createEngine({
			motion: "up",
			count: 1,
			opacity: 1,
			jitter: 0,
			speed: 0,
			fade: 1000,
		});
		engine.setRects([{ x: 0, y: 0, width: 100, height: 40 }]);
		const ctx = getCanvasContexts(layer)[0];
		// Math.random is mocked to 0.5 -> phase π and fadeFactor 1.
		expect(engine.particles[0].fadeFactor).toBeCloseTo(1, 5);

		engine.render(0);
		expect(ctx.globalAlpha).toBeCloseTo(1, 5);
		engine.render(250);
		expect(ctx.globalAlpha).toBeCloseTo(0.5, 5);
		engine.render(500);
		expect(ctx.globalAlpha).toBeCloseTo(0, 5);
		engine.render(1000);
		expect(ctx.globalAlpha).toBeCloseTo(1, 5);
	});

	it("multiplies the breathing alpha by the configured particle opacity", () => {
		const { layer, engine } = createEngine({
			motion: "cross",
			count: 1,
			opacity: 0.4,
			jitter: 0,
			speed: 0,
			fade: 1000,
		});
		engine.setRects([{ x: 0, y: 0, width: 100, height: 40 }]);
		const ctx = getCanvasContexts(layer)[0];
		engine.render(0);
		expect(ctx.globalAlpha).toBeCloseTo(0.4, 5);
		engine.render(500);
		expect(ctx.globalAlpha).toBeCloseTo(0, 5);
	});

	it("keeps a constant opacity when fade is zero", () => {
		const { layer, engine } = createEngine({ count: 1, opacity: 0.9, fade: 0 });
		engine.setRects([{ x: 0, y: 0, width: 100, height: 40 }]);
		const ctx = getCanvasContexts(layer)[0];
		for (const now of [0, 137, 999, 4000]) {
			engine.render(now);
			expect(ctx.globalAlpha).toBe(0.9);
		}
	});

	it("breathes orbit particles too while keeping them on their anchors", () => {
		const { layer, engine } = createEngine({
			motion: "orbit",
			count: 1,
			opacity: 1,
			jitter: 0,
			speed: 0,
			fade: 1000,
		});
		engine.setRects([{ x: 0, y: 0, width: 100, height: 40 }]);
		const ctx = getCanvasContexts(layer)[0];
		const particle = engine.particles[0];

		engine.render(0);
		expect(ctx.globalAlpha).toBeCloseTo(1, 5);
		engine.render(500);
		expect(ctx.globalAlpha).toBeCloseTo(0, 5);
		expect(particle.x).toBe(particle.ax);
		expect(particle.y).toBe(particle.ay);
	});

	it("keeps the animation loop alive for breathing even when movement is frozen", () => {
		const { engine } = createEngine({ speed: 0, jitter: 0, fade: 1000 });
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		expect(rafPending()).toBe(1);
	});

	it("keeps particles static when speed and jitter are both zero", () => {
		const { engine } = createEngine({ speed: 0, jitter: 0 });
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		const before = { ...engine.particles[0] };
		engine.tick(1, 1000);
		expect(engine.particles[0]).toMatchObject(before);
	});

	it("does not schedule animation frames when speed and fade are both zero", () => {
		const { engine } = createEngine({ speed: 0, jitter: 5, fade: 0 });
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		expect(rafPending()).toBe(0);
	});

	it("bounds flow wander to the jitter pixel amplitude instead of accumulating", () => {
		const { engine } = createEngine({ speed: 0, jitter: 3, motion: "up" });
		engine.setRects([{ x: 0, y: 0, width: 200, height: 40 }]);
		const particle = engine.particles[0];
		particle.phase = 0;
		let moved = false;

		for (let second = 0; second < 10; second += 0.1) {
			engine.tick(0.1, second * 1000);
			// With speed 0 the flow position is pinned; only the bounded
			// wander offset may move the rendered position.
			const offsetX = particle.x - particle.fx;
			const offsetY = particle.y - particle.fy;
			expect(Math.abs(offsetX)).toBeLessThanOrEqual(3 + 1e-6);
			expect(Math.abs(offsetY)).toBeLessThanOrEqual(1.8 + 1e-6);
			if (Math.abs(offsetX) > 0.01)
				moved = true;
		}
		expect(moved).toBe(true);
	});

	it("circles orbit particles around a fixed anchor within the jitter radius", () => {
		const { engine } = createEngine({ speed: 1, jitter: 4, motion: "orbit" });
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		const particle = engine.particles[0];
		const { ax, ay } = particle;
		// The initial static frame paints particles exactly on their anchor.
		expect(particle.x).toBe(ax);
		expect(particle.y).toBe(ay);
		expect(particle.angularSpeed).not.toBe(0);

		const maxRadius = 4 * particle.radiusFactor * 1.6 + 1e-6;
		let moved = false;
		for (let second = 0; second < 5; second += 0.1) {
			engine.tick(0.1, second * 1000);
			expect(Math.abs(particle.x - ax)).toBeLessThanOrEqual(maxRadius);
			expect(Math.abs(particle.y - ay)).toBeLessThanOrEqual(maxRadius);
			if (Math.hypot(particle.x - ax, particle.y - ay) > 0.01)
				moved = true;
		}
		expect(moved).toBe(true);
		// The anchor itself never migrates.
		expect(particle.ax).toBe(ax);
		expect(particle.ay).toBe(ay);
	});

	it("pins orbit particles to their anchor when jitter is zero", () => {
		const { engine } = createEngine({ speed: 1, jitter: 0, motion: "orbit", fade: 0 });
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		expect(rafPending()).toBe(0);

		const particle = engine.particles[0];
		engine.tick(1, 1000);
		expect(particle.x).toBe(particle.ax);
		expect(particle.y).toBe(particle.ay);
	});

	it("reseeds particles when the motion algorithm changes at runtime", () => {
		const options: BluffSpoilerOptions = {
			...DEFAULT_PARTICLE_OPTIONS,
			speed: 1,
			jitter: 4,
			motion: "down",
		};
		const layer = createLayer();
		const engine = new ParticleEngine(layer, () => options);
		liveEngines.push(engine);
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		const particle = engine.particles[0];
		expect(particle.vy).toBeGreaterThan(0);

		options.motion = "orbit";
		engine.refresh();
		expect(particle.motion).toBe("orbit");
		expect(particle.vy).toBe(0);
		expect(particle.angularSpeed).not.toBe(0);

		engine.tick(0.1, 100);
		expect(Math.hypot(particle.x - particle.ax, particle.y - particle.ay)).toBeGreaterThan(0);
	});

	it("rebalances particle count when the covered area changes", () => {
		const { engine } = createEngine({ density: 12 });
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		expect(engine.particles).toHaveLength(2);

		engine.setRects([{ x: 0, y: 0, width: 500, height: 100 }]);
		expect(engine.particles.length).toBeGreaterThan(2);
	});

	it("does not recreate canvases when fragment geometry is unchanged", () => {
		const { layer, engine } = createEngine();
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		const canvas = layer.querySelector("canvas");
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		expect(layer.querySelector("canvas")).toBe(canvas);
	});

	it("respects prefers-reduced-motion by rendering a static frame", () => {
		const { engine } = createEngine({ speed: 2, jitter: 2 });
		engine.setReducedMotion(true);
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		engine.setActive(true);
		expect(rafPending()).toBe(0);

		const before = engine.particles[0].y;
		engine.tick(0.5, 500);
		expect(engine.particles[0].y).toBe(before);
	});

	it("registers a single shared animation frame for all active engines", () => {
		const first = createEngine();
		const second = createEngine();
		first.engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		second.engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		first.engine.setActive(true);
		second.engine.setActive(true);
		expect(rafPending()).toBe(1);

		const firstCtx = getCanvasContexts(first.layer)[0] as unknown as Record<string, ReturnType<typeof vi.fn>>;
		const secondCtx = getCanvasContexts(second.layer)[0] as unknown as Record<string, ReturnType<typeof vi.fn>>;
		const firstCalls = firstCtx.arc.mock.calls.length;
		const secondCalls = secondCtx.arc.mock.calls.length;
		rafTick(100);
		expect(firstCtx.arc.mock.calls.length).toBeGreaterThan(firstCalls);
		expect(secondCtx.arc.mock.calls.length).toBeGreaterThan(secondCalls);

		first.engine.setActive(false);
		second.engine.setActive(false);
		expect(rafPending()).toBe(0);
	});

	it("pauses animation when offscreen and resumes when visible again", () => {
		const { engine } = createEngine();
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		engine.setActive(false);
		expect(rafPending()).toBe(0);
		engine.setActive(true);
		expect(rafPending()).toBe(1);
	});

	it("paints no backdrop at all so the field stays transparent", () => {
		const layer = createLayer();
		layer.style.setProperty("--bluff-spoiler-bg", "rgb(1, 2, 3)");
		const options = { ...DEFAULT_PARTICLE_OPTIONS, count: 0 };
		const engine = new ParticleEngine(layer, () => options);
		engine.setRects([{ x: 0, y: 0, width: 40, height: 20 }]);
		const ctx = getCanvasContexts(layer)[0];
		expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 40, 20);
		expect(ctx.fillRect).not.toHaveBeenCalled();
		expect(ctx.arc).not.toHaveBeenCalled();
	});

	it("dispose removes canvases and unregisters from the animation loop", () => {
		const { layer, engine } = createEngine();
		engine.setRects([{ x: 0, y: 0, width: 100, height: 20 }]);
		engine.setActive(true);
		engine.dispose();

		expect(layer.querySelectorAll("canvas")).toHaveLength(0);
		expect(rafPending()).toBe(0);
	});
});
