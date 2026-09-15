import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export function NotFoundPage() {
	const { t } = useTranslation();
	return (
		<div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
			<p className="font-mono text-6xl font-bold text-emerald-500">404</p>
			<h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
				{t("notFound.title")}
			</h1>
			<p className="mt-2 text-slate-500 dark:text-slate-400">{t("notFound.description")}</p>
			<Link
				to="/"
				className="mt-8 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
			>
				{t("notFound.back")}
			</Link>
		</div>
	);
}
