# bluff-spoiler

<p align="center">
  <img src="https://condorheroblog.github.io/bluff-spoiler/logo.svg" alt="React Use Active Scroll logo" width="96" />
</p>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]
[![Published on webcomponents.org][webcomponents-src]][webcomponents-href]

**English** | [中文](https://github.com/condorheroblog/bluff-spoiler/blob/main/README.zh-CN.md)

Live Demo: https://condorheroblog.github.io/bluff-spoiler/

`bluff-spoiler` is a **zero-dependency Web Component** that hides sensitive
inline content behind a dense, animated particle field. The glyphs themselves
are rendered transparent — there is no opaque backdrop — so the field blends
into any background. Click (or press Enter/Space) to reveal, click again to
hide. The host stays `display: inline`, masks paragraphs wrap naturally at
every character, and the same code works in vanilla JS, React, Vue, Solid,
Svelte, Angular or server-rendered markup.

```html
Card number
<bluff-spoiler particle-color="#6ee7b7" particle-shape="diamond" particle-bloom>
  4242 4242 4242 4242
</bluff-spoiler>
```

## Features

- **Truly inline & line-wrap aware** — the host keeps `display: inline`; one
  canvas is painted per line fragment measured via `getClientRects()`, so
  masked paragraphs wrap at any breakpoint, character by character. Vertical
  typography (`writing-mode: vertical-rl`) works too.
- **GPU-friendly particle engine** — every instance shares one
  `requestAnimationFrame`, with DPR-capped canvases, pre-rendered bloom
  sprites, `IntersectionObserver` pausing and `prefers-reduced-motion`
  support.
- **12 configurable parameters** — color, size, density, count, bloom,
  opacity, speed, drift amplitude, shape (`circle` / `square` / `triangle` /
  `diamond`), motion (`up` / `down` / `cross` / `orbit`), reveal/hide fade and
  per-particle breathing period. Set them as HTML attributes or JS
  properties.
- **Cancelable toggle events** — `toggle`, `reveal` and `hide` `CustomEvent`s
  carry the source (`pointer` / `keyboard` / `api`); `preventDefault()` on
  `toggle` keeps the secret hidden.
- **Accessible by default** — keyboard activation (Enter/Space),
  `role="button"`, `tabindex="0"`, `aria-pressed` and an automatic
  `aria-label` while hidden.

## Installation

```bash
npm install bluff-spoiler
# pnpm add bluff-spoiler
# yarn add bluff-spoiler
# bun add bluff-spoiler
```

Register the element once (the import is a side effect that defines
`<bluff-spoiler>`):

```ts
import "bluff-spoiler";
```

You can also register it under a custom tag name:

```ts
import { defineBluffSpoiler } from "bluff-spoiler";

defineBluffSpoiler("my-secret");
// <my-secret>…</my-secret>
```

## Usage in Vanilla HTML / JS

Drop the IIFE build straight from [unpkg](https://unpkg.com) — no build step,
it registers itself:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="https://unpkg.com/bluff-spoiler"></script>
  </head>
  <body>
    <p>
      Username <bluff-spoiler>Alice Wang</bluff-spoiler>,
      passport <bluff-spoiler particle-shape="triangle" particle-color="#f59e0b">
        X12345678
      </bluff-spoiler>
    </p>

    <script>
      const el = document.querySelector("bluff-spoiler");
      el.addEventListener("toggle", (event) => {
        console.log(event.detail.revealed, event.detail.source);
        // Keep it hidden under some business condition:
        // event.preventDefault();
      });
      // Programmatic control:
      el.toggle(true);  // reveal,  fires events with source "api"
      el.toggle(false); // hide
    </script>
  </body>
</html>
```

Pin a version in production, e.g.
`https://unpkg.com/bluff-spoiler@0.0.1/dist/index.iife.js`. The IIFE build
also exposes a global `BluffSpoiler` object (`BluffSpoiler.defineBluffSpoiler`,
etc.).

## Usage in React

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// main.tsx — register once
import "bluff-spoiler";

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
```

```tsx
import { useRef } from "react";

export function BankCard() {
	const cardRef = useRef<HTMLElement>(null);

	return (
		<bluff-spoiler
			ref={cardRef}
			particle-color="#6ee7b7"
			particle-shape="diamond"
			particle-size={1.5}
			particle-bloom
			onToggle={(event: Event) => {
				const detail = (event as CustomEvent<{ revealed: boolean }>).detail;
				console.log(detail.revealed);
			}}
		>
			4242 4242 4242 4242
		</bluff-spoiler>
	);
}
```

React 19 renders unknown hyphenated tags as custom elements and passes
unknown props through as attributes/properties. For full typing, augment JSX
once (see [`custom-elements.d.ts`](https://github.com/condorheroblog/bluff-spoiler/blob/main/playground/vite/src/custom-elements.d.ts)
in the playground for a complete example):

```ts
// bluff-spoiler.d.ts
import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"bluff-spoiler": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
				"revealed"?: boolean
				"particle-color"?: string
				"particle-shape"?: "circle" | "square" | "triangle" | "diamond"
				"particle-motion"?: "up" | "down" | "cross" | "orbit"
				"particle-bloom"?: boolean
				"onToggle"?: (event: Event) => void
			}
		}
	}
}
```

Boolean/`null` quirks (React serializes props to strings) are easiest to avoid
by syncing through a ref; the playground ships a small typed wrapper
([`BluffSpoiler`](https://github.com/condorheroblog/bluff-spoiler/blob/main/playground/vite/src/components/bluff-spoiler.tsx)) that
does exactly this.

## Usage in Vue

Register the side effect in `main.ts`:

```ts
import { createApp } from "vue";
import App from "./App.vue";
import "bluff-spoiler";

