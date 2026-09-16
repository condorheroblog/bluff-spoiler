import { describe, expect, it, vi } from "vitest";
import { mockClientRects } from "../test/setup";
import { BluffSpoilerElement, defineBluffSpoiler } from "./bluff-spoiler";
import { DEFAULT_PARTICLE_OPTIONS } from "./types";

defineBluffSpoiler();

function rafTick(time = 16): void {
	(globalThis as unknown as { __rafTick__: (t: number) => void }).__rafTick__(time);
}

function setReducedMotion(value: boolean): void {
	(globalThis as unknown as { __setReducedMotion__: (v: boolean) => void }).__setReducedMotion__(value);
}

function mountSpoiler(content = "secret"): BluffSpoilerElement {
	const element = document.createElement("bluff-spoiler") as BluffSpoilerElement;
	element.textContent = content;
	document.body.appendChild(element);
	return element;
}

function mockSingleLine(element: BluffSpoilerElement, width = 100, height = 20): void {
	mockClientRects(element, [{ x: 0, y: 0, width, height }]);
}

function getLayer(element: BluffSpoilerElement): HTMLDivElement {
	return element.shadowRoot!.querySelector(".bluff-layer") as HTMLDivElement;
}

describe("bluff-spoiler element — registration and defaults", () => {
	it("registers a kebab-case custom element and upgrades markup", () => {
		expect(customElements.get("bluff-spoiler")).toBe(BluffSpoilerElement);
		const element = mountSpoiler();
		expect(element).toBeInstanceOf(BluffSpoilerElement);
		expect(element.shadowRoot).not.toBeNull();
		document.body.innerHTML = "";
	});

	it("renders a slot for the sensitive content and an overlay layer", () => {
		const element = mountSpoiler("张三");
		const slot = element.shadowRoot!.querySelector("slot");
		expect(slot).not.toBeNull();
		expect(element.textContent).toBe("张三");

		const layer = getLayer(element);
		expect(layer).toBeTruthy();
		expect(layer.getAttribute("aria-hidden")).toBe("true");
		expect(element.getAttribute("role")).toBe("button");
		expect(element.getAttribute("tabindex")).toBe("0");
		expect(element.getAttribute("aria-pressed")).toBe("false");
		document.body.innerHTML = "";
	});

	it("exposes the documented default option values", () => {
		const element = mountSpoiler();
		expect(element.revealed).toBe(false);
		expect(element.particleColor).toBe(DEFAULT_PARTICLE_OPTIONS.color);
		expect(element.particleSize).toBe(DEFAULT_PARTICLE_OPTIONS.size);
		expect(element.particleDensity).toBe(DEFAULT_PARTICLE_OPTIONS.density);
		expect(element.particleCount).toBeNull();
		expect(element.particleBloom).toBe(false);
		expect(element.particleOpacity).toBe(DEFAULT_PARTICLE_OPTIONS.opacity);
		expect(element.particleSpeed).toBe(DEFAULT_PARTICLE_OPTIONS.speed);
		expect(element.particleJitter).toBe(DEFAULT_PARTICLE_OPTIONS.jitter);
		expect(element.particleShape).toBe("circle");
		expect(element.particleMotion).toBe(DEFAULT_PARTICLE_OPTIONS.motion);
		expect(element.particleTransition).toBe(DEFAULT_PARTICLE_OPTIONS.transition);
		expect(element.particleFade).toBe(DEFAULT_PARTICLE_OPTIONS.fade);
		document.body.innerHTML = "";
	});

	it("starts hidden with a particle canvas over the content", () => {
		const element = mountSpoiler();
		mockSingleLine(element);
		rafTick();
		const canvas = getLayer(element).querySelector("canvas");
		expect(canvas).not.toBeNull();
		expect(canvas!.style.width).toBe("100px");
		document.body.innerHTML = "";
	});

	it("hides masked glyphs with transparent text instead of an opaque backdrop", () => {
		const element = mountSpoiler("secret");
		const sheet = element.shadowRoot!.querySelector("style")!.textContent!;
		// masked state: transparent glyphs, no text selection leak
		expect(sheet).toContain(":host(:not([revealed]))");
		expect(sheet).toMatch(/color:\s*transparent/);
		expect(sheet).toMatch(/user-select:\s*none/);
		// explicitly styled slotted children must also lose their color
		expect(sheet).toContain("::slotted(*)");
		expect(sheet).toMatch(/-webkit-text-fill-color:\s*transparent/);
		// no opaque backdrop variable remains
		expect(sheet).not.toContain("--bluff-spoiler-bg");
		document.body.innerHTML = "";
	});

	it("lets every masked character wrap independently onto its own line", () => {
		const element = mountSpoiler("4242424242424242");
		const sheet = element.shadowRoot!.querySelector("style")!.textContent!;
		expect(sheet).toMatch(/word-break:\s*break-all/);
		expect(sheet).toMatch(/overflow-wrap:\s*anywhere/);
		document.body.innerHTML = "";
	});
});

