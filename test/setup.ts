import { afterEach, vi } from "vitest";

/**
 * Test environment setup for jsdom.
 *
 * jsdom ships without a layout engine, a canvas 2D backend, animation-frame
 * timing and the observer APIs, so every browser feature the component relies
 * on is stubbed here in a deterministic way.
 */

/* ------------------------------------------------------------------ */
/* requestAnimationFrame — manual queue so frames are fully controlled */
/* ------------------------------------------------------------------ */

const rafQueue = new Map<number, FrameRequestCallback>();
let nextRafId = 0;

globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
	const id = ++nextRafId;
	rafQueue.set(id, callback);
	return id;
}) as typeof requestAnimationFrame;

globalThis.cancelAnimationFrame = ((id: number) => {
	rafQueue.delete(id);
}) as typeof cancelAnimationFrame;

function flushRaf(time: number): void {
	const callbacks = [...rafQueue.values()];
	rafQueue.clear();
	for (const callback of callbacks) {
		callback(time);
	}
}

(globalThis as Record<string, unknown>).__rafTick__ = flushRaf;
(globalThis as Record<string, unknown>).__rafPending__ = () => rafQueue.size;

/* ------------------------- devicePixelRatio ------------------------ */

Object.defineProperty(globalThis, "devicePixelRatio", {
	value: 1,
	configurable: true,
	writable: true,
});

/* ----------------------------- Canvas ------------------------------ */

type MockFn = ReturnType<typeof vi.fn>;

export interface Context2DStub {
	canvas: HTMLCanvasElement
	fillStyle: string
	strokeStyle: string
	globalAlpha: number
	lineWidth: number
	lineCap: string
	lineJoin: string
	shadowColor: string
	shadowBlur: number
	shadowOffsetX: number
	shadowOffsetY: number
	filter: string
	setTransform: MockFn
	resetTransform: MockFn
	save: MockFn
	restore: MockFn
	translate: MockFn
	scale: MockFn
	rotate: MockFn
	beginPath: MockFn
	closePath: MockFn
	moveTo: MockFn
	lineTo: MockFn
	arc: MockFn
	rect: MockFn
	fill: MockFn
	stroke: MockFn
	fillRect: MockFn
	strokeRect: MockFn
	clearRect: MockFn
	drawImage: MockFn
	createRadialGradient: MockFn
	createLinearGradient: MockFn
}

function createContext2DStub(): Context2DStub {
	const gradient = { addColorStop: vi.fn() };
	return {
		canvas: null as unknown as HTMLCanvasElement,
		// state
		fillStyle: "",
		strokeStyle: "",
		globalAlpha: 1,
		lineWidth: 1,
		lineCap: "butt",
		lineJoin: "miter",
		shadowColor: "",
		shadowBlur: 0,
		shadowOffsetX: 0,
		shadowOffsetY: 0,
		filter: "none",
		// transforms
		setTransform: vi.fn(),
		resetTransform: vi.fn(),
		save: vi.fn(),
		restore: vi.fn(),
		translate: vi.fn(),
		scale: vi.fn(),
		rotate: vi.fn(),
		// paths
		beginPath: vi.fn(),
		closePath: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		arc: vi.fn(),
		rect: vi.fn(),
		fill: vi.fn(),
		stroke: vi.fn(),
		fillRect: vi.fn(),
		strokeRect: vi.fn(),
		clearRect: vi.fn(),
		drawImage: vi.fn(),
		createRadialGradient: vi.fn(() => gradient),
		createLinearGradient: vi.fn(() => gradient),
	};
}

const contextStore = new WeakMap<HTMLCanvasElement, Context2DStub>();

HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement): Context2DStub {
	let ctx = contextStore.get(this);
	if (!ctx) {
		ctx = createContext2DStub();
		ctx.canvas = this;
		contextStore.set(this, ctx);
	}
	return ctx;
} as unknown as HTMLCanvasElement["getContext"];

HTMLCanvasElement.prototype.toDataURL = () => "data:image/png;base64,";

/* ------------------------- ResizeObserver -------------------------- */

export interface ResizeObserverEntryLike {
	target: Element
	contentRect: DOMRectReadOnly
	borderBoxSize: ReadonlyArray<{ inlineSize: number, blockSize: number }>
}

class MockResizeObserver implements ResizeObserver {
	static instances: MockResizeObserver[] = [];

	callback: ResizeObserverCallback;
	targets = new Set<Element>();

	constructor(callback: ResizeObserverCallback) {
		this.callback = callback;
		MockResizeObserver.instances.push(this);
	}

	observe(target: Element): void {
		this.targets.add(target);
	}

	unobserve(target: Element): void {
		this.targets.delete(target);
	}

