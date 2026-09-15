import type { ParticleMotion, ParticleShape } from "bluff-spoiler";
import type { ParticleConfig } from "../lib/particle-config";
import { useTranslation } from "react-i18next";
import { motionOptions, shapeOptions } from "../lib/particle-config";

export interface ParticleControlPanelProps {
	config: ParticleConfig
	onChange: (patch: Partial<ParticleConfig>) => void
	onReset: () => void
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
	return (
		<label className="block">
			<span className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
				{label}
			</span>
			{children}
		</label>
	);
}

const rangeClass = "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-slate-700";

export function ParticleControlPanel({ config, onChange, onReset }: ParticleControlPanelProps) {
	const { t } = useTranslation();

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/50">
			<div className="mb-5 flex items-center justify-between">
				<h2 className="text-sm font-semibold text-slate-900 dark:text-white">
					{t("playground.controls")}
				</h2>
				<button
					type="button"
					onClick={onReset}
					className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:text-emerald-600 dark:hover:text-emerald-400"
				>
					{t("playground.reset")}
				</button>
			</div>

			<div className="space-y-5">
				<div className="grid grid-cols-2 gap-4">
					<Field label={t("playground.color")}>
						<input
							type="color"
							value={config.color}
							onChange={event => onChange({ color: event.target.value })}
							className="h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
						/>
					</Field>
					<Field label={t("playground.shape")}>
						<select
							value={config.shape}
							onChange={event => onChange({ shape: event.target.value as ParticleShape })}
							className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
						>
							{shapeOptions.map(shape => (
								<option key={shape} value={shape}>
									{t(`playground.shape${shape.charAt(0).toUpperCase()}${shape.slice(1)}`)}
									{" "}
									(
									{shape}
									)
								</option>
							))}
						</select>
					</Field>
				</div>

				<Field label={t("playground.motion")}>
					<select
						value={config.motion}
						onChange={event => onChange({ motion: event.target.value as ParticleMotion })}
						className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
					>
						{motionOptions.map(motion => (
							<option key={motion} value={motion}>
								{t(`playground.motion${motion.charAt(0).toUpperCase()}${motion.slice(1)}`)}
								{" "}
								(
								{motion}
								)
							</option>
						))}
					</select>
				</Field>

				<Field label={`${t("playground.size")} · ${config.size.toFixed(1)}px`}>
					<input
						type="range"
						min={0.5}
						max={8}
						step={0.1}
						value={config.size}
						onChange={event => onChange({ size: Number(event.target.value) })}
						className={rangeClass}
					/>
				</Field>

				<Field label={t("playground.countAuto")}>
					<label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
						<input
							type="checkbox"
							checked={config.autoCount}
							onChange={event => onChange({ autoCount: event.target.checked })}
							className="h-4 w-4 accent-emerald-500"
						/>
						<span className="text-xs">{t("playground.countAuto")}</span>
					</label>
				</Field>

				{config.autoCount
					? (
						<Field label={`${t("playground.density")} · ${config.density}`}>
							<input
								type="range"
								min={0}
								max={5000}
								step={5}
								value={config.density}
								onChange={event => onChange({ density: Number(event.target.value) })}
								className={rangeClass}
							/>
						</Field>
					)
					: (
						<Field label={`${t("playground.count")} · ${config.count}`}>
							<input
								type="range"
								min={0}
								max={120}
								step={1}
								value={config.count}
								onChange={event => onChange({ count: Number(event.target.value) })}
								className={rangeClass}
							/>
						</Field>
					)}

				<Field label={`${t("playground.opacity")} · ${config.opacity.toFixed(2)}`}>
					<input
						type="range"
						min={0.1}
						max={1}
						step={0.05}
						value={config.opacity}
						onChange={event => onChange({ opacity: Number(event.target.value) })}
						className={rangeClass}
					/>
				</Field>

				<Field label={`${t("playground.speed")} · ${config.speed.toFixed(1)}×`}>
					<input
						type="range"
						min={0}
						max={5}
						step={0.1}
						value={config.speed}
						onChange={event => onChange({ speed: Number(event.target.value) })}
						className={rangeClass}
					/>
				</Field>

				<Field label={`${t("playground.jitter")} · ${config.jitter.toFixed(1)}px`}>
					<input
						type="range"
						min={0}
						max={20}
						step={0.5}
						value={config.jitter}
						onChange={event => onChange({ jitter: Number(event.target.value) })}
						className={rangeClass}
					/>
				</Field>

				<Field
					label={config.transition === 0
						? `${t("playground.transition")} · 0ms (${t("playground.transitionInstant")})`
						: `${t("playground.transition")} · ${config.transition.toFixed(0)}ms`}
				>
					<input
						type="range"
						min={0}
						max={1200}
						step={50}
						value={config.transition}
						onChange={event => onChange({ transition: Number(event.target.value) })}
						className={rangeClass}
					/>
				</Field>

				<Field
					label={config.fade === 0
						? `${t("playground.fade")} · 0ms (${t("playground.fadeOff")})`
						: `${t("playground.fade")} · ${config.fade.toFixed(0)}ms`}
				>
					<input
						type="range"
						min={0}
						max={6000}
						step={100}
						value={config.fade}
						onChange={event => onChange({ fade: Number(event.target.value) })}
						className={rangeClass}
					/>
				</Field>

				<Field label={t("playground.bloom")}>
					<button
						type="button"
						role="switch"
						aria-checked={config.bloom}
						onClick={() => onChange({ bloom: !config.bloom })}
						className={`relative h-6 w-11 rounded-full transition ${
							config.bloom ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
						}`}
					>
						<span
							className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
								config.bloom ? "left-[22px]" : "left-0.5"
							}`}
						/>
					</button>
				</Field>
			</div>
		</div>
	);
}