describe("bluff-spoiler element — click toggling and events", () => {
	it("reveals on first click and hides again on the second click", () => {
		const element = mountSpoiler("130");
		mockSingleLine(element, 40, 20);
		rafTick();
		expect(getLayer(element).querySelector("canvas")).toBeTruthy();

		element.click();
		expect(element.revealed).toBe(true);
		expect(element.hasAttribute("revealed")).toBe(true);
		expect(element.getAttribute("aria-pressed")).toBe("true");
		expect(getLayer(element).style.opacity).toBe("0");
		expect(getLayer(element).style.visibility).toBe("hidden");
		expect(element.textContent).toBe("130");

		element.click();
		expect(element.revealed).toBe(false);
		expect(element.hasAttribute("revealed")).toBe(false);
		expect(getLayer(element).style.opacity).toBe("");
		document.body.innerHTML = "";
	});

	it("emits cancelable toggle followed by reveal/hide events with state details", () => {
		const element = mountSpoiler();
		mockSingleLine(element);
		rafTick();
		const order: string[] = [];
		const toggleDetail: Array<{ revealed: boolean, source: string }> = [];

		element.addEventListener("toggle", (event) => {
			order.push("toggle");
			toggleDetail.push((event as CustomEvent).detail);
		});
		element.addEventListener("reveal", () => order.push("reveal"));
		element.addEventListener("hide", () => order.push("hide"));

		element.click();
		element.click();

		expect(order).toEqual(["toggle", "reveal", "toggle", "hide"]);
		expect(toggleDetail).toEqual([
			{ revealed: true, source: "pointer" },
			{ revealed: false, source: "pointer" },
		]);
		document.body.innerHTML = "";
	});

	it("keeps the content hidden when a toggle listener calls preventDefault", () => {
		const element = mountSpoiler();
		mockSingleLine(element);
		rafTick();
		element.addEventListener("toggle", (event: Event) => event.preventDefault());
		element.click();
		expect(element.revealed).toBe(false);
		expect(element.hasAttribute("revealed")).toBe(false);
		document.body.innerHTML = "";
	});

	it("still receives a native click event for custom business logic", () => {
		const element = mountSpoiler();
		mockSingleLine(element);
		rafTick();
		const onClick = vi.fn();
		element.addEventListener("click", onClick);
		element.click();
		expect(onClick).toHaveBeenCalledTimes(1);
		document.body.innerHTML = "";
	});

	it("toggles with Enter and Space keyboard activation", () => {
		const element = mountSpoiler();
		mockSingleLine(element);
		rafTick();

		element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
		expect(element.revealed).toBe(true);

		const spaceEvent = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
		element.dispatchEvent(spaceEvent);
		expect(spaceEvent.defaultPrevented).toBe(true);
		expect(element.revealed).toBe(false);

		element.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
		expect(element.revealed).toBe(false);
		document.body.innerHTML = "";
	});

	it("exposes a public toggle() method marked with the api source", () => {
		const element = mountSpoiler();
		mockSingleLine(element);
		rafTick();
		const detail = vi.fn();
		element.addEventListener("toggle", (event: Event) => detail((event as CustomEvent).detail));

		element.toggle();
		expect(element.revealed).toBe(true);
		element.toggle(false);
		expect(element.revealed).toBe(false);
		element.toggle(true);
		expect(element.revealed).toBe(true);
		expect(detail).toHaveBeenCalledTimes(3);
		expect(detail.mock.calls[0][0].source).toBe("api");

		// forcing the current state is a no-op and emits no event
		element.toggle(true);
		expect(detail).toHaveBeenCalledTimes(3);
		document.body.innerHTML = "";
	});
});

