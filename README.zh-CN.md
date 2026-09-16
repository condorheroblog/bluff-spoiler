# bluff-spoiler

<p align="center">
  <img src="https://condorheroblog.github.io/bluff-spoiler/logo.svg" alt="bluff-spoiler logo" width="96" />
</p>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]
[![Published on webcomponents.org][webcomponents-src]][webcomponents-href]

[English](https://github.com/condorheroblog/bluff-spoiler/blob/main/README.md) | **中文**

在线演示：https://condorheroblog.github.io/bluff-spoiler/

`bluff-spoiler` 是一个**零依赖的 Web Component**，用一层密集的动态粒子遮盖
敏感的行内内容。文字本身被渲染为透明——没有任何不透明底板——因此粒子区域
能与任意背景自然融合。点击（或按 Enter/Space）显示，再次点击重新隐藏。宿主
元素保持 `display: inline`，被遮罩的段落会逐字符自然断行；同一份代码可在原生
JS、React、Vue、Solid、Svelte、Angular 或服务端渲染的页面中直接使用。

```html
卡号
<bluff-spoiler particle-color="#6ee7b7" particle-shape="diamond" particle-bloom>
  4242 4242 4242 4242
</bluff-spoiler>
```

## 特性

- **真正的行内元素，感知换行**：宿主保持 `display: inline`，通过
  `getClientRects()` 为每一行片段绘制独立 canvas，被遮罩段落可在任意断点
  逐字符断行；同样支持竖排文字（`writing-mode: vertical-rl`）。
- **高性能粒子引擎**：页面内所有实例共享一个 `requestAnimationFrame`，配合
  DPR 上限、预渲染发光精灵、`IntersectionObserver` 离屏暂停以及
  `prefers-reduced-motion` 支持。
- **12 个可配置参数**：颜色、大小、密度、数量、发光、透明度、速度、漂移幅度、
  形状（`circle` / `square` / `triangle` / `diamond`）、运动模式（
  `up` / `down` / `cross` / `orbit`）、显隐淡入淡出时长、粒子呼吸周期，均可
  通过 HTML 属性或 JS 属性配置。
- **可取消的切换事件**：`toggle`、`reveal`、`hide` 自定义事件携带触发来源
  （`pointer` / `keyboard` / `api`）；在 `toggle` 中调用
  `preventDefault()` 即可阻止内容显示。
- **默认可访问**：支持 Enter/Space 键盘激活，自动维护 `role="button"`、
  `tabindex="0"`、`aria-pressed` 以及隐藏状态下的 `aria-label`。

## 安装

```bash
npm install bluff-spoiler
# pnpm add bluff-spoiler
# yarn add bluff-spoiler
# bun add bluff-spoiler
```

只需导入一次即可完成注册（导入的副作用会定义 `<bluff-spoiler>` 元素）：

```ts
import "bluff-spoiler";
```

也可以使用自定义标签名注册：

```ts
import { defineBluffSpoiler } from "bluff-spoiler";

defineBluffSpoiler("my-secret");
// <my-secret>…</my-secret>
```

## 在原生 HTML / JS 中使用（unpkg）

无需任何构建工具，直接从 [unpkg](https://unpkg.com) 引入 IIFE 产物即可，脚本
会自动完成注册：

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="https://unpkg.com/bluff-spoiler"></script>
  </head>
  <body>
    <p>
      用户名 <bluff-spoiler>张三</bluff-spoiler>，
      护照号 <bluff-spoiler particle-shape="triangle" particle-color="#f59e0b">
        E12345678
      </bluff-spoiler>
    </p>

    <script>
      const el = document.querySelector("bluff-spoiler");
      el.addEventListener("toggle", (event) => {
        console.log(event.detail.revealed, event.detail.source);
        // 满足某个业务条件时阻止显示：
        // event.preventDefault();
      });
      // 通过 API 控制：
      el.toggle(true);  // 显示，事件来源为 "api"
      el.toggle(false); // 隐藏
    </script>
  </body>
</html>
```

生产环境建议锁定版本，例如
`https://unpkg.com/bluff-spoiler@0.0.1/dist/index.iife.js`。IIFE 产物还会暴露
全局对象 `BluffSpoiler`（含 `BluffSpoiler.defineBluffSpoiler` 等导出）。

## 在 React 中使用

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// main.tsx —— 只需注册一次
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

React 19 会把未知的连字符标签当作自定义元素渲染，并将未知 props 作为
属性（attribute/property）透传。如需完整类型，可以一次性增强 JSX 类型
（完整示例见演示项目中的
[`custom-elements.d.ts`](https://github.com/condorheroblog/bluff-spoiler/blob/main/playground/vite/src/custom-elements.d.ts)）：

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

布尔属性与 `null` 值在 React 中会被序列化为字符串，建议通过 ref 同步属性；
演示项目里就内置了一个带类型的 React 封装组件
[`BluffSpoiler`](https://github.com/condorheroblog/bluff-spoiler/blob/main/playground/vite/src/components/bluff-spoiler.tsx) 处理这些
细节。

## 在 Vue 中使用

在 `main.ts` 中导入副作用完成注册：

```ts
import { createApp } from "vue";
import App from "./App.vue";
import "bluff-spoiler";

createApp(App).mount("#app");
```

之后即可在任意模板中使用——Vue 会把未知属性直接透传给 DOM 元素，并原生支持
kebab-case：

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

动态数值属性使用 `:particle-size="size"`。注意 `particle-bloom` 只要存在即为
`true`；如需动态关闭，应移除该属性（例如
`v-bind="bloom ? { 'particle-bloom': true } : {}"`）。

## 在 Solid 中使用

Solid 会自动把未知的连字符标签识别为自定义元素：

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

需要设置 DOM property 而非 attribute 时使用 `prop:*`；监听 `toggle` 事件使用
`onToggle`（Solid 会将事件名转为小写）。

## 在 Svelte 中使用

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

Svelte 会把未知的连字符标签直接透传给 DOM，kebab-case 属性可直接使用；
`bind:this` 可拿到元素实例以调用 `el.toggle(force)`，显式
`addEventListener("toggle", …)` 在 Svelte 4 与 5 中均适用。

## API

### 属性（Attributes）/ Properties

所有 HTML 属性都有对应的 camelCase JS 属性
（`particle-shape` ↔ `particleShape`）。

| Attribute             | Property             | 类型                                            | 默认值    | 取值范围      |
|-----------------------|----------------------|-------------------------------------------------|-----------|---------------|
| `revealed`            | `revealed`           | boolean                                         | `false`   | —             |
| `particle-color`      | `particleColor`      | 任意 CSS 颜色                                   | `#1fa669` | 非空字符串    |
| `particle-size`       | `particleSize`       | number（CSS 像素半径）                          | `0.8`     | `0.5` – `24`  |
| `particle-density`    | `particleDensity`    | number，每 10,000 平方像素的粒子数              | `2500`    | `0` – `1000`  |
| `particle-count`      | `particleCount`      | 整数 \| `null`（按密度自动计算）                | `null`    | `≥ 0`         |
| `particle-bloom`      | `particleBloom`      | boolean（属性存在即为 true）                    | 不存在    | —             |
| `particle-opacity`    | `particleOpacity`    | number                                          | `0.9`     | `0` – `1`     |
| `particle-speed`      | `particleSpeed`      | number 倍率（`0` 表示静止）                     | `0.5`     | `0` – `10`    |
| `particle-jitter`     | `particleJitter`     | number（漂移/环绕半径，CSS 像素）               | `2`       | `0` – `50`    |
| `particle-shape`      | `particleShape`      | `circle` \| `square` \| `triangle` \| `diamond` | `circle`  | —             |
| `particle-motion`     | `particleMotion`     | `up` \| `down` \| `cross` \| `orbit`            | `cross`   | —             |
| `particle-transition` | `particleTransition` | number（切换淡入淡出毫秒数）                    | `300`     | `0` – `2000`  |
| `particle-fade`       | `particleFade`       | number（呼吸周期毫秒，`0` 为常亮）              | `2000`    | `0` – `10000` |

### 方法

| 签名             | 说明                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------- |
| `toggle(force?)` | 编程式切换：`true` 显示、`false` 隐藏、省略则取反；触发的事件来源为 `"api"`。         |

### 事件

| 事件     | 是否可取消 | `event.detail`                  | 触发时机     |
|----------|------------|---------------------------------|--------------|
| `toggle` | 是         | `{ revealed: boolean, source }` | 状态改变之前 |
| `reveal` | 否         | `{ source }`                    | 内容显示之后 |
| `hide`   | 否         | `{ source }`                    | 内容隐藏之后 |

`source` 取值为 `"pointer"`、`"keyboard"` 或 `"api"`。所有事件都会冒泡并穿过
Shadow 边界（`composed: true`），原生 `click` 事件同样可以正常监听。

### CSS 定制

| CSS 变量                  | 默认值     | 说明               |
| ------------------------- | ---------- | ------------------ |
| `--bluff-spoiler-focus`   | `#1fa669`  | 焦点描边的颜色。   |

组件使用 **open** shadow root。隐藏的文字通过
`color: transparent` + `user-select: none` 渲染，无法通过选中泄漏字形；宿主使用
`word-break: break-all; overflow-wrap: anywhere`，确保显隐两种状态下换行表现
一致、不产生布局跳动。

## 本地演示（Playground）

完整的演示应用（含多个使用场景的首页，以及带参数调节面板和事件日志的实时
演示页）位于 [`playground/vite`](https://github.com/condorheroblog/bluff-spoiler/blob/main/playground/vite)。它是一个 Vite + React
应用，并将 `bluff-spoiler` 别名指向本地库源码，因此无需先构建组件库即可运行。

```bash
# 在仓库根目录（pnpm workspace）
pnpm install
pnpm --filter bluff-spoiler-vite-playground dev

# 或直接进入演示目录
cd playground/vite
pnpm install
pnpm dev        # http://localhost:5173/bluff-spoiler/
pnpm build      # 类型检查 + 生产构建，产物输出到 dist/
pnpm preview    # 本地预览生产构建
```

## 浏览器支持

任何支持 Custom Elements v1、Shadow DOM、Canvas 2D、
`IntersectionObserver` 与 `ResizeObserver` 的现代常青浏览器
（Chrome、Edge、Firefox、Safari 14+）。

## 开源协议

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
