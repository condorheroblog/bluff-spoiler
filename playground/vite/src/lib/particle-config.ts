import type { ParticleMotion, ParticleShape } from "bluff-spoiler";

export interface ParticleConfig {
	color: string
	size: number
	density: number
	autoCount: boolean
	count: number
	bloom: boolean
	opacity: number
	speed: number
	jitter: number
	shape: ParticleShape
	motion: ParticleMotion
	transition: number
	fade: number
}

export const defaultParticleConfig: ParticleConfig = {
	color: "#34d399",
	size: 0.6,
	density: 600,
	autoCount: true,
	count: 30,
	bloom: false,
	opacity: 0.9,
	speed: 1,
	jitter: 2,
	shape: "circle",
	motion: "cross",
	transition: 300,
	fade: 2000,
};

export const shapeOptions: ParticleShape[] = ["circle", "square", "triangle", "diamond"];
export const motionOptions: ParticleMotion[] = ["up", "down", "cross", "orbit"];

/** Serialize the current configuration to the equivalent HTML attributes. */
export function buildSnippetMarkup(config: ParticleConfig, content = "secret"): string {
	const attributes: string[] = [
		`particle-color="${config.color}"`,
		`particle-size="${config.size}"`,
		`particle-shape="${config.shape}"`,
		`particle-motion="${config.motion}"`,
		`particle-opacity="${config.opacity}"`,
		`particle-speed="${config.speed}"`,
		`particle-jitter="${config.jitter}"`,
		`particle-transition="${config.transition}"`,
		`particle-fade="${config.fade}"`,
	];
	if (!config.autoCount)
		attributes.push(`particle-count="${config.count}"`);
	else
		attributes.push(`particle-density="${config.density}"`);
	if (config.bloom)
		attributes.push("particle-bloom");

	return `<bluff-spoiler\n  ${attributes.join("\n  ")}\n>${content}</bluff-spoiler>`;
}
