import type { Theme } from "../lib/use-theme";
import { useTranslation } from "react-i18next";
import { MoonIcon, SunIcon } from "./icons";

export interface ThemeToggleProps {
	theme: Theme
	onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
	const { t } = useTranslation();
	const label = t("theme.toggle");
	return (
		<button
			type="button"
			onClick={onToggle}
			aria-label={label}
			title={label}
			className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
		>
			{theme === "dark" ? <SunIcon /> : <MoonIcon />}
		</button>
	);
}
