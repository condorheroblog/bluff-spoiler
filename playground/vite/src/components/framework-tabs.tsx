import { useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CodeBlock } from "./code-block";

type MethodKey = "npm" | "cdn";
type FrameworkKey = "react" | "vue" | "solid" | "svelte" | "html";
type StepKey = "install" | "register" | "use" | "cdn";

interface GuideBlock {
	file: string;
	language: string;
	step: StepKey;
	code: string;
}

const methodOrder = ["npm", "cdn"] as const;
const frameworkOrder = ["react", "vue", "solid", "svelte", "html"] as const;

const stepNumber: Partial<Record<StepKey, number>> = {
	install: 1,
	register: 2,
	use: 3,
};

function capitalize(value: string): string {
	return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function useRovingTabs<T extends string>(
	order: readonly T[],
	active: T,
	onChange: (key: T) => void,
) {
	const refs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		const current = order.indexOf(active);
		let next = -1;
		if (event.key === "ArrowRight" || event.key === "ArrowDown") {
			next = (current + 1) % order.length;
		}
		else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
			next = (current - 1 + order.length) % order.length;
		}
		else if (event.key === "Home") {
			next = 0;
		}
		else if (event.key === "End") {
			next = order.length - 1;
		}
		if (next === -1) {
			return;
		}
		event.preventDefault();
		const key = order[next];
		onChange(key);
		refs.current[key]?.focus();
	};

	const tabProps = (key: T) => ({
		ref: (node: HTMLButtonElement | null) => {
			refs.current[key] = node;
		},
		tabIndex: active === key ? 0 : -1,
	});

	return { onKeyDown, tabProps };
}

const installSnippet = `# npm
npm install bluff-spoiler

# pnpm
pnpm add bluff-spoiler

# yarn
yarn add bluff-spoiler

# bun
bun add bluff-spoiler`;

