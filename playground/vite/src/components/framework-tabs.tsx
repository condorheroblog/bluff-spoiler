import { useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CodeBlock } from "./code-block";

type MethodKey = "npm" | "cdn";
type FrameworkKey = "react" | "vue" | "solid" | "svelte" | "html";

interface UsageGuide {
	file: string;
	language: string;
	code: string;
}

const methodOrder = ["npm", "cdn"] as const;
const frameworkOrder = ["react", "vue", "solid", "svelte", "html"] as const;

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

function buildCdnSnippet(zh: boolean): string {
	return zh
		? `<!-- 无需构建：引入后自动注册并立即运行 -->
<script src="https://unpkg.com/bluff-spoiler"></script>

<!-- 也可以使用 ESM 产物 -->
<script type="module">
  import "https://unpkg.com/bluff-spoiler/dist/index.mjs";
</script>`
		: `<!-- no build step: auto-registered and ready immediately -->
<script src="https://unpkg.com/bluff-spoiler"></script>

<!-- or use the ESM build -->
<script type="module">
  import "https://unpkg.com/bluff-spoiler/dist/index.mjs";
</script>`;
}

function buildUsageGuides(zh: boolean): Record<FrameworkKey, UsageGuide> {
	const cardNumber = zh ? "6222 0212 3456 7890" : "4242 4242 4242 4242";
	const personName = zh ? "张三" : "Alice Wang";
	const usernameLabel = zh ? "用户名" : "Username";
	const registerOnce = zh
		? "整个应用只需 import 一次，标签即可全局使用"
		: "import once for the whole app, then the tag works everywhere";

	return {
		react: {
			file: "main.tsx",
			language: "tsx",
			code: `// ${registerOnce}
import "bluff-spoiler";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <bluff-spoiler
      particle-color="#6ee7b7"
      particle-shape="diamond"
      particle-bloom
      onToggle={(event: Event) =>
        console.log((event as CustomEvent).detail)
      }
    >
      ${cardNumber}
    </bluff-spoiler>
  </StrictMode>,
);`,
		},
		vue: {
			file: "App.vue",
			language: "vue",
			code: `<script setup lang="ts">
// ${registerOnce}
import "bluff-spoiler";

function onToggle(event: Event) {
  console.log((event as CustomEvent).detail);
}
</script>

<template>
  <bluff-spoiler
    particle-color="#34d399"
    particle-shape="circle"
    particle-bloom
    @toggle="onToggle"
  >
    ${cardNumber}
  </bluff-spoiler>
</template>`,
		},
		solid: {
			file: "main.tsx",
			language: "tsx",
			code: `// ${registerOnce}
import "bluff-spoiler";
import { render } from "solid-js/web";

render(
  () => (
    <bluff-spoiler
      particle-color="#34d399"
      particle-shape="diamond"
      particle-bloom
      onToggle={(event: CustomEvent) => console.log(event.detail)}
    >
      ${cardNumber}
    </bluff-spoiler>
  ),
  document.getElementById("root")!,
);`,
		},
		svelte: {
			file: "App.svelte",
			language: "svelte",
			code: `<script lang="ts">
  // ${registerOnce}
  import "bluff-spoiler";
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
  ${cardNumber}
</bluff-spoiler>`,
		},
		html: {
			file: "index.html",
			language: "html",
			code: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <!-- ${zh
			? "纯 HTML：一个 script 标签即可，无需任何构建工具"
			: "pure HTML: one script tag, no build tooling at all"} -->
    <script src="https://unpkg.com/bluff-spoiler"></script>
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
	};
}

interface MethodTheme {
	card: string;
	iconChip: string;
}

const methodThemes: Record<MethodKey, MethodTheme> = {
	npm: {
		card: "hover:border-emerald-400/60 dark:hover:border-emerald-500/40",
		iconChip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
	},
	cdn: {
		card: "hover:border-sky-400/60 dark:hover:border-sky-500/40",
		iconChip: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
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

function DownloadCard({ method, code, label }: { method: MethodKey; code: string; label: string }) {
	const { t } = useTranslation();
	const theme = methodThemes[method];
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

			<div className="mt-5 flex-1">
				<CodeBlock code={code} label={label} language={method === "npm" ? "bash" : "html"} />
			</div>
		</article>
	);
}

export function FrameworkTabs() {
	const { t, i18n } = useTranslation();
	const zh = Boolean(i18n.resolvedLanguage?.startsWith("zh"));
	const [framework, setFramework] = useState<FrameworkKey>("react");
	const frameworkTabs = useRovingTabs(frameworkOrder, framework, setFramework);
	const guide = buildUsageGuides(zh)[framework];

	return (
		<div className="mt-10 space-y-10">
			{/* Download methods: two independent cards, no linkage */}
			<div className="grid items-stretch gap-5 sm:gap-6 lg:grid-cols-2">
				<DownloadCard method="npm" code={installSnippet} label="bash" />
				<DownloadCard method="cdn" code={buildCdnSnippet(zh)} label="index.html" />
			</div>

			{/* Usage: a single tab group for ESM frameworks plus pure HTML */}
			<div>
				<h3 className="text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
					{t("install.usageTitle")}
				</h3>

				<div
					role="tablist"
					aria-label={t("install.frameworksAriaLabel")}
					onKeyDown={frameworkTabs.onKeyDown}
					className="mt-4 grid grid-cols-5 gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-900/70"
				>
					{frameworkOrder.map((key) => {
						const selected = framework === key;
						return (
							<button
								key={key}
								{...frameworkTabs.tabProps(key)}
								type="button"
								role="tab"
								id={`usage-tab-${key}`}
								aria-selected={selected}
								aria-controls="usage-panel"
								onClick={() => setFramework(key)}
								className={`cursor-pointer rounded-lg px-1 py-2 text-[11px] font-semibold transition sm:text-xs ${
									selected
										? "bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-400"
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
					id="usage-panel"
					aria-labelledby={`usage-tab-${framework}`}
					className="mt-5"
				>
					<CodeBlock code={guide.code} label={guide.file} language={guide.language} />
				</div>
			</div>
		</div>
	);
}
