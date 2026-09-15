import { describe, expect, it } from "vitest";
import { BluffSpoilerElement, defineBluffSpoiler } from "./bluff-spoiler";

describe("defineBluffSpoiler with a custom tag name", () => {
	it("registers the element under a user-provided kebab-case name", () => {
		defineBluffSpoiler("secret-spoiler-demo");
		expect(customElements.get("secret-spoiler-demo")).toBe(BluffSpoilerElement);

		const element = document.createElement("secret-spoiler-demo");
		expect(element).toBeInstanceOf(BluffSpoilerElement);
	});

	it("is idempotent for the same custom name", () => {
		defineBluffSpoiler("secret-spoiler-demo");
		expect(() => defineBluffSpoiler("secret-spoiler-demo")).not.toThrow();
	});
});