function buildGuides(zh: boolean): Record<MethodKey, Record<FrameworkKey, GuideBlock[]>> {
	const cardNumber = zh ? "6222 0212 3456 7890" : "4242 4242 4242 4242";
	const personName = zh ? "张三" : "Alice Wang";
	const usernameLabel = zh ? "用户名" : "Username";
	const registerOnce = zh ? "整个应用只需注册一次" : "register the element once for the whole app";

	return {
		npm: {
			react: [
				{
					file: "bash",
					language: "bash",
					step: "install",
					code: installSnippet,
				},
				{
					file: "main.tsx",
					language: "tsx",
					step: "register",
					code: `// main.tsx —— ${registerOnce}
import "bluff-spoiler";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);`,
				},
				{
					file: "BankCard.tsx",
					language: "tsx",
					step: "use",
					code: `import { useRef } from "react";

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
      ${cardNumber}
    </bluff-spoiler>
  );
}`,
				},
			],
			vue: [
				{
					file: "bash",
					language: "bash",
					step: "install",
					code: installSnippet,
				},
				{
					file: "main.ts",
					language: "ts",
					step: "register",
					code: `// main.ts —— ${registerOnce}
import { createApp } from "vue";
import "bluff-spoiler";
import App from "./App.vue";

createApp(App).mount("#app");`,
				},
				{
					file: "App.vue",
					language: "vue",
					step: "use",
					code: `<script setup lang="ts">
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
    ${cardNumber}
  </bluff-spoiler>
</template>`,
				},
			],
			solid: [
				{
					file: "bash",
					language: "bash",
					step: "install",
					code: installSnippet,
				},
				{
					file: "main.tsx",
					language: "tsx",
					step: "register",
					code: `// main.tsx —— ${registerOnce}
import "bluff-spoiler";
import { render } from "solid-js/web";
import App from "./App";

render(() => <App />, document.getElementById("root")!);`,
				},
				{
					file: "Secret.tsx",
					language: "tsx",
					step: "use",
					code: `export function Secret() {
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
}`,
				},
			],
			svelte: [
				{
					file: "bash",
					language: "bash",
					step: "install",
					code: installSnippet,
				},
				{
					file: "main.ts",
					language: "ts",
					step: "register",
					code: `// main.ts —— ${registerOnce}
import "bluff-spoiler";
import { mount } from "svelte";
import App from "./App.svelte";

mount(App, { target: document.getElementById("app")! });`,
				},
				{
					file: "App.svelte",
					language: "svelte",
					step: "use",
					code: `<script lang="ts">
  import { onMount } from "svelte";

  let el!: HTMLElement;

  onMount(() => {
    el.addEventListener("toggle", (event) => {
      console.log((event as CustomEvent).detail);
    });
  });
</script>

<bluff-spoiler
  bind:this={el}
  particle-color="#6ee7b7"
  particle-shape="square"
  particle-bloom
>
  138-0000-0000
</bluff-spoiler>`,
				},
			],
			html: [
				{
					file: "bash",
					language: "bash",
					step: "install",
					code: installSnippet,
				},
				{
					file: "index.html",
					language: "html",
					step: "register",
					code: `<!-- index.html — the bundler (Vite / webpack) resolves
     the npm-installed package, pure HTML, no JS file needed -->
<script type="module">
  import "bluff-spoiler"; // registers <bluff-spoiler>
</script>`,
				},
				{
					file: "index.html",
					language: "html",
					step: "use",
					code: `<!-- later in the same index.html -->
<p>
  ${usernameLabel}
  <bluff-spoiler particle-shape="diamond" particle-bloom particle-color="#34d399">
    ${personName}
  </bluff-spoiler>
</p>

<script>
  const el = document.querySelector("bluff-spoiler");
  el.addEventListener("toggle", (event) => {
    console.log(event.detail.revealed, event.detail.source);
  });
</script>`,
				},
			],
		},

		cdn: {
			html: [
				{
					file: "index.html",
					language: "html",
					step: "cdn",
					code: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <script type="module" src="https://unpkg.com/bluff-spoiler@1/dist/index.iife.js"></script>
  </head>
  <body>
    <p>
      ${usernameLabel}
      <bluff-spoiler particle-shape="diamond" particle-bloom particle-color="#34d399">
        ${personName}
      </bluff-spoiler>
    </p>

    <script>
      const el = document.querySelector("bluff-spoiler");
      el.addEventListener("toggle", (event) => {
        console.log(event.detail.revealed, event.detail.source);
      });
    </script>
  </body>
</html>`,
				},
			],
			react: [
				{
					file: "index.html",
					language: "html",
					step: "cdn",
					code: `<div id="root"></div>

<!-- import maps + htm: no bundler, JSX-free -->
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@19",
    "react-dom": "https://esm.sh/react-dom@19?external=react",
    "react-dom/": "https://esm.sh/react-dom@19?external=react/",
    "htm": "https://esm.sh/htm@3",
    "bluff-spoiler": "https://esm.sh/bluff-spoiler@1"
  }
}
</script>

<script type="module">
  import { createElement } from "react";
  import { createRoot } from "react-dom/client";
  import htm from "htm";
  import "bluff-spoiler"; // registers <bluff-spoiler>

  const html = htm.bind(createElement);

  function App() {
    return html\`
      <bluff-spoiler
        particle-color="#6ee7b7"
        particle-shape="diamond"
        particle-bloom
        onToggle=\${(event) => console.log(event.detail)}
      >
        ${cardNumber}
      </bluff-spoiler>
    \`;
  }

  createRoot(document.getElementById("root")).render(html\`<\${App} />\`);
</script>`,
				},
			],
			vue: [
				{
					file: "index.html",
					language: "html",
					step: "cdn",
					code: `<!doctype html>
<html>
  <head>
    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
    <script src="https://unpkg.com/bluff-spoiler@1/dist/index.iife.js"></script>
  </head>
  <body>
    <div id="app">
      <bluff-spoiler
        particle-color="#34d399"
        particle-shape="circle"
        particle-bloom
        @toggle="onToggle"
      >
        ${cardNumber}
      </bluff-spoiler>
    </div>

    <script>
      const { createApp } = Vue;
      const app = createApp({
        methods: {
          onToggle(event) {
            console.log(event.detail);
          },
        },
      });

      // treat hyphenated tags as native custom elements
      app.config.compilerOptions.isCustomElement = (tag) => tag.includes("-");
      app.mount("#app");
    </script>
  </body>
</html>`,
				},
			],
			solid: [
				{
					file: "index.html",
					language: "html",
					step: "cdn",
					code: `<div id="root"></div>

<!-- import maps + solid-js/html: no bundler, JSX-free -->
<script type="importmap">
{
  "imports": {
    "solid-js": "https://esm.sh/solid-js@1.9",
    "solid-js/web": "https://esm.sh/solid-js@1.9/web?external=solid-js",
    "solid-js/html": "https://esm.sh/solid-js@1.9/html?external=solid-js",
    "bluff-spoiler": "https://esm.sh/bluff-spoiler@1"
  }
}
</script>

<script type="module">
  import { render } from "solid-js/web";
  import html from "solid-js/html";
  import "bluff-spoiler"; // registers <bluff-spoiler>

  render(
    () => html\`
      <bluff-spoiler
        particle-color="#34d399"
        particle-shape="diamond"
        particle-bloom
        onToggle=\${(event) => console.log(event.detail)}
      >
        sensitive@example.com
      </bluff-spoiler>
    \`,
    document.getElementById("root"),
  );
</script>`,
				},
			],
			svelte: [
				{
					file: "index.html",
					language: "html",
					step: "cdn",
					code: `<div id="app"></div>

<!-- import maps + the Svelte compiler running in the browser -->
<script type="importmap">
{
  "imports": {
    "svelte": "https://esm.sh/svelte@5",
    "svelte/compiler": "https://esm.sh/svelte@5/compiler",
    "svelte/internal/client": "https://esm.sh/svelte@5/internal/client?external=svelte",
    "bluff-spoiler": "https://esm.sh/bluff-spoiler@1"
  }
}
</script>

<script type="module">
  import { compile } from "svelte/compiler";
  import { mount } from "svelte";
  import "bluff-spoiler"; // registers <bluff-spoiler>

  // authored exactly like App.svelte
  const source = \`
    <bluff-spoiler
      particle-color="#6ee7b7"
      particle-shape="square"
      particle-bloom
    >
      138-0000-0000
    </bluff-spoiler>
  \`;

  const { js } = compile(source, { generate: "client", filename: "App.svelte" });
  const url = URL.createObjectURL(new Blob([js.code], { type: "text/javascript" }));
  const { default: App } = await import(url);

  mount(App, { target: document.getElementById("app") });
</script>`,
				},
			],
		},
	};
}

