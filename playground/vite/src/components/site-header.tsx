import type { Theme } from "../lib/use-theme";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router";
import { GitHubLink } from "./github-link";
import { LanguageToggle } from "./language-toggle";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export interface SiteHeaderProps {
	theme: Theme
	onToggleTheme: () => void
}

export function SiteHeader({ theme, onToggleTheme }: SiteHeaderProps) {
	const { t } = useTranslation();

	const linkClass = ({ isActive }: { isActive: boolean }) =>
		`rounded-md px-3 py-1.5 text-sm font-medium transition ${
			isActive
				? "text-emerald-600 dark:text-emerald-400"
				: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
		}`;

	return (
		<header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800/70 dark:bg-[#0a0e13]/80">
			<div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
				<Link to="/" className="flex items-center gap-2.5" aria-label="bluff-spoiler">
					<Logo size={30} />
					<span className="font-mono text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
						bluff-spoiler
					</span>
				</Link>

				<nav className="ml-4 hidden items-center gap-1 sm:flex" aria-label="Main">
					<NavLink to="/" end className={linkClass}>
						{t("nav.home")}
					</NavLink>
					<NavLink to="/playground" className={linkClass}>
						{t("nav.playground")}
					</NavLink>
				</nav>

				<div className="ml-auto flex items-center gap-2">
					<LanguageToggle />
					<ThemeToggle theme={theme} onToggle={onToggleTheme} />
					<GitHubLink />
				</div>
			</div>

			<nav className="flex items-center justify-center gap-4 border-t border-slate-200/70 py-2 sm:hidden dark:border-slate-800/70">
				<NavLink to="/" end className={linkClass}>
					{t("nav.home")}
				</NavLink>
				<NavLink to="/playground" className={linkClass}>
					{t("nav.playground")}
				</NavLink>
			</nav>
		</header>
	);
}
