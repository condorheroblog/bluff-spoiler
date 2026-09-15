import type { ParticleShape } from "bluff-spoiler";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { BluffSpoiler } from "../components/bluff-spoiler";
import { CodeBlock } from "../components/code-block";
import { REPOSITORY_URL } from "../components/github-link";
import { ArrowRightIcon, GitHubIcon } from "../components/icons";
import { Logo } from "../components/logo";

interface Feature {
	key: string
	icon: ReactElement
}

const features: Feature[] = [
	{
		key: "inline",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
				<path d="M3 7h18M3 12h18M3 17h18" />
				<rect x="7" y="5.5" width="6" height="13" rx="1.5" fill="currentColor" fillOpacity="0.15" stroke="none" />
			</svg>
		),
	},
	{
		key: "particles",
		icon: (
			<svg viewBox="0 0 24 24" fill="currentColor">
				<circle cx="6" cy="7" r="1.6" />
				<circle cx="12" cy="5" r="1.2" />
				<circle cx="18" cy="8" r="1.5" />
				<circle cx="9" cy="13" r="1.3" />
				<circle cx="15" cy="14" r="1.7" />
				<circle cx="7" cy="18" r="1.1" />
				<circle cx="17" cy="18" r="1.2" />
			</svg>
		),
	},
	{
		key: "config",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
				<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0" />
				<circle cx="16" cy="6" r="2" />
				<circle cx="8" cy="12" r="2" />
				<circle cx="18" cy="18" r="2" />
			</svg>
		),
	},
	{
		key: "events",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
				<path d="M13 2 4.5 13H11l-1 9 9-12h-6l0-8Z" />
			</svg>
		),
	},
	{
		key: "agnostic",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
				<circle cx="12" cy="12" r="9" />
				<path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z" />
			</svg>
		),
	},
	{
		key: "a11y",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
				<circle cx="12" cy="5" r="1.6" />
				<path d="M4 8h16M12 8v6m-4 7 4-7 4 7M8 11l4 1 4-1" />
			</svg>
		),
	},
];

const shapeShowcase: Array<{ shape: ParticleShape, secret: string, bloom?: boolean }> = [
	{ shape: "circle", secret: "circle-secret" },
	{ shape: "square", secret: "square-secret" },
	{ shape: "triangle", secret: "triangle-secret" },
	{ shape: "diamond", secret: "diamond-secret", bloom: true },
];

const snippetImport = `# npm
npm install bluff-spoiler

# pnpm
pnpm add bluff-spoiler`;

const snippetRegister = "import \"bluff-spoiler\"; // registers <bluff-spoiler>";

const snippetHtml = `<!-- hidden by default, click to reveal -->
用户名<bluff-spoiler>张三</bluff-spoiler>
年龄<bluff-spoiler
  particle-shape="diamond"
  particle-bloom
  particle-color="#34d399"
>130</bluff-spoiler>`;

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const snippetEvents = `const el = document.querySelector("bluff-spoiler");

el.addEventListener("toggle", (event) => {
  console.log("next state:", event.detail.revealed, event.detail.source);
  // keep the secret hidden in some business condition
  // event.preventDefault();
});

el.addEventListener("reveal", () => analytics.track("spoiler_revealed"));
el.addEventListener("hide", () => analytics.track("spoiler_hide"));

// plain native click still works for custom logic
el.addEventListener("click", () => { /* ... */ });`;

