import type { BluffSpoilerStateDetail, BluffSpoilerToggleDetail } from "bluff-spoiler";
import type { ParticleConfig } from "../lib/particle-config";
import { isParticleShape } from "bluff-spoiler";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { BluffSpoiler } from "../components/bluff-spoiler";
import { CodeBlock } from "../components/code-block";
import { ParticleControlPanel } from "../components/particle-control-panel";
import {
	buildSnippetMarkup,
	defaultParticleConfig,
} from "../lib/particle-config";

interface LogEntry {
	id: number
	time: string
	kind: "toggle" | "reveal" | "hide"
	message: string
}

export function PlaygroundPage() {
	const { t, i18n } = useTranslation();
	const zh = i18n.resolvedLanguage?.startsWith("zh");

	const [searchParams, setSearchParams] = useSearchParams();
	const shapeFromUrl = searchParams.get("shape");

	const [config, setConfig] = useState<ParticleConfig>(() => ({
		...defaultParticleConfig,
		shape: isParticleShape(shapeFromUrl) ? shapeFromUrl : defaultParticleConfig.shape,
	}));
	const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
	const [wrapWidth, setWrapWidth] = useState(100);
	const [batch, setBatch] = useState(0);
	const [allRevealed, setAllRevealed] = useState(false);
	const logIdRef = useRef(0);

	const patchConfig = useCallback((patch: Partial<ParticleConfig>) => {
		setConfig(current => ({ ...current, ...patch }));
		if (patch.shape) {
			const next = new URLSearchParams(window.location.search);
			next.set("shape", patch.shape);
			setSearchParams(next, { replace: true });
		}
	}, [setSearchParams]);

	const resetConfig = useCallback(() => {
		setConfig(defaultParticleConfig);
		const next = new URLSearchParams(window.location.search);
		next.delete("shape");
		setSearchParams(next, { replace: true });
	}, [setSearchParams]);

	const pushLog = useCallback((kind: LogEntry["kind"], message: string) => {
		const time = new Date().toLocaleTimeString();
		setLogEntries(current => [
			{ id: ++logIdRef.current, time, kind, message },
			...current,
		].slice(0, 30));
	}, []);

	const handleToggle = useCallback((detail: BluffSpoilerToggleDetail) => {
		pushLog("toggle", `→ ${detail.revealed ? "revealed" : "hidden"} (source: ${detail.source})`);
	}, [pushLog]);

	const handleReveal = useCallback((detail: BluffSpoilerStateDetail) => {
		pushLog("reveal", `content shown (source: ${detail.source})`);
	}, [pushLog]);

	const handleHide = useCallback((detail: BluffSpoilerStateDetail) => {
		pushLog("hide", `content hidden (source: ${detail.source})`);
	}, [pushLog]);

	const spoilerProps = {
		particleColor: config.color,
		particleSize: config.size,
		particleDensity: config.density,
		particleCount: config.autoCount ? null : config.count,
		particleBloom: config.bloom,
		particleOpacity: config.opacity,
		particleSpeed: config.speed,
		particleJitter: config.jitter,
		particleShape: config.shape,
		particleMotion: config.motion,
		particleTransition: config.transition,
		particleFade: config.fade,
		onToggle: handleToggle,
		onReveal: handleReveal,
		onHide: handleHide,
	};

	const snippet = useMemo(() => buildSnippetMarkup(config, zh ? "敏感信息" : "sensitive"), [config, zh]);

	const previewSentence = zh
		? [
			{ prefix: "持卡人：", secret: "张三" },
			{ prefix: "，卡号：", secret: "6222 0000 1234 5678" },
			{ prefix: "，CVV：", secret: "826" },
		]
		: [
			{ prefix: "Cardholder: ", secret: "Alice Wang" },
			{ prefix: ", card: ", secret: "4242 4242 4242 4242" },
			{ prefix: ", CVV: ", secret: "123" },
		];

	const wrapSentence = zh
		? "本工单由 张三 提交，联系电话 138-0000-0000，身份证号 110101199001011234，紧急联系人李四（139-1111-2222），备用邮箱 lisi@example.com，所有敏感字段均使用 bluff-spoiler 遮罩。"
		: "This ticket was opened by Alice Wang, reachable at 555-0100-2048 with passport number X12345678. Her manager Bob Li (555-0188-9090, bob.li@example.com) and backup contact carol@example.com are also masked with bluff-spoiler.";

	const wrapSecrets = zh
		? ["张三", "138-0000-0000", "110101199001011234", "李四", "139-1111-2222", "lisi@example.com"]
		: ["Alice Wang", "555-0100-2048", "X12345678", "Bob Li", "555-0188-9090", "bob.li@example.com", "carol@example.com"];

	const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const wrapPattern = new RegExp(`(${wrapSecrets.map(escapeRegExp).join("|")})`);

	const revealAll = () => {
		setAllRevealed(true);
		setBatch(b => b + 1);
	};
	const hideAll = () => {
		setAllRevealed(false);
		setBatch(b => b + 1);
	};

	return (
		<div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
			<div className="mb-10">
				<h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
					{t("playground.title")}
				</h1>
				<p className="mt-2 text-slate-500 dark:text-slate-400">{t("playground.subtitle")}</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-[340px_1fr]">
				<ParticleControlPanel config={config} onChange={patchConfig} onReset={resetConfig} />

				<div className="space-y-6">
					{/* Live preview */}
					<section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
							<h2 className="text-sm font-semibold text-slate-900 dark:text-white">
								{t("playground.preview")}
							</h2>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={revealAll}
									className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-400"
								>
									{t("playground.revealAll")}
								</button>
								<button
									type="button"
									onClick={hideAll}
									className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300"
								>
									{t("playground.hideAll")}
								</button>
							</div>
						</div>
						<p className="demo-prose text-[15px] leading-loose text-slate-700 dark:text-slate-200">
							{previewSentence.map(part => (
								<span key={part.secret}>
									{part.prefix}
									<BluffSpoiler key={`${batch}-${part.secret}`} {...spoilerProps} revealed={allRevealed}>
										{part.secret}
									</BluffSpoiler>
								</span>
							))}
						</p>
						<p className="mt-3 text-xs text-slate-400">{t("playground.previewHint")}</p>
					</section>

					{/* Line wrapping */}
					<section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
						<div className="mb-4">
							<h2 className="text-sm font-semibold text-slate-900 dark:text-white">
								{t("playground.wrappingTitle")}
							</h2>
							<p className="mt-1 text-xs text-slate-400">{t("playground.wrappingHint")}</p>
						</div>
						<label className="mb-4 block">
							<span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
								{t("playground.containerWidth")}
								{" "}
								·
								{wrapWidth}
								%
							</span>
							<input
								type="range"
								min={35}
								max={100}
								step={1}
								value={wrapWidth}
								onChange={event => setWrapWidth(Number(event.target.value))}
								className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-slate-700"
							/>
						</label>
						<div
							className="rounded-lg border border-dashed border-slate-300 p-4 transition-[width] duration-150 dark:border-slate-700"
							style={{ width: `${wrapWidth}%` }}
						>
							<p className="demo-prose text-[15px] leading-8 text-slate-700 dark:text-slate-200">
								{wrapSentence
									.split(wrapPattern)
									.filter(Boolean)
									.map(part =>
										wrapSecrets.includes(part)
											? (
												<BluffSpoiler key={`${batch}-w-${part}`} {...spoilerProps} revealed={allRevealed}>
													{part}
												</BluffSpoiler>
											)
											: part,
									)}
							</p>
						</div>
					</section>

					{/* Event log */}
					<section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-sm font-semibold text-slate-900 dark:text-white">
								{t("playground.log")}
							</h2>
							<button
								type="button"
								onClick={() => setLogEntries([])}
								className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:text-emerald-600 dark:hover:text-emerald-400"
							>
								{t("playground.clear")}
							</button>
						</div>
						{logEntries.length === 0
							? (
								<p className="py-6 text-center font-mono text-xs text-slate-400">
									{t("playground.logEmpty")}
								</p>
							)
							: (
								<ul className="space-y-1.5 font-mono text-xs">
									{logEntries.map(entry => (
										<li key={entry.id} className="flex gap-3">
											<span className="text-slate-400">{entry.time}</span>
											<span
												className={`w-16 font-semibold ${
													entry.kind === "toggle"
														? "text-amber-500"
														: entry.kind === "reveal"
															? "text-emerald-500"
															: "text-sky-500"
												}`}
											>
												{entry.kind}
											</span>
											<span className="text-slate-600 dark:text-slate-300">{entry.message}</span>
										</li>
									))}
								</ul>
							)}
					</section>

					{/* Snippet */}
					<section>
						<h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
							{t("playground.snippet")}
						</h2>
						<CodeBlock code={snippet} label="index.html" language="html" />
					</section>

					<p className="text-center text-xs text-slate-400">
						<Link to="/" className="hover:text-emerald-500">
							←
							{t("nav.home")}
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
