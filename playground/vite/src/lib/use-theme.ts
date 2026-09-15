import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "bluff-spoiler-theme";

function getInitialTheme(): Theme {
	if (typeof window === "undefined")
		return "dark";
	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (stored === "light" || stored === "dark")
		return stored;
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme): void {
	const root = document.documentElement;
	root.classList.toggle("dark", theme === "dark");
	root.style.colorScheme = theme;
}

/**
 * App-wide light/dark theme with localStorage persistence and system
 * preference fallback. The class is applied before React mounts (see
 * main.tsx) to avoid a flash of the wrong theme.
 */
export function useTheme(): { theme: Theme, toggleTheme: () => void, setTheme: (theme: Theme) => void } {
	const [theme, setTheme] = useState<Theme>(getInitialTheme);

	useEffect(() => {
		applyTheme(theme);
		window.localStorage.setItem(STORAGE_KEY, theme);
	}, [theme]);

	const toggleTheme = useCallback(() => {
		setTheme(current => (current === "dark" ? "light" : "dark"));
	}, []);

	return { theme, toggleTheme, setTheme };
}

export function bootstrapTheme(): Theme {
	const theme = getInitialTheme();
	applyTheme(theme);
	return theme;
}