export function HomePage() {
	const { t, i18n } = useTranslation();
	const zh = i18n.resolvedLanguage?.startsWith("zh");

	return (
		<>
			{/* ------------------------------- Hero ------------------------------ */}
			<section className="relative overflow-hidden">
				<div className="hero-grid absolute inset-0" aria-hidden="true" />
				<div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
					<div className="mx-auto max-w-3xl text-center">
						<div className="mb-6 flex justify-center">
							<Logo size={72} className="drop-shadow-[0_0_28px_rgba(31,166,105,0.35)]" />
						</div>
						<span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
							{t("hero.badge")}
						</span>
						<h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl dark:text-white">
							{t("hero.titleStart")}
							<span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
								{" "}
								{t("hero.titleHighlight")}
								{" "}
							</span>
							{t("hero.titleEnd")}
						</h1>
						<p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
							{t("hero.description")}
						</p>
						<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
							<Link
								to="/playground"
								className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
							>
								{t("hero.ctaPrimary")}
								<ArrowRightIcon />
							</Link>
							<a
								href={REPOSITORY_URL}
								target="_blank"
								rel="noreferrer noopener"
								className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-slate-500"
							>
								<GitHubIcon width={16} height={16} />
								{t("hero.ctaSecondary")}
							</a>
						</div>
					</div>

					{/* Live inline demo */}
					<div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-200/50 backdrop-blur sm:p-8 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-black/30">
						<p className="demo-prose text-center text-lg leading-loose text-slate-700 dark:text-slate-200">
							{t("hero.username")}
							<BluffSpoiler particleBloom particleColor="#34d399" particleShape="diamond">
								{zh ? "张三" : "Alice"}
							</BluffSpoiler>
							{t("hero.age")}
							<BluffSpoiler particleColor="#f59e0b" particleShape="circle">
								130
							</BluffSpoiler>
						</p>
						<p className="mt-4 text-center text-xs text-slate-400">
							{t("hero.demoHint")}
						</p>
					</div>
				</div>
			</section>

			{/* ----------------------------- Features ---------------------------- */}
			<section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
				<div className="text-center">
					<h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
						{t("features.title")}
					</h2>
					<p className="mt-3 text-slate-500 dark:text-slate-400">{t("features.subtitle")}</p>
				</div>
				<div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{features.map(({ key, icon }) => (
						<article
							key={key}
							className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/5 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-emerald-500/40"
						>
							<div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 [&>svg]:h-5 [&>svg]:w-5">
								{icon}
							</div>
							<h3 className="text-base font-semibold text-slate-900 dark:text-white">
								{t(`features.${key}.title`)}
							</h3>
							<p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
								{t(`features.${key}.description`)}
							</p>
						</article>
					))}
				</div>
			</section>

			{/* ------------------------------ Shapes ----------------------------- */}
			<section className="border-y border-slate-200/70 bg-white/60 py-16 dark:border-slate-800/70 dark:bg-slate-900/20">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<div className="text-center">
						<h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
							{t("shapes.title")}
						</h2>
						<p className="mt-3 text-slate-500 dark:text-slate-400">{t("shapes.subtitle")}</p>
					</div>
					<div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{shapeShowcase.map(item => (
							<div
								key={item.shape}
								className="rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900/60"
							>
								<p className="demo-prose text-base text-slate-700 dark:text-slate-200">
									<BluffSpoiler
										particleShape={item.shape}
										particleBloom={item.bloom}
										particleColor={item.shape === "triangle" ? "#f59e0b" : "#1fa669"}
										particleSize={2.4}
									>
										{item.secret}
									</BluffSpoiler>
								</p>
								<p className="mt-3 font-mono text-xs text-slate-400">
									particle-shape="
									{item.shape}
									"
								</p>
								<p className="mt-1 text-xs text-slate-400">{t("shapes.clickHint")}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ----------------------------- Wrapping ---------------------------- */}
			<section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
				<div className="text-center">
					<h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
						{t("wrapping.title")}
					</h2>
					<p className="mt-3 text-slate-500 dark:text-slate-400">{t("wrapping.subtitle")}</p>
				</div>
				<div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-[15px] leading-8 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900/50">
					<p className="demo-prose text-slate-700 dark:text-slate-300">
						{(() => {
							const secretValues = zh
								? ["张三", "E12345678", "+86 138-0000-0000", "zhangsan@example.com"]
								: ["ZHANG SAN", "E12345678", "+86 138-0000-0000", "zhangsan@example.com"];
							const pattern = new RegExp(`(${secretValues.map(escapeRegExp).join("|")})`);
							return t("wrapping.paragraph")
								.split(pattern)
								.filter(Boolean)
								.map((part, index) => {
									if (secretValues.includes(part)) {
										return (
											<BluffSpoiler
												key={part}
												particleColor={index % 2 ? "#38bdf8" : "#34d399"}
												particleShape={index % 2 ? "triangle" : "circle"}
												particleJitter={1.6}
											>
												{part}
											</BluffSpoiler>
										);
									}
									return part;
								});
						})()}
					</p>
				</div>
			</section>

			{/* ------------------------------ Install ---------------------------- */}
			<section className="border-t border-slate-200/70 bg-white/60 py-16 dark:border-slate-800/70 dark:bg-slate-900/20">
				<div className="mx-auto max-w-4xl px-4 sm:px-6">
					<div className="text-center">
						<h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
							{t("install.title")}
						</h2>
						<p className="mt-3 text-slate-500 dark:text-slate-400">{t("install.subtitle")}</p>
					</div>
					<div className="mt-10 space-y-5">
						<CodeBlock code={snippetImport} label="bash" language="bash" />
						<CodeBlock code={snippetRegister} label="main.ts" language="ts" />
						<CodeBlock code={snippetHtml} label="index.html" language="html" />
					</div>
				</div>
			</section>

			{/* ------------------------------ Events ----------------------------- */}
			<section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
				<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
					{t("install.eventsTitle")}
				</h2>
				<p className="mt-3 text-slate-500 dark:text-slate-400">
					{t("install.eventsDescription")}
				</p>
				<div className="mt-6">
					<CodeBlock code={snippetEvents} label="events.ts" language="ts" />
				</div>
			</section>
		</>
	);
}
