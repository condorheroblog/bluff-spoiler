/**
 * Shared types, defaults and small parsing helpers for
 * the `bluff-spoiler` custom element.
 */

export type ParticleShape = "circle" | "square" | "triangle" | "diamond";

export const PARTICLE_SHAPES = ["circle", "square", "triangle", "diamond"] as const;

/**
 * Particle motion algorithm:
 * - `up`: particles drift from bottom to top and wrap around the edges.
 * - `down`: particles drift from top to bottom and wrap around the edges.
 * - `cross`: particles split into two interleaved groups flowing in opposite
 *   directions, crossing each other.
 * - `orbit`: each particle circles irregularly around a fixed anchor point.
 */
export type ParticleMotion = "up" | "down" | "cross" | "orbit";

export const PARTICLE_MOTIONS = ["up", "down", "cross", "orbit"] as const;

/** Shape of the opaque overlay, relative to its host (CSS pixels). */
export interface FragmentRect {
	x: number
	y: number
	width: number
	height: number
}

/** All configurable aspects of the particle field. */
export interface BluffSpoilerOptions {
	/** Particle fill color. Any valid CSS color. */
	color: string
	/** Particle radius in CSS pixels. */
	size: number
	/** Particles per 10,000 CSS-pixel² of covered area. */
	density: number
	/** Fixed particle count; `null` derives the count from {@link density}. */
	count: number | null
	/** Whether particles glow via a pre-rendered bloom sprite. */
	bloom: boolean
	/** Particle opacity in the 0–1 range. */
	opacity: number
	/** Movement speed multiplier (`0` freezes every motion). */
	speed: number
	/**
	 * Idle drift amplitude in CSS pixels (radius).
	 * In flow modes (`up`/`down`/`cross`) it is the random wander radius
	 * overlaid on the flow path; in `orbit` mode it is the circling radius.
	 * `0` removes irregular drift (particles stay put in `orbit`, flow stays
	 * linear).
	 */
	jitter: number
	/** Geometric shape of every particle. */
	shape: ParticleShape
	/** Motion algorithm / direction. */
	motion: ParticleMotion
	/**
	 * Duration in milliseconds of the particle-field fade when the spoiler
	 * toggles between hidden and revealed (`0` = instant).
	 */
	transition: number
	/**
	 * Period in milliseconds of each particle's alpha breathing: its opacity
	 * cycles fully from transparent to colored and back. Per-particle periods
	 * and phases are randomized so the field shimmers asynchronously. `0`
	 * disables breathing (particles keep a constant opacity).
	 */
	fade: number
}

export const DEFAULT_PARTICLE_OPTIONS: BluffSpoilerOptions = {
	color: "#1fa669",
	size: 0.8,
	density: 2500,
	count: null,
	bloom: false,
	opacity: 0.9,
	speed: 0.5,
	jitter: 2,
	shape: "circle",
	motion: "cross",
	transition: 300,
	fade: 2000,
};

/** Area (CSS px²) represented by one density unit. */
export const DENSITY_AREA = 10_000;

export type BluffSpoilerToggleSource = "pointer" | "keyboard" | "api";

export interface BluffSpoilerToggleDetail {
	/** The state the component is about to enter. */
	revealed: boolean
	/** What triggered the toggle. */
	source: BluffSpoilerToggleSource
}

export interface BluffSpoilerStateDetail {
	/** What caused the state change. */
	source: BluffSpoilerToggleSource
}

/**
 * Subset of CanvasRenderingContext2D the engine relies on. Kept explicit so
 * the engine can be unit-tested against a lightweight stub.
 */
export interface Context2DLike {
	fillStyle: string | CanvasGradient | CanvasPattern
	strokeStyle: string | CanvasGradient | CanvasPattern
	globalAlpha: number
	shadowColor: string
	shadowBlur: number
	setTransform: (a: number, b: number, c: number, d: number, e: number, f: number) => void
	save: () => void
	restore: () => void
	translate: (x: number, y: number) => void
	beginPath: () => void
	closePath: () => void
	moveTo: (x: number, y: number) => void
	lineTo: (x: number, y: number) => void
	arc: (x: number, y: number, radius: number, startAngle: number, endAngle: number) => void
	rect: (x: number, y: number, width: number, height: number) => void
	fill: () => void
	fillRect: (x: number, y: number, width: number, height: number) => void
	clearRect: (x: number, y: number, width: number, height: number) => void
	drawImage: (image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number) => void
}

export function createDefaultOptions(): BluffSpoilerOptions {
	return { ...DEFAULT_PARTICLE_OPTIONS };
}

export function isParticleShape(value: unknown): value is ParticleShape {
	return typeof value === "string" && (PARTICLE_SHAPES as readonly string[]).includes(value);
}

export function isParticleMotion(value: unknown): value is ParticleMotion {
	return typeof value === "string" && (PARTICLE_MOTIONS as readonly string[]).includes(value);
}

/**
 * Parse a float attribute with a default and an inclusive numeric range.
 * Returns the default when the value cannot be parsed.
 */
export function parseClampedNumber(
	value: string | null,
	fallback: number,
	min: number,
	max: number,
): number {
	if (value === null)
		return fallback;
	const parsed = Number.parseFloat(value);
	if (!Number.isFinite(parsed))
		return fallback;
	return Math.min(max, Math.max(min, parsed));
}

/** Parse the particle-count attribute: positive integer or `null` (auto). */
export function parseCount(value: string | null): number | null {
	if (value === null)
		return null;
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed < 0)
		return null;
	return parsed;
}
