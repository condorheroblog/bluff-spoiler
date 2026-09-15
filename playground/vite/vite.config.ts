import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @zh Vite 演示应用配置。
 * 仅负责把 React + React Router 应用打包为静态站点，与根目录库构建无关。
 * @en Vite demo app config.
 * Only bundles the React + React Router app into a static site; unrelated to
 * the root library build.
 */
export default defineConfig({
	plugins: [
		codeInspectorPlugin({ bundler: "vite" }),
		react(),
		tailwindcss(),
	],
	base: "/bluff-spoiler/",
	resolve: {
		alias: {
			// @zh 将包名映射到本地源码，避免演示项目依赖已构建产物。
			// @en Map the package names to local source so the demo does not depend on built artifacts.
			"bluff-spoiler": path.resolve(__dirname, "../../src"),
		},
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
});
