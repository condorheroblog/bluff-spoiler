import { useTranslation } from "react-i18next";
import { GitHubIcon } from "./icons";

const REPOSITORY_URL = "https://github.com/condorheroblog/bluff-spoiler";

export function GitHubLink({ compact = false }: { compact?: boolean }) {
	const { t } = useTranslation();
	return (
		<a
			href={REPOSITORY_URL}
			target="_blank"
			rel="noreferrer noopener"
			aria-label={t("nav.github")}
			title={t("nav.github")}
			className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
		>
			<GitHubIcon width={compact ? 20 : 18} height={compact ? 20 : 18} />
			{!compact && <span className="hidden sm:inline">{t("nav.github")}</span>}
		</a>
	);
}

export { REPOSITORY_URL };
