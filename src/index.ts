import type { BluffSpoilerElement } from "./bluff-spoiler";
import { defineBluffSpoiler } from "./bluff-spoiler";

export { BluffSpoilerElement, defineBluffSpoiler } from "./bluff-spoiler";
export { ParticleEngine } from "./particle-engine";
export {
	createDefaultOptions,
	DEFAULT_PARTICLE_OPTIONS,
	DENSITY_AREA,
	isParticleMotion,
	isParticleShape,
	parseClampedNumber,
	parseCount,
	PARTICLE_MOTIONS,
	PARTICLE_SHAPES,
} from "./types";
export type {
	BluffSpoilerOptions,
	BluffSpoilerStateDetail,
	BluffSpoilerToggleDetail,
	BluffSpoilerToggleSource,
	FragmentRect,
	ParticleMotion,
	ParticleShape,
} from "./types";

declare global {
	interface HTMLElementTagNameMap {
		"bluff-spoiler": BluffSpoilerElement
	}
}

// ESM side effect: importing the package makes <bluff-spoiler> available.
defineBluffSpoiler();
