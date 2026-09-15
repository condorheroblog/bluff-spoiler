import type { BluffSpoilerOptions, BluffSpoilerStateDetail, BluffSpoilerToggleDetail, BluffSpoilerToggleSource, FragmentRect, ParticleMotion, ParticleShape } from "./types";
import { ParticleEngine } from "./particle-engine";
import { ticker } from "./ticker";
import {
	createDefaultOptions,
	isParticleMotion,
	isParticleShape,
	parseClampedNumber,
	parseCount,
} from "./types";

const TAG_NAME = "bluff-spoiler";
const REVEALED_ATTRIBUTE = "revealed";

const ATTRIBUTE = {
	color: "particle-color",
	size: "particle-size",
	density: "particle-density",
	count: "particle-count",
	bloom: "particle-bloom",
	opacity: "particle-opacity",
	speed: "particle-speed",
	jitter: "particle-jitter",
	shape: "particle-shape",
	motion: "particle-motion",
	transition: "particle-transition",
	fade: "particle-fade",
} as const;

const HIDDEN_LABEL = "Hidden spoiler, activate to reveal the content";

/**
 * ResizeObserver does not reliably report reflow of non-replaced inline
 * elements (e.g. when an ancestor container gets narrower and the spoiler
 * breaks onto a new line). While the particle loop runs, we poll the host's
 * border box at this cadence and re-measure whenever it changes.
 */
const LAYOUT_POLL_INTERVAL = 200;

const STYLES = `
:host {
	display: inline;
	position: relative;
	box-sizing: border-box;
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;
	/* Every masked character may break onto its own line (incl. long
	   unbroken words / numbers), in both hidden and revealed states, so
	   toggling never causes a layout shift. */
	word-break: break-all;
	overflow-wrap: anywhere;
}
:host([revealed]) {
	cursor: text;
}
:host(:focus-visible) {
	outline: 2px solid var(--bluff-spoiler-focus, #1fa669);
	outline-offset: 2px;
	border-radius: 2px;
}
/* The text itself is rendered transparent while hidden: there is no opaque
   backdrop, the particle field is the only thing visible. Selection is
   disabled so the glyphs cannot leak through a selection highlight. */
:host(:not([revealed])) {
	color: transparent;
	user-select: none;
	-webkit-user-select: none;
}
:host(:not([revealed])) ::slotted(*) {
	color: transparent !important;
	-webkit-text-fill-color: transparent !important;
}
.bluff-layer {
	position: absolute;
	top: 0;
	left: 0;
	pointer-events: auto;
	user-select: none;
	-webkit-user-select: none;
	opacity: 1;
	visibility: visible;
	/* Revealing fades the field out, re-hiding fades it back in. The
	   duration is configurable via --bluff-spoiler-transition; visibility
	   flips at the end of the fade so the layer cannot be focused/clicked
	   while transparent. */
	transition:
		opacity var(--bluff-spoiler-transition, 300ms) ease,
		visibility var(--bluff-spoiler-transition, 300ms) ease;
}
:host([revealed]) .bluff-layer {
	opacity: 0;
	visibility: hidden;
	pointer-events: none;
}
.bluff-particle-canvas {
	position: absolute;
	display: block;
}
@media (prefers-reduced-motion: reduce) {
	.bluff-layer {
		transition: none;
	}
}
`;

export interface BluffSpoilerElementEventMap {
	toggle: CustomEvent<BluffSpoilerToggleDetail>
	reveal: CustomEvent<BluffSpoilerStateDetail>
	hide: CustomEvent<BluffSpoilerStateDetail>
}

/**
 * `<bluff-spoiler>` hides sensitive inline content behind a dense field of
 * living particles on a fully transparent field — the glyphs themselves are
 * rendered transparent, so the field blends into the surrounding background.
 * Click (or keyboard activate) to reveal, click again to re-hide.
 *
 * The host stays `display: inline`; one overlay canvas is created for every
 * line box reported by `getClientRects()`, so the masked area wraps naturally
 * with the surrounding text, breaking at every character when needed.
 */
