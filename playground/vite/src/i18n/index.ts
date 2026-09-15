import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { resources } from "./resources";

export const supportedLanguages = ["en", "zh"] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

export const languageLabels: Record<AppLanguage, string> = {
	en: "English",
	zh: "中文",
};

void i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: "en",
		supportedLngs: supportedLanguages,
		interpolation: {
			escapeValue: false,
		},
		detection: {
			order: ["localStorage", "navigator"],
			lookupLocalStorage: "bluff-spoiler-language",
			caches: ["localStorage"],
		},
	});

export default i18n;