describe("bluff-spoiler element — attributes and properties", () => {
	it("maps particle-* attributes to camelCase properties", () => {
		const element = mountSpoiler();
		element.setAttribute("particle-color", "#ff0000");
		element.setAttribute("particle-size", "4");
		element.setAttribute("particle-density", "30");
		element.setAttribute("particle-count", "9");
		element.setAttribute("particle-bloom", "");
		element.setAttribute("particle-opacity", "0.4");
		element.setAttribute("particle-speed", "2.5");
		element.setAttribute("particle-jitter", "3");
		element.setAttribute("particle-shape", "triangle");
		element.setAttribute("particle-motion", "orbit");
		element.setAttribute("particle-transition", "500");
		element.setAttribute("particle-fade", "800");

		expect(element.particleColor).toBe("#ff0000");
		expect(element.particleSize).toBe(4);
		expect(element.particleDensity).toBe(30);
		expect(element.particleCount).toBe(9);
		expect(element.particleBloom).toBe(true);
		expect(element.particleOpacity).toBe(0.4);
		expect(element.particleSpeed).toBe(2.5);
		expect(element.particleJitter).toBe(3);
		expect(element.particleShape).toBe("triangle");
		expect(element.particleMotion).toBe("orbit");
		expect(element.particleTransition).toBe(500);
		expect(element.style.getPropertyValue("--bluff-spoiler-transition")).toBe("500ms");
		expect(element.particleFade).toBe(800);
		document.body.innerHTML = "";
	});

	it("reflects property assignments back to attributes", () => {
		const element = mountSpoiler();
		element.particleColor = "#123456";
		element.particleSize = 5;
		element.particleCount = 12;
		element.particleBloom = true;
		element.particleShape = "diamond";
		element.particleMotion = "down";
		element.particleTransition = 400;
		element.particleFade = 1200;

		expect(element.getAttribute("particle-color")).toBe("#123456");
		expect(element.getAttribute("particle-size")).toBe("5");
		expect(element.getAttribute("particle-count")).toBe("12");
		expect(element.hasAttribute("particle-bloom")).toBe(true);
		expect(element.getAttribute("particle-shape")).toBe("diamond");
		expect(element.getAttribute("particle-motion")).toBe("down");
		expect(element.getAttribute("particle-transition")).toBe("400");
		expect(element.style.getPropertyValue("--bluff-spoiler-transition")).toBe("400ms");
		expect(element.getAttribute("particle-fade")).toBe("1200");

		element.particleBloom = false;
		element.particleCount = null;
		expect(element.hasAttribute("particle-bloom")).toBe(false);
		expect(element.hasAttribute("particle-count")).toBe(false);
		document.body.innerHTML = "";
	});

	it("falls back to defaults for invalid numeric or shape values", () => {
		const element = mountSpoiler();
		element.setAttribute("particle-size", "abc");
		element.setAttribute("particle-opacity", "nope");
		element.setAttribute("particle-shape", "hexagon");
		element.setAttribute("particle-motion", "sideways");
		element.setAttribute("particle-transition", "fast");
		element.setAttribute("particle-fade", "slow");
		expect(element.particleSize).toBe(DEFAULT_PARTICLE_OPTIONS.size);
		expect(element.particleOpacity).toBe(DEFAULT_PARTICLE_OPTIONS.opacity);
		expect(element.particleShape).toBe("circle");
		expect(element.particleMotion).toBe(DEFAULT_PARTICLE_OPTIONS.motion);
		expect(element.particleTransition).toBe(DEFAULT_PARTICLE_OPTIONS.transition);

		element.setAttribute("particle-transition", "-50");
		expect(element.particleTransition).toBe(0);
		element.setAttribute("particle-transition", "99999");
		expect(element.particleTransition).toBe(2000);
		expect(element.particleFade).toBe(DEFAULT_PARTICLE_OPTIONS.fade);
		element.setAttribute("particle-fade", "-50");
		expect(element.particleFade).toBe(0);
		element.setAttribute("particle-fade", "99999");
		expect(element.particleFade).toBe(10000);

		element.setAttribute("particle-size", "-100");
		element.setAttribute("particle-opacity", "5");
		expect(element.particleSize).toBe(0.5);
		expect(element.particleOpacity).toBe(1);
		document.body.innerHTML = "";
	});

	it("treats a removed or invalid particle-count attribute as automatic density", () => {
		const element = mountSpoiler();
		element.setAttribute("particle-count", "x");
		expect(element.particleCount).toBeNull();
		element.setAttribute("particle-count", "6.8");
		expect(element.particleCount).toBe(6);
		document.body.innerHTML = "";
	});

	it("accepts the revealed attribute for initially revealed content", () => {
		const element = document.createElement("bluff-spoiler") as BluffSpoilerElement;
		element.setAttribute("revealed", "");
		element.textContent = "visible from the start";
		document.body.appendChild(element);
		mockSingleLine(element);
		rafTick();

		expect(element.revealed).toBe(true);
		expect(getLayer(element).style.opacity).toBe("0");
		expect(getLayer(element).style.visibility).toBe("hidden");

		element.click();
		rafTick();
		expect(element.revealed).toBe(false);
		expect(getLayer(element).querySelector("canvas")).toBeTruthy();
		document.body.innerHTML = "";
	});
});