interface MethodTheme {
	card: string;
	iconChip: string;
	tabActive: string;
}

const methodThemes: Record<MethodKey, MethodTheme> = {
	npm: {
		card: "hover:border-emerald-400/60 dark:hover:border-emerald-500/40",
		iconChip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
		tabActive: "bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-400",
	},
	cdn: {
		card: "hover:border-sky-400/60 dark:hover:border-sky-500/40",
		iconChip: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
		tabActive: "bg-white text-sky-700 shadow-sm dark:bg-slate-800 dark:text-sky-400",
	},
};

function PackageIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M21 8v8a2 2 0 0 1-1 1.7l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.7l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8Z" />
			<path d="m3.3 7 8.7 5 8.7-5" />
			<path d="M12 22V12" />
		</svg>
	);
}

function GlobeIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<circle cx="12" cy="12" r="9" />
			<path d="M3 12h18" />
			<path d="M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z" />
		</svg>
	);
}

function MethodCard({ method, guides }: { method: MethodKey; guides: ReturnType<typeof buildGuides> }) {
	const { t } = useTranslation();
	const [framework, setFramework] = useState<FrameworkKey>("react");
	const frameworkTabs = useRovingTabs(frameworkOrder, framework, setFramework);
	const theme = methodThemes[method];
	const blocks = guides[method][framework];

	const icon: ReactNode = method === "npm" ? <PackageIcon /> : <GlobeIcon />;

	return (
		<article
			className={`flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg sm:p-6 dark:border-slate-800 dark:bg-slate-900/50 ${theme.card}`}
		>
			<header className="flex items-start gap-3">
				<span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5 ${theme.iconChip}`}>
					{icon}
				</span>
				<div className="min-w-0">
					<h3 className="text-base font-bold text-slate-900 dark:text-white">
						{t(`install.method${capitalize(method)}`)}
					</h3>
					<p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
						{t(`install.method${capitalize(method)}Description`)}
					</p>
				</div>
			</header>

			<div
				role="tablist"
				aria-label={t("install.frameworksAriaLabel")}
				onKeyDown={frameworkTabs.onKeyDown}
				className="mt-5 grid grid-cols-5 gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-900/70"
			>
				{frameworkOrder.map((key) => {
					const selected = framework === key;
					return (
						<button
							key={key}
							{...frameworkTabs.tabProps(key)}
							type="button"
							role="tab"
							id={`fw-tab-${method}-${key}`}
							aria-selected={selected}
							aria-controls={`fw-panel-${method}`}
							onClick={() => setFramework(key)}
							className={`cursor-pointer rounded-lg px-1 py-2 text-[11px] font-semibold transition sm:text-xs ${
								selected
									? theme.tabActive
									: "text-slate-500 hover:bg-white/60 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
							}`}
						>
							{t(`install.tab${capitalize(key)}`)}
						</button>
					);
				})}
			</div>

			<div
				role="tabpanel"
				id={`fw-panel-${method}`}
				aria-labelledby={`fw-tab-${method}-${framework}`}
				className="mt-5 flex-1 space-y-5"
			>
				{blocks.map((block, index) => (
					<div key={`${method}-${framework}-${block.step}-${index}`}>
						<p className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
							{stepNumber[block.step] !== undefined && (
								<span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
									{stepNumber[block.step]}
								</span>
							)}
							{t(`install.step${capitalize(block.step)}`)}
						</p>
						<CodeBlock code={block.code} label={block.file} language={block.language} />
					</div>
				))}
			</div>
		</article>
	);
}

export function FrameworkTabs() {
	const { i18n } = useTranslation();
	const zh = Boolean(i18n.resolvedLanguage?.startsWith("zh"));
	const guides = buildGuides(zh);

	return (
		<div className="mt-10 grid items-start gap-5 sm:gap-6 lg:grid-cols-2">
			{methodOrder.map(method => (
				<MethodCard key={method} method={method} guides={guides} />
			))}
		</div>
	);
}
