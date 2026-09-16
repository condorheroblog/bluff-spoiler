import type { BluffSpoilerToggleDetail, ParticleShape } from "bluff-spoiler";
import { useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { BluffSpoiler } from "../components/bluff-spoiler";
import { CodeBlock } from "../components/code-block";
import { FrameworkTabs } from "../components/framework-tabs";
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

const creditCardData = {
	en: { number: "4242 4242 4242 4242", holder: "ALICE WANG", expiry: "08/28", cvv: "123" },
	zh: { number: "6222 0212 3456 7890", holder: "张三", expiry: "08/28", cvv: "826" },
} as const;

const verticalSecrets = {
	en: ["BLACK JADE", "MAPLES OVER THE COLD RIVER"],
	zh: ["玄甲军", "枫落吴江冷"],
} as const;

function CardField({ label, children }: { label: string, children: ReactNode }) {
	return (
		<div>
			<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/55">
				{label}
			</p>
			<p className="mt-1.5 font-mono text-sm tracking-wider text-white">{children}</p>
		</div>
	);
}

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

const heroSegmentStyles = [
	{ particleColor: "#1fa669", particleShape: "diamond", particleBloom: true },
	{ particleColor: "#38bdf8", particleShape: "circle" },
	{ particleColor: "#f59e0b", particleShape: "triangle" },
] as const;

// Auto-loop timeline within one cycle (ms): every segment starts visible,
// is masked one by one ("encrypted"), then revealed again.
const HERO_HIDE_AT = [900, 1600, 2300];
const HERO_REVEAL_AT = [5600, 6300, 7000];
const HERO_CYCLE_MS = 9600;

/**
 * Hero paragraph that demonstrates the component on itself: three phrases of
 * the marketing copy are live spoilers, auto-playing an encrypt/reveal loop.
 * Hovering pauses the loop; the first manual toggle hands control to the user.
 */
function HeroDescription() {
	const { t } = useTranslation();
	const [revealedStates, setRevealedStates] = useState<boolean[]>(() =>
		window.matchMedia("(prefers-reduced-motion: reduce)").matches
			? [false, false, false]
			: [true, true, true],
	);
	const hoverRef = useRef(false);
	const autoRef = useRef(true);
	const elapsedRef = useRef(0);
	const lastTickRef = useRef<number | null>(null);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
			return;

		const timer = window.setInterval(() => {
			if (document.hidden || hoverRef.current || !autoRef.current) {
				lastTickRef.current = null;
				return;
			}
			const now = performance.now();
			if (lastTickRef.current !== null)
				elapsedRef.current += now - lastTickRef.current;
			lastTickRef.current = now;

			const phase = elapsedRef.current % HERO_CYCLE_MS;
			setRevealedStates((previous) => {
				const next = HERO_HIDE_AT.map(
					(hideAt, index) => !(phase >= hideAt && phase < HERO_REVEAL_AT[index]),
				);
				return next.every((value, index) => value === previous[index]) ? previous : next;
			});
		}, 100);

		return () => window.clearInterval(timer);
	}, []);

	const handleToggle = (index: number, detail: BluffSpoilerToggleDetail) => {
		if (detail.source === "api")
			return;
		autoRef.current = false;
		setRevealedStates((previous) => {
			if (previous[index] === detail.revealed)
				return previous;
			const next = [...previous];
			next[index] = detail.revealed;
			return next;
		});
	};

	const spoiler = (index: number, secretKey: string) => (
		<BluffSpoiler
			{...heroSegmentStyles[index]}
			particleTransition={600}
			revealed={revealedStates[index]}
			onToggle={detail => handleToggle(index, detail)}
		>
			{t(secretKey)}
		</BluffSpoiler>
	);

	return (
		<div>
			<p
				className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400"
				onPointerEnter={() => { hoverRef.current = true; }}
				onPointerLeave={() => { hoverRef.current = false; }}
			>
				{t("hero.descriptionPre")}
				{spoiler(0, "hero.secretSensitive")}
				{t("hero.descriptionMid1")}
				{spoiler(1, "hero.secretInvisible")}
				{t("hero.descriptionMid2")}
				{spoiler(2, "hero.secretAction")}
				{t("hero.descriptionPost")}
			</p>
			<p className="mt-3 text-xs text-slate-400">{t("hero.autoHint")}</p>
		</div>
	);
}