createApp(App).mount("#app");
```

Then use the tag in any template — Vue forwards unknown attributes to the DOM
element and supports kebab-case directly:

```vue
<script setup lang="ts">
function onToggle(event: Event) {
  console.log((event as CustomEvent).detail);
}
</script>

<template>
  <bluff-spoiler
    particle-color="#34d399"
    particle-shape="circle"
    particle-size="1.2"
    particle-bloom
    @toggle="onToggle"
  >
    6222 0212 3456 7890
  </bluff-spoiler>
</template>
```

For dynamic numeric props use `:particle-size="size"`. Note that the presence
of `particle-bloom` means `true`; to switch bloom off dynamically remove the
attribute (e.g. with `v-bind="bloom ? { 'particle-bloom': true } : {}"`).

## Usage in Solid

Solid treats unknown hyphenated tags as custom elements out of the box:

```tsx
import "bluff-spoiler";

export function Secret() {
	return (
		<bluff-spoiler
			particle-color="#34d399"
			particle-shape="diamond"
			particle-bloom
			prop:particleSize={1.4}
			onToggle={(event: CustomEvent) => console.log(event.detail)}
		>
			sensitive@example.com
		</bluff-spoiler>
	);
}
```

Use `prop:*` when you want to set a DOM property instead of an attribute, and
`onToggle` (Solid lowercases event names) to listen for the `toggle` event.

## Usage in Svelte

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import "bluff-spoiler";

  let el: HTMLElement;

  onMount(() =>
    el.addEventListener("toggle", (event) => {
      console.log((event as CustomEvent).detail);
    }),
  );
</script>

<bluff-spoiler
  bind:this={el}
  particle-color="#6ee7b7"
  particle-shape="square"
  particle-bloom
>
  138-0000-0000
</bluff-spoiler>
```

Svelte passes unknown hyphenated tags through to the DOM and forwards
kebab-case attributes directly. `bind:this` gives you the element for
`el.toggle(force)` and explicit `addEventListener("toggle", …)` works on both
Svelte 4 and 5.

## API

### Attributes / properties

All attributes reflect to properties of the same name in camelCase
(`particle-shape` ↔ `particleShape`).

