import { describe, expect, it } from "vitest";
import { BluffSpoilerElement, defineBluffSpoiler } from "./bluff-spoiler";
import { DEFAULT_PARTICLE_OPTIONS, PARTICLE_SHAPES } from "./types";
// importing the package entry auto-registers the custom element
import "./index";

describe("package entry", () => {
	it("auto-registers <bluff-spoiler> on import", () => {
		expect(customElements.get("bluff-spoiler")).toBe(BluffSpoilerElement);
		const element = document.createElement("bluff-spoiler");
		expect(element).toBeInstanceOf(BluffSpoilerElement);
	});

	it("is idempotent when registration is requested again", () => {
		expect(() => defineBluffSpoiler()).not.toThrow();
		expect(customElements.get("bluff-spoiler")).toBe(BluffSpoilerElement);
	});

	it("exports the documented option defaults and particle shapes", () => {
		expect(PARTICLE_SHAPES).toEqual(["circle", "square", "triangle", "diamond"]);
		expect(DEFAULT_PARTICLE_OPTIONS.shape).toBe("circle");
		expect(DEFAULT_PARTICLE_OPTIONS.count).toBeNull();
	});
});