export class BluffSpoilerElement extends HTMLElement {
	override addEventListener<K extends keyof BluffSpoilerElementEventMap>(
		type: K,
		listener: (event: BluffSpoilerElementEventMap[K]) => void,
		options?: AddEventListenerOptions | boolean,
	): void;
	override addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: AddEventListenerOptions | boolean,
	): void;
	override addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): void {
		super.addEventListener(type, listener, options);
	}

	override removeEventListener<K extends keyof BluffSpoilerElementEventMap>(
		type: K,
		listener: (event: BluffSpoilerElementEventMap[K]) => void,
		options?: EventListenerOptions | boolean,
	): void;
	override removeEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: EventListenerOptions | boolean,
	): void;
	override removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: EventListenerOptions | boolean): void {
		super.removeEventListener(type, listener, options);
	}

	static get observedAttributes(): string[] {
		return [
			REVEALED_ATTRIBUTE,
			ATTRIBUTE.color,
			ATTRIBUTE.size,
			ATTRIBUTE.density,
			ATTRIBUTE.count,
			ATTRIBUTE.bloom,
			ATTRIBUTE.opacity,
			ATTRIBUTE.speed,
			ATTRIBUTE.jitter,
			ATTRIBUTE.shape,
			ATTRIBUTE.motion,
			ATTRIBUTE.transition,
			ATTRIBUTE.fade,
		];
	}

	#options: BluffSpoilerOptions = createDefaultOptions();
	#engine: ParticleEngine | null = null;
	#layer!: HTMLDivElement;

	#revealed = false;
	#visible = true;
	#reducedMotion = false;
	#ownAriaLabel = false;
	#reflecting = false;
	#measureQueued = false;
	#connected = false;

	#resizeObserver: ResizeObserver | null = null;
	#intersectionObserver: IntersectionObserver | null = null;
	#mutationObserver: MutationObserver | null = null;
	#mediaQuery: MediaQueryList | null = null;
	#boundResize = () => this.#scheduleMeasure();
	#lastLayoutCheck = 0;
	#lastHostWidth = -1;
	#lastHostHeight = -1;
	#layoutWatcher = {
		tick: (_deltaSeconds: number, now: number) => this.#watchLayout(now),
	};

	constructor() {
		super();
		const shadow = this.attachShadow({ mode: "open" });

		const style = document.createElement("style");
		style.textContent = STYLES;
		shadow.append(style);

		const slot = document.createElement("slot");
		shadow.append(slot);
		slot.addEventListener("slotchange", this.#boundResize);

		this.#layer = document.createElement("div");
		this.#layer.className = "bluff-layer";
		this.#layer.setAttribute("aria-hidden", "true");
		shadow.append(this.#layer);

		// Attribute mutations are forbidden inside the custom element
		// constructor, so listeners are the only wiring done here.
		this.addEventListener("click", this.#handleClick);
		this.addEventListener("keydown", this.#handleKeydown);
	}

	connectedCallback(): void {
		if (this.#connected)
			return;
		this.#connected = true;

		if (!this.hasAttribute("role"))
			this.setAttribute("role", "button");
		if (!this.hasAttribute("tabindex"))
			this.setAttribute("tabindex", "0");

		this.#readAttributes();
		this.#revealed = this.hasAttribute(REVEALED_ATTRIBUTE);

		this.#engine = new ParticleEngine(this.#layer, () => this.#options);
		this.#reducedMotion = this.#isReducedMotion();
		this.#engine.setReducedMotion(this.#reducedMotion);
		this.#observeMediaQuery();
		this.#observeLayout();
		this.#syncRevealedState();
		this.#scheduleMeasure();

		document.fonts?.ready
			.then(() => this.#scheduleMeasure())
			.catch(() => {});
	}

	disconnectedCallback(): void {
		if (!this.#connected)
			return;
		this.#connected = false;

		ticker.remove(this.#layoutWatcher);
		this.#resizeObserver?.disconnect();
		this.#intersectionObserver?.disconnect();
		this.#mutationObserver?.disconnect();
		window.removeEventListener("resize", this.#boundResize);
		if (this.#mediaQuery) {
			this.#mediaQuery.removeEventListener("change", this.#handleMediaChange);
			this.#mediaQuery = null;
		}
		this.#engine?.dispose();
		this.#engine = null;
	}

	attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
		switch (name) {
			case REVEALED_ATTRIBUTE:
				if (!this.#reflecting)
					this.#syncRevealedState(value !== null);
				return;
			case ATTRIBUTE.color:
				this.#options.color = value && value.trim() ? value : this.#options.color;
				break;
			case ATTRIBUTE.size:
				this.#options.size = parseClampedNumber(value, this.#options.size, 0.5, 24);
				break;
			case ATTRIBUTE.density:
				this.#options.density = parseClampedNumber(value, this.#options.density, 0, 1000);
				break;
			case ATTRIBUTE.count:
				this.#options.count = parseCount(value);
				break;
			case ATTRIBUTE.bloom:
				this.#options.bloom = value !== null;
				break;
			case ATTRIBUTE.opacity:
				this.#options.opacity = parseClampedNumber(value, this.#options.opacity, 0, 1);
				break;
			case ATTRIBUTE.speed:
				this.#options.speed = parseClampedNumber(value, this.#options.speed, 0, 10);
				break;
			case ATTRIBUTE.jitter:
				this.#options.jitter = parseClampedNumber(value, this.#options.jitter, 0, 50);
				break;
			case ATTRIBUTE.shape:
				this.#options.shape = isParticleShape(value) ? value : this.#options.shape;
				break;
			case ATTRIBUTE.motion:
				this.#options.motion = isParticleMotion(value) ? value : this.#options.motion;
				break;
			case ATTRIBUTE.transition:
				this.#options.transition = parseClampedNumber(value, this.#options.transition, 0, 2000);
				this.#syncTransitionVar();
				break;
			case ATTRIBUTE.fade:
				this.#options.fade = parseClampedNumber(value, this.#options.fade, 0, 10000);
				break;
			default:
				return;
		}
		this.#engine?.refresh();
	}

	/* ------------------------------ state ------------------------------ */

	get revealed(): boolean {
		return this.#revealed;
	}

	set revealed(value: boolean) {
		const next = Boolean(value);
		if (next === this.#revealed)
			return;
		this.#reflecting = true;
		this.toggleAttribute(REVEALED_ATTRIBUTE, next);
		this.#reflecting = false;
		this.#syncRevealedState(next);
	}

	/**
	 * Toggle the spoiler programmatically.
	 * Fires the same cancelable `toggle` / `reveal` / `hide` events as user
	 * interaction, with `source: "api"`.
	 */
	toggle(force?: boolean): void {
		const next = force ?? !this.#revealed;
		this.#requestToggle(next, "api");
	}

	/* ------------------------- particle options ------------------------ */

	get particleColor(): string {
		return this.#options.color;
	}

	set particleColor(value: string) {
		const color = String(value);
		if (!color.trim())
			return;
		this.#options.color = color;
		this.setAttribute(ATTRIBUTE.color, color);
	}

	get particleSize(): number {
		return this.#options.size;
	}

	set particleSize(value: number) {
		const size = parseClampedNumber(String(value), this.#options.size, 0.5, 24);
		this.#options.size = size;
		this.setAttribute(ATTRIBUTE.size, String(size));
	}

	get particleDensity(): number {
		return this.#options.density;
	}

	set particleDensity(value: number) {
		const density = parseClampedNumber(String(value), this.#options.density, 0, 1000);
		this.#options.density = density;
		this.setAttribute(ATTRIBUTE.density, String(density));
	}

	get particleCount(): number | null {
		return this.#options.count;
	}

	set particleCount(value: number | null) {
		if (value === null || Number.isNaN(value)) {
			this.#options.count = null;
			this.removeAttribute(ATTRIBUTE.count);
			return;
		}
		const count = Math.max(0, Math.floor(value));
		this.#options.count = count;
		this.setAttribute(ATTRIBUTE.count, String(count));
	}

	get particleBloom(): boolean {
		return this.#options.bloom;
	}

	set particleBloom(value: boolean) {
		this.#options.bloom = Boolean(value);
		this.toggleAttribute(ATTRIBUTE.bloom, Boolean(value));
	}

	get particleOpacity(): number {
		return this.#options.opacity;
	}

	set particleOpacity(value: number) {
		const opacity = parseClampedNumber(String(value), this.#options.opacity, 0, 1);
		this.#options.opacity = opacity;
		this.setAttribute(ATTRIBUTE.opacity, String(opacity));
	}

	get particleSpeed(): number {
		return this.#options.speed;
	}

	set particleSpeed(value: number) {
		const speed = parseClampedNumber(String(value), this.#options.speed, 0, 10);
		this.#options.speed = speed;
		this.setAttribute(ATTRIBUTE.speed, String(speed));
	}

	get particleJitter(): number {
		return this.#options.jitter;
	}

	set particleJitter(value: number) {
		const jitter = parseClampedNumber(String(value), this.#options.jitter, 0, 50);
		this.#options.jitter = jitter;
		this.setAttribute(ATTRIBUTE.jitter, String(jitter));
	}

	get particleShape(): ParticleShape {
		return this.#options.shape;
	}

	set particleShape(value: ParticleShape) {
		if (!isParticleShape(value))
			return;
		this.#options.shape = value;
		this.setAttribute(ATTRIBUTE.shape, value);
	}

	get particleMotion(): ParticleMotion {
		return this.#options.motion;
	}

	set particleMotion(value: ParticleMotion) {
		if (!isParticleMotion(value))
			return;
		this.#options.motion = value;
		this.setAttribute(ATTRIBUTE.motion, value);
	}

	get particleTransition(): number {
		return this.#options.transition;
	}

	set particleTransition(value: number) {
		const duration = parseClampedNumber(String(value), this.#options.transition, 0, 2000);
		this.#options.transition = duration;
		this.setAttribute(ATTRIBUTE.transition, String(duration));
		this.#syncTransitionVar();
	}

	get particleFade(): number {
		return this.#options.fade;
	}

	set particleFade(value: number) {
		const fade = parseClampedNumber(String(value), this.#options.fade, 0, 10000);
		this.#options.fade = fade;
		this.setAttribute(ATTRIBUTE.fade, String(fade));
	}

	/* ----------------------------- internals --------------------------- */

	#readAttributes(): void {
		for (const name of [
			ATTRIBUTE.color,
			ATTRIBUTE.size,
			ATTRIBUTE.density,
			ATTRIBUTE.count,
			ATTRIBUTE.bloom,
			ATTRIBUTE.opacity,
			ATTRIBUTE.speed,
			ATTRIBUTE.jitter,
			ATTRIBUTE.shape,
			ATTRIBUTE.motion,
			ATTRIBUTE.transition,
			ATTRIBUTE.fade,
		] as const) {
			this.attributeChangedCallback(name, null, this.getAttribute(name));
		}
	}

	/** Mirror the fade duration into the CSS variable consumed by STYLES. */
	#syncTransitionVar(): void {
		this.style.setProperty("--bluff-spoiler-transition", `${this.#options.transition}ms`);
	}

	#handleClick = (): void => {
		this.#requestToggle(!this.#revealed, "pointer");
	};

	#handleKeydown = (event: Event): void => {
		const keyboardEvent = event as KeyboardEvent;
		if (keyboardEvent.key === "Enter") {
			this.#requestToggle(!this.#revealed, "keyboard");
		}
		else if (keyboardEvent.key === " ") {
			keyboardEvent.preventDefault();
			this.#requestToggle(!this.#revealed, "keyboard");
		}
	};

	#requestToggle(next: boolean, source: BluffSpoilerToggleSource): void {
		if (next === this.#revealed)
			return;

		const detail: BluffSpoilerToggleDetail = { revealed: next, source };
		const toggleEvent = new CustomEvent<BluffSpoilerToggleDetail>("toggle", {
			bubbles: true,
			composed: true,
			cancelable: true,
			detail,
		});
		if (!this.dispatchEvent(toggleEvent))
			return;

		this.#reflecting = true;
		this.toggleAttribute(REVEALED_ATTRIBUTE, next);
		this.#reflecting = false;
		this.#syncRevealedState(next);

		const stateEventName = next ? "reveal" : "hide";
		const stateDetail: BluffSpoilerStateDetail = { source };
		this.dispatchEvent(new CustomEvent<BluffSpoilerStateDetail>(stateEventName, {
			bubbles: true,
			composed: true,
			detail: stateDetail,
		}));
	}

	#syncRevealedState(revealed: boolean = this.hasAttribute(REVEALED_ATTRIBUTE)): void {
		this.#revealed = revealed;
		// Fade the field instead of toggling display; the CSS transition is
		// driven by --bluff-spoiler-transition (disabled for reduced motion).
		this.#layer.style.opacity = revealed ? "0" : "";
		this.#layer.style.visibility = revealed ? "hidden" : "";
		this.#layer.style.pointerEvents = revealed ? "none" : "";
		this.setAttribute("aria-pressed", String(revealed));
		this.#syncAriaLabel();
		this.#updateActivity();
		if (!revealed && this.#connected)
			this.#scheduleMeasure();
	}

	#syncAriaLabel(): void {
		if (this.#revealed) {
			if (this.#ownAriaLabel) {
				this.removeAttribute("aria-label");
				this.#ownAriaLabel = false;
			}
			return;
		}
		if (!this.hasAttribute("aria-label")) {
			this.setAttribute("aria-label", HIDDEN_LABEL);
			this.#ownAriaLabel = true;
		}
	}

	#updateActivity(): void {
		const active = this.#visible && !this.#revealed && !this.#reducedMotion;
		this.#engine?.setActive(active);
		// The layout watcher shares the particle rAF loop; it is a cheap,
		// throttled border-box check used to catch inline reflows (line wraps)
		// that ResizeObserver fails to deliver for non-replaced inline hosts.
		if (active)
			ticker.add(this.#layoutWatcher);
		else
			ticker.remove(this.#layoutWatcher);
	}

	#watchLayout(now: number): void {
		if (now - this.#lastLayoutCheck < LAYOUT_POLL_INTERVAL)
			return;
		this.#lastLayoutCheck = now;
		if (!this.#connected || this.#revealed)
			return;
		const rect = this.getBoundingClientRect();
		if (rect.width === this.#lastHostWidth && rect.height === this.#lastHostHeight)
			return;
		this.#lastHostWidth = rect.width;
		this.#lastHostHeight = rect.height;
		this.#measure();
	}

	#scheduleMeasure(): void {
		if (this.#measureQueued || !this.#connected)
			return;
		this.#measureQueued = true;
		requestAnimationFrame(() => {
			this.#measureQueued = false;
			this.#measure();
		});
	}

	#measure(): void {
		if (!this.#connected || !this.#engine || this.#revealed)
			return;

		const hostRect = this.getBoundingClientRect();
		const clientRects = [...this.getClientRects()]
			.filter(rect => rect.width > 0 && rect.height > 0);

		this.#lastHostWidth = hostRect.width;
		this.#lastHostHeight = hostRect.height;

		if (clientRects.length === 0 || hostRect.width === 0 || hostRect.height === 0) {
			this.#layer.style.width = "0px";
			this.#layer.style.height = "0px";
			this.#layer.style.left = "0px";
			this.#layer.style.top = "0px";
			this.#engine.setRects([]);
			return;
		}

		// Particle-space coordinates are union-box-relative and therefore
		// always non-negative: every line fragment occupies a sub-rectangle
		// of the union box, and particles are spread/culled in that space.
		const unionLeft = Math.min(...clientRects.map(rect => rect.left));
		const unionTop = Math.min(...clientRects.map(rect => rect.top));
		const fragments: FragmentRect[] = clientRects.map(rect => ({
			x: rect.left - unionLeft,
			y: rect.top - unionTop,
			width: rect.width,
			height: rect.height,
		}));

		// A `position: relative` inline host anchors the absolute containing
		// block at its FIRST (topmost, then leftmost) line fragment rather
		// than at the union box origin. With per-character wrapping a later
		// line often starts further left than the first one, so the layer —
		// sized to the union box — is shifted relative to that origin. The
		// canvases inside keep non-negative union-relative positions, which
		// guarantees particles are painted on every wrapped fragment.
		const anchor = clientRects.reduce((acc, rect) => {
			if (rect.top < acc.top || (rect.top === acc.top && rect.left < acc.left))
				return rect;
			return acc;
		});
		this.#layer.style.left = `${unionLeft - anchor.left}px`;
		this.#layer.style.top = `${unionTop - anchor.top}px`;
		this.#layer.style.width = `${hostRect.width}px`;
		this.#layer.style.height = `${hostRect.height}px`;
		this.#engine.setRects(fragments);
	}

	#observeLayout(): void {
		if (typeof ResizeObserver !== "undefined") {
			this.#resizeObserver = new ResizeObserver(() => this.#scheduleMeasure());
			this.#resizeObserver.observe(this);
		}
		window.addEventListener("resize", this.#boundResize);

		if (typeof IntersectionObserver !== "undefined") {
			this.#intersectionObserver = new IntersectionObserver((entries) => {
				const entry = entries[entries.length - 1];
				if (!entry)
					return;
				this.#visible = entry.isIntersecting;
				this.#updateActivity();
			}, { threshold: 0 });
			this.#intersectionObserver.observe(this);
		}

		this.#mutationObserver = new MutationObserver(() => this.#scheduleMeasure());
		this.#mutationObserver.observe(this, {
			childList: true,
			characterData: true,
			subtree: true,
		});
	}

	#isReducedMotion(): boolean {
		if (typeof window.matchMedia !== "function")
			return false;
		return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	}

	#observeMediaQuery(): void {
		if (typeof window.matchMedia !== "function")
			return;
		this.#mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		this.#mediaQuery.addEventListener("change", this.#handleMediaChange);
	}

	#handleMediaChange = (event: MediaQueryListEvent): void => {
		this.#reducedMotion = event.matches;
		this.#engine?.setReducedMotion(event.matches);
		this.#updateActivity();
	};
}

/** Register {@link BluffSpoilerElement} under a kebab-case tag name. */
export function defineBluffSpoiler(tagName: string = TAG_NAME): void {
	if (!customElements.get(tagName))
		customElements.define(tagName, BluffSpoilerElement);
}