| Attribute             | Property             | Type                                            | Default   | Range / values |
|-----------------------|----------------------|-------------------------------------------------|-----------|----------------|
| `revealed`            | `revealed`           | boolean                                         | `false`   | —              |
| `particle-color`      | `particleColor`      | any CSS color                                   | `#1fa669` | non-empty      |
| `particle-size`       | `particleSize`       | number (CSS px radius)                          | `0.8`     | `0.5` – `24`   |
| `particle-density`    | `particleDensity`    | number, particles per 10,000 CSS-pixel²         | `2500`    | `0` – `1000`   |
| `particle-count`      | `particleCount`      | integer \| `null` (derive from density)         | `null`    | `≥ 0`          |
| `particle-bloom`      | `particleBloom`      | boolean (presence)                              | absent    | —              |
| `particle-opacity`    | `particleOpacity`    | number                                          | `0.9`     | `0` – `1`      |
| `particle-speed`      | `particleSpeed`      | number multiplier (`0` freezes motion)          | `0.5`     | `0` – `10`     |
| `particle-jitter`     | `particleJitter`     | number (CSS px drift/orbit radius)              | `2`       | `0` – `50`     |
| `particle-shape`      | `particleShape`      | `circle` \| `square` \| `triangle` \| `diamond` | `circle`  | —              |
| `particle-motion`     | `particleMotion`     | `up` \| `down` \| `cross` \| `orbit`            | `cross`   | —              |
| `particle-transition` | `particleTransition` | number (ms fade on toggle)                      | `300`     | `0` – `2000`   |
| `particle-fade`       | `particleFade`       | number (ms breathing period, `0` = steady)      | `2000`    | `0` – `10000`  |

### Methods

| Signature         | Description                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| `toggle(force?)`  | Toggle programmatically; `true` reveals, `false` hides, omit to flip. Fires the same events with `source: "api"`. |

### Events

| Event    | Cancelable | `event.detail`                  | Fires                         |
|----------|------------|---------------------------------|-------------------------------|
| `toggle` | yes        | `{ revealed: boolean, source }` | before the state changes      |
| `reveal` | no         | `{ source }`                    | after the content is revealed |
| `hide`   | no         | `{ source }`                    | after the content is hidden   |

`source` is one of `"pointer"`, `"keyboard"` or `"api"`. All events bubble and
cross the shadow boundary (`composed: true`). Native `click` continues to
work as well.

### CSS customization

| Custom property            | Default     | Description                  |
| -------------------------- | ----------- | ---------------------------- |
| `--bluff-spoiler-focus`    | `#1fa669`   | Color of the focus outline.  |

The component renders with an **open** shadow root. Hidden text uses
`color: transparent` + `user-select: none` so glyphs cannot leak through
selection, and the host uses `word-break: break-all; overflow-wrap: anywhere`
so masking never changes wrapping (in either state).

## Playground

A full demo app (home page with use-case demos and a live parameter
playground with an event log) lives in [`playground/vite`](https://github.com/condorheroblog/bluff-spoiler/blob/main/playground/vite).
It is a Vite + React app and aliases `bluff-spoiler` to the local library
source, so no build of the library is required.

```bash
# from the repository root (pnpm workspace)
pnpm install
pnpm --filter bluff-spoiler-vite-playground dev

# or directly from the demo folder
cd playground/vite
pnpm install
pnpm dev        # http://localhost:5173/bluff-spoiler/
pnpm build      # type-check + production build to dist/
pnpm preview    # serve the production build locally
```

## Browser support

Any browser with Custom Elements v1, Shadow DOM, Canvas 2D,
`IntersectionObserver` and `ResizeObserver — all current evergreen browsers
(Chrome, Edge, Firefox, Safari 14+).

## License

[MIT](https://github.com/condorheroblog/bluff-spoiler/blob/main/LICENSE) © 2026-Present [Condor Hero](https://github.com/condorheroblog)


<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/bluff-spoiler?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmx.dev/package/bluff-spoiler
[npm-downloads-src]: https://img.shields.io/npm/dm/bluff-spoiler?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmx.dev/package/bluff-spoiler
[bundle-src]: https://img.shields.io/bundlephobia/minzip/bluff-spoiler?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=bluff-spoiler
[license-src]: https://img.shields.io/github/license/condorheroblog/bluff-spoiler.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/condorheroblog/bluff-spoiler/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/bluff-spoiler
[webcomponents-src]: https://img.shields.io/badge/webcomponents.org-published-blue.svg?style=flat-square
[webcomponents-href]: https://www.webcomponents.org/element/bluff-spoiler