	disconnect(): void {
		this.targets.clear();
	}

	$trigger(rect: { width: number, height: number }): void {
		const entries: ResizeObserverEntryLike[] = [...this.targets].map(target => ({
			target,
			contentRect: new DOMRectReadOnly(0, 0, rect.width, rect.height),
			borderBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
		}));
		this.callback(entries as unknown as ResizeObserverEntry[], this);
	}
}

(globalThis as Record<string, unknown>).ResizeObserver = MockResizeObserver;

/* ----------------------- IntersectionObserver ---------------------- */

class MockIntersectionObserver implements IntersectionObserver {
	static instances: MockIntersectionObserver[] = [];

	callback: IntersectionObserverCallback;
	targets = new Set<Element>();
	root = null;
	rootMargin = "0px";
	scrollMargin = "0px";
	thresholds = [0];

	constructor(callback: IntersectionObserverCallback) {
		this.callback = callback;
		MockIntersectionObserver.instances.push(this);
	}

	observe(target: Element): void {
		this.targets.add(target);
	}

	unobserve(target: Element): void {
		this.targets.delete(target);
	}

	disconnect(): void {
		this.targets.clear();
	}

	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}

	$setIntersecting(isIntersecting: boolean): void {
		const now = performance.now();
		const entries = [...this.targets].map(target => ({
			target,
			isIntersecting,
			intersectionRatio: isIntersecting ? 1 : 0,
			time: now,
			boundingClientRect: new DOMRectReadOnly(),
			intersectionRect: new DOMRectReadOnly(),
			rootBounds: null,
		}));
		this.callback(entries as unknown as IntersectionObserverEntry[], this);
	}
}

(globalThis as Record<string, unknown>).IntersectionObserver = MockIntersectionObserver;

/* ----------------------------- matchMedia -------------------------- */

const mediaQueryListeners = new Set<(event: MediaQueryListEvent) => void>();
let reducedMotion = false;

function createMatchMedia(query: string): MediaQueryList {
	return {
		media: query,
		matches: query.includes("reduce") ? reducedMotion : false,
		onchange: null,
		addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
			mediaQueryListeners.add(listener as (event: MediaQueryListEvent) => void);
		},
		removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
			mediaQueryListeners.delete(listener as (event: MediaQueryListEvent) => void);
		},
		addListener: (listener: EventListenerOrEventListenerObject) => {
			mediaQueryListeners.add(listener as (event: MediaQueryListEvent) => void);
		},
		removeListener: (listener: EventListenerOrEventListenerObject) => {
			mediaQueryListeners.delete(listener as (event: MediaQueryListEvent) => void);
		},
		dispatchEvent: vi.fn(),
	} as unknown as MediaQueryList;
}

globalThis.matchMedia = createMatchMedia as typeof matchMedia;
window.matchMedia = createMatchMedia as typeof window.matchMedia;

(globalThis as Record<string, unknown>).__setReducedMotion__ = (value: boolean) => {
	reducedMotion = value;
	for (const listener of mediaQueryListeners) {
		listener({ matches: value, media: "(prefers-reduced-motion: reduce)" } as MediaQueryListEvent);
	}
};

/* ---------------------- layout helpers for jsdom ------------------- */

/**
 * jsdom performs no layout, so tests describe the inline fragments the
 * component would observe through `getClientRects()` explicitly.
 */
export function mockClientRects(
	element: Element,
	rects: Array<{ x: number, y: number, width: number, height: number }>,
): void {
	const domRects = rects.map(r => new DOMRect(r.x, r.y, r.width, r.height));
	vi.spyOn(element, "getClientRects").mockReturnValue({
		length: domRects.length,
		item: (index: number) => domRects[index] ?? null,
		[Symbol.iterator]: () => domRects[Symbol.iterator](),
	} as unknown as DOMRectList);

	const left = Math.min(...domRects.map(r => r.left));
	const top = Math.min(...domRects.map(r => r.top));
	const right = Math.max(...domRects.map(r => r.right));
	const bottom = Math.max(...domRects.map(r => r.bottom));
	vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
		new DOMRect(left, top, right - left, bottom - top),
	);
}

/* ----------------------- fonts.ready (document) -------------------- */

if (!("fonts" in document)) {
	Object.defineProperty(document, "fonts", {
		configurable: true,
		value: { ready: Promise.resolve() },
	});
}

/* ----------------------------- cleanup ----------------------------- */

afterEach(() => {
	rafQueue.clear();
	MockResizeObserver.instances.length = 0;
	MockIntersectionObserver.instances.length = 0;
	mediaQueryListeners.clear();
	reducedMotion = false;
	vi.restoreAllMocks();
});