describe("bluff-spoiler element — inline layout and line wrapping", () => {
	it("keeps inline flow and positions canvases over every wrapped line fragment", () => {
		const element = mountSpoiler("a very long secret that wraps onto several lines");
		mockClientRects(element, [
			{ x: 0, y: 0, width: 200, height: 20 },
			{ x: 0, y: 24, width: 160, height: 20 },
			{ x: 0, y: 48, width: 40, height: 20 },
		]);
		rafTick();

		const layer = getLayer(element);
		expect(layer.style.width).toBe("200px");
		expect(layer.style.height).toBe("68px");
		const canvases = [...layer.querySelectorAll("canvas")];
		expect(canvases).toHaveLength(3);
		expect(canvases[2].style.top).toBe("48px");
		expect(canvases[2].style.width).toBe("40px");
		document.body.innerHTML = "";
	});

	it("shifts the union-sized layer onto fragments that wrap further left than the first", () => {
		const element = mountSpoiler("wrapped");
		// The first fragment sits mid-line at x=100; the wrapped second line
		// starts at x=0. The engine keeps non-negative union-relative rects;
		// the layer itself is shifted by -100px because a relative inline
		// host anchors the containing block at its FIRST line fragment.
		mockClientRects(element, [
			{ x: 100, y: 0, width: 120, height: 20 },
			{ x: 0, y: 24, width: 60, height: 20 },
		]);
		rafTick();

		const layer = getLayer(element);
		// the layer box reports the union box size...
		expect(layer.style.width).toBe("220px");
		expect(layer.style.height).toBe("44px");
		// ...and is shifted so its origin lands on the first fragment
		expect(layer.style.left).toBe("-100px");
		expect(layer.style.top).toBe("0px");
		const canvases = [...layer.querySelectorAll("canvas")];
		// canvases stay on non-negative, union-relative coordinates
		expect(canvases[0].style.left).toBe("100px");
		expect(canvases[0].style.top).toBe("0px");
		expect(canvases[1].style.left).toBe("0px");
		expect(canvases[1].style.top).toBe("24px");
		document.body.innerHTML = "";
	});

	it("anchors the layer at the last-flow fragment under writing-mode: vertical-rl", () => {
		const element = mountSpoiler("枫落吴江冷");
		// Columns progress right-to-left: getClientRects() lists the first
		// column fragment first (right column, lower down) and the wrapped
		// second-column fragment last (left column, at the top). The absolute
		// containing block starts at (lastRect.left, firstRect.top).
		element.style.writingMode = "vertical-rl";
		mockClientRects(element, [
			{ x: 38, y: 182, width: 21, height: 81 },
			{ x: 0, y: 0, width: 21, height: 20 },
		]);
		rafTick();

		const layer = getLayer(element);
		// union box is 59x263; it must be pulled UP to the first-column anchor
		expect(layer.style.width).toBe("59px");
		expect(layer.style.height).toBe("263px");
		expect(layer.style.left).toBe("0px");
		expect(layer.style.top).toBe("-182px");
		const canvases = [...layer.querySelectorAll("canvas")];
		expect(canvases[0].style.left).toBe("38px");
		expect(canvases[0].style.top).toBe("182px");
		expect(canvases[1].style.left).toBe("0px");
		expect(canvases[1].style.top).toBe("0px");
		document.body.innerHTML = "";
	});

	it("ignores zero-area client rects", () => {
		const element = mountSpoiler("");
		mockClientRects(element, [{ x: 0, y: 0, width: 0, height: 0 }]);
		rafTick();
		expect(getLayer(element).querySelectorAll("canvas")).toHaveLength(0);
		document.body.innerHTML = "";
	});

	it("rebuilds fragments when ResizeObserver reports a new size", () => {
		const element = mountSpoiler("dynamic");
		mockClientRects(element, [{ x: 0, y: 0, width: 100, height: 20 }]);
		rafTick();
		expect(getLayer(element).querySelectorAll("canvas")).toHaveLength(1);

		mockClientRects(element, [
			{ x: 0, y: 0, width: 120, height: 20 },
			{ x: 0, y: 24, width: 30, height: 20 },
		]);
		const resizeObservers = (globalThis as unknown as {
			ResizeObserver: { instances: Array<{ $trigger: (rect: { width: number, height: number }) => void }> }
		}).ResizeObserver.instances;
		expect(resizeObservers.length).toBeGreaterThan(0);
		resizeObservers.forEach(observer => observer.$trigger({ width: 120, height: 44 }));
		rafTick();
		expect(getLayer(element).querySelectorAll("canvas")).toHaveLength(2);
		document.body.innerHTML = "";
	});

	it("re-measures through the shared frame loop when inline fragments change without a ResizeObserver notification", () => {
		const element = mountSpoiler("a long dynamic inline secret");
		mockClientRects(element, [{ x: 0, y: 0, width: 100, height: 20 }]);
		rafTick(16);
		expect(getLayer(element).querySelectorAll("canvas")).toHaveLength(1);

		// An ancestor container shrinks: the inline host wraps onto two lines,
		// but ResizeObserver delivers nothing for the non-replaced inline host.
		mockClientRects(element, [
			{ x: 0, y: 0, width: 80, height: 20 },
			{ x: 0, y: 24, width: 30, height: 20 },
		]);
		// frames inside the poll window are throttled away
		rafTick(100);
		expect(getLayer(element).querySelectorAll("canvas")).toHaveLength(1);
		// once the poll interval elapses the border-box change triggers a measure
		rafTick(320);
		const canvases = getLayer(element).querySelectorAll("canvas");
		expect(canvases).toHaveLength(2);
		expect(canvases[1].style.top).toBe("24px");
		expect(canvases[1].style.width).toBe("30px");
		document.body.innerHTML = "";
	});

	it("re-measures when slotted content changes", () => {
		const element = mountSpoiler("short");
		mockSingleLine(element, 50, 20);
		rafTick();
		const measureSpy = vi.spyOn(element, "getClientRects");

		element.textContent = "a much longer secret value";
		rafTick();
		expect(measureSpy).toHaveBeenCalled();
		document.body.innerHTML = "";
	});
});

