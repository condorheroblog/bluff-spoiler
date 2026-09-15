import { Route, Routes } from "react-router";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import { useTheme } from "./lib/use-theme";
import { HomePage } from "./pages/home-page";
import { NotFoundPage } from "./pages/not-found-page";
import { PlaygroundPage } from "./pages/playground-page";

export function App() {
	const { theme, toggleTheme } = useTheme();

	return (
		<div className="flex min-h-screen flex-col">
			<SiteHeader theme={theme} onToggleTheme={toggleTheme} />
			<main className="flex-1">
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/playground" element={<PlaygroundPage />} />
					<Route path="*" element={<NotFoundPage />} />
				</Routes>
			</main>
			<SiteFooter />
		</div>
	);
}
