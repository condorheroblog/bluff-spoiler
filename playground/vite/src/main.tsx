import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import { App } from "./app";
import { bootstrapTheme } from "./lib/use-theme";
import "./i18n";
import "./styles/index.css";

bootstrapTheme();

const container = document.getElementById("root");
if (!container)
	throw new Error("Root container #root not found");

createRoot(container).render(
	<StrictMode>
		<HashRouter>
			<App />
		</HashRouter>
	</StrictMode>,
);
