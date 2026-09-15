import { useState } from "react";
import { useTranslation } from "react-i18next";
import { REPOSITORY_URL } from "./github-link";
import { GitHubIcon } from "./icons";
import { Logo } from "./logo";

export function SiteFooter() {
	const { t } = useTranslation();
	const [year] = useState(() => new Date().getFullYear());

	return (
		<footer className="mt-24 border-t border-slate-200/70 py-10 dark:border-slate-800/70">
			<div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:px-6">
				<Logo size={36} />
				<p className="font-mono text-sm text-slate-500 dark:text-slate-400">
					©
					{" "}
					{year}
					{" "}
					Condor Hero · bluff-spoiler
				</p>
				<p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
					{t("footer.rights")}
					{" "}
					{t("footer.built")}
				</p>
				<a
					href={REPOSITORY_URL}
					target="_blank"
					rel="noreferrer noopener"
					className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
				>
					<GitHubIcon width={16} height={16} />
					condorheroblog/bluff-spoiler
				</a>
			</div>
		</footer>
	);
}
