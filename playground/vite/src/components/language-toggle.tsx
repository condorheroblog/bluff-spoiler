import { useTranslation } from "react-i18next";
import { supportedLanguages } from "../i18n";

export function LanguageToggle() {
	const { i18n, t } = useTranslation();
	const current = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";

	return (
		<div
			role="group"
			aria-label={t("language.toggle")}
			className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800/70"
		>
			{supportedLanguages.map((language) => {
				const active = current === language;
				return (
					<button
						key={language}
						type="button"
						aria-pressed={active}
						onClick={() => void i18n.changeLanguage(language)}
						className={`rounded-md px-2 py-1 transition ${
							active
								? "bg-emerald-500 text-white shadow-sm"
								: "text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
						}`}
					>
						{language === "zh" ? "中文" : "EN"}
					</button>
				);
			})}
		</div>
	);
}