export function HomePage() {
	const { t, i18n } = useTranslation();
	const zh = i18n.resolvedLanguage?.startsWith("zh");
	const card = zh ? creditCardData.zh : creditCardData.en;
	const secrets: readonly string[] = zh ? verticalSecrets.zh : verticalSecrets.en;

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
						<HeroDescription />
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

			{/* --------------------------- Credit card --------------------------- */}
			<section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
				<div className="text-center">
					<h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
						{t("creditCard.title")}
					</h2>
					<p className="mt-3 text-slate-500 dark:text-slate-400">{t("creditCard.subtitle")}</p>
				</div>

				<div className="mt-10 flex justify-center">
					<div className="relative w-full max-w-[470px] overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-[#16242f] via-[#0e1822] to-[#090e14] p-7 shadow-2xl shadow-emerald-950/40">
						<div
							aria-hidden="true"
							className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-500/15 blur-3xl"
						/>
						<div
							aria-hidden="true"
							className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-teal-400/10 blur-3xl"
						/>

						<div className="relative flex items-start justify-between">
							<span className="font-mono text-sm font-semibold tracking-[0.25em] text-emerald-200/90">
								{t("creditCard.brand")}
							</span>
							<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
								<path d="M8.5 6.5a8 8 0 0 1 0 11" />
								<path d="M12 4a11 11 0 0 1 0 16" />
								<path d="M15.5 1.5a14 14 0 0 1 0 21" />
							</svg>
						</div>

						<svg className="relative mt-6" width="46" height="34" viewBox="0 0 46 34" aria-hidden="true">
							<defs>
								<linearGradient id="card-chip" x1="0" y1="0" x2="1" y2="1">
									<stop offset="0%" stopColor="#f5e08a" />
									<stop offset="100%" stopColor="#c9a145" />
								</linearGradient>
							</defs>
							<rect x="2" y="2" width="42" height="30" rx="7" fill="url(#card-chip)" />
							<path d="M2 12h42M2 22h42M17 2v30M29 2v30" stroke="#8a6d2f" strokeOpacity="0.55" strokeWidth="1.2" />
						</svg>

						<div className="relative mt-6">
							<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/55">
								{t("creditCard.numberLabel")}
							</p>
							<p className="mt-1.5 font-mono text-[22px] leading-relaxed tracking-[0.14em] text-white">
								<BluffSpoiler particleColor="#6ee7b7" particleShape="diamond" particleBloom particleSize={1.5}>
									{card.number}
								</BluffSpoiler>
							</p>
						</div>

						<div className="relative mt-6 grid grid-cols-3 gap-4">
							<CardField label={t("creditCard.holderLabel")}>
								<BluffSpoiler particleColor="#34d399" particleShape="circle" particleBloom>
									{card.holder}
								</BluffSpoiler>
							</CardField>
							<CardField label={t("creditCard.expiryLabel")}>
								<BluffSpoiler particleColor="#a7f3d0" particleShape="square" particleBloom>
									{card.expiry}
								</BluffSpoiler>
							</CardField>
							<CardField label={t("creditCard.cvvLabel")}>
								<BluffSpoiler particleColor="#fbbf24" particleShape="triangle" particleBloom>
									{card.cvv}
								</BluffSpoiler>
							</CardField>
						</div>
					</div>
				</div>
				<p className="mt-5 text-center text-xs text-slate-400">{t("creditCard.hint")}</p>
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

			{/* ----------------------------- Vertical ---------------------------- */}
			<section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
				<div className="text-center">
					<h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
						{t("vertical.title")}
					</h2>
					<p className="mt-3 text-slate-500 dark:text-slate-400">{t("vertical.subtitle")}</p>
				</div>
				<div className="mt-10 flex justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
					<div className="vertical-text demo-prose h-72 text-lg text-slate-700 dark:text-slate-300">
						{(() => {
							const pattern = new RegExp(`(${secrets.map(escapeRegExp).join("|")})`);
							return t("vertical.paragraph")
								.split(pattern)
								.filter(Boolean)
								.map((part, index) =>
									secrets.includes(part)
										? (
											<BluffSpoiler
												key={part}
												particleColor={index % 2 ? "#f59e0b" : "#1fa669"}
												particleShape={index % 2 ? "square" : "circle"}
												particleBloom
											>
												{part}
											</BluffSpoiler>
										)
										: part,
								);
						})()}
					</div>
				</div>
				<p className="mt-4 text-center text-xs text-slate-400">{t("vertical.hint")}</p>
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

					{/* One long masked block that continuously spans three lines */}
					<div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
						<div className="mx-auto max-w-md">
							<p className="demo-prose text-slate-700 dark:text-slate-300">
								{t("wrapping.longLead")}
								<BluffSpoiler particleColor="#38bdf8" particleShape="circle" particleJitter={1.6}>
									{t("wrapping.longSecret")}
								</BluffSpoiler>
								{t("wrapping.longTrail")}
							</p>
							<p className="mt-3 text-xs text-slate-400">{t("wrapping.longHint")}</p>
						</div>
					</div>
				</div>
			</section>

			{/* ------------------------------ Install ---------------------------- */}
			<section className="border-t border-slate-200/70 bg-white/60 py-16 dark:border-slate-800/70 dark:bg-slate-900/20">
				<div className="mx-auto max-w-6xl px-4 sm:px-6">
					<div className="text-center">
						<h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
							{t("install.title")}
						</h2>
						<p className="mt-3 text-slate-500 dark:text-slate-400">{t("install.subtitle")}</p>
					</div>
					<FrameworkTabs />
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