describe("bluff-spoiler element — accessibility, motion and lifecycle", () => {
	it("provides an accessible label while hidden and restores content access when revealed", () => {
		const element = mountSpoiler();
		expect(element.getAttribute("aria-label")).toBeTruthy();
		element.click();
		expect(element.hasAttribute("aria-label")).toBe(false);
		element.click();
		expect(element.getAttribute("aria-label")).toBeTruthy();
		document.body.innerHTML = "";
	});

	it("never overwrites a user-provided aria-label", () => {
		const element = document.createElement("bluff-spoiler") as BluffSpoilerElement;
		element.setAttribute("aria-label", "custom label");
		document.body.appendChild(element);
		expect(element.getAttribute("aria-label")).toBe("custom label");
		element.click();
		expect(element.getAttribute("aria-label")).toBe("custom label");
		document.body.innerHTML = "";
	});

	it("renders a static frame under prefers-reduced-motion without scheduling animation", () => {
		setReducedMotion(true);
		const element = mountSpoiler();
		mockSingleLine(element);
		rafTick();
		expect(getLayer(element).querySelector("canvas")).toBeTruthy();
		const pending = (globalThis as unknown as { __rafPending__: () => number }).__rafPending__();
		expect(pending).toBe(0);
		document.body.innerHTML = "";
	});

	it("pauses the animation while offscreen", () => {
		const element = mountSpoiler();
		mockSingleLine(element);
		rafTick();
		const pending = () => (globalThis as unknown as { __rafPending__: () => number }).__rafPending__();
		expect(pending()).toBe(1);

		const ioInstances = (globalThis as unknown as { IntersectionObserver: { instances: Array<{ $setIntersecting: (v: boolean) => void }> } }).IntersectionObserver.instances;
		ioInstances.forEach(instance => instance.$setIntersecting(false));
		expect(pending()).toBe(0);
		ioInstances.forEach(instance => instance.$setIntersecting(true));
		expect(pending()).toBe(1);
		document.body.innerHTML = "";
	});

	it("stops observing and removes canvases when disconnected", () => {
		const element = mountSpoiler();
		mockSingleLine(element);
		rafTick();
		expect(getLayer(element).querySelector("canvas")).toBeTruthy();
		element.remove();
		expect(() => rafTick()).not.toThrow();
		expect(getLayer(element).querySelectorAll("canvas")).toHaveLength(0);
		document.body.innerHTML = "";
	});
});
