import { copyFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

const pkg = JSON.parse(
	readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8"),
);

const banner = `/**
 * Name: ${pkg.name}
 * Version: ${pkg.version}
 * Author: ${pkg.author?.name ?? pkg.author}
 * Homepage: ${pkg.homepage}
 * License ${pkg.license} © 2026-Present
 */
`;

function copyDtsFiles(dir: string): void {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			copyDtsFiles(fullPath);
			continue;
		}

		if (entry.name.endsWith(".d.mts")) {
			copyFileSync(fullPath, fullPath.replace(/\.d\.mts$/, ".d.cts"));
		}
		else if (entry.name.endsWith(".d.ts")) {
			const mtsPath = fullPath.replace(/\.d\.ts$/, ".d.mts");
			const ctsPath = fullPath.replace(/\.d\.ts$/, ".d.cts");
			if (!existsSync(mtsPath))
				copyFileSync(fullPath, mtsPath);
			if (!existsSync(ctsPath))
				copyFileSync(fullPath, ctsPath);
		}
	}
}

export default defineConfig({
	build: {
		emptyOutDir: true,
		minify: false,
		sourcemap: true,

		lib: {
			// @zh 单入口：React 适配层；无框架引擎由独立包 scroll-active-toc 提供（作为依赖外置）
			// @en Single entry: the React adapter; the framework-agnostic engine ships as the separate scroll-active-toc package (externalized as a dependency)
			entry: {
				index: "src/index.ts",
			},
			name: "bluff-spoiler",
			formats: ["es", "cjs"],
			fileName: (format, entryName = "index") => {
				if (format === "es")
					return `${entryName}.mjs`;
				if (format === "cjs")
					return `${entryName}.cjs`;
				return `${entryName}.${format}`;
			},
		},
		rolldownOptions: {
			// @zh 外置 react（含 jsx-runtime，Devtools.ts 的 automatic JSX 运行时）与引擎包 scroll-active-toc，
			// 它们均由包的依赖在运行时提供，不会被打进产物。
			// @en Externalize react (including jsx-runtime, the automatic JSX runtime used by Devtools.ts)
			// and the scroll-active-toc engine package; both are provided at runtime by package dependencies.
			external: [/^react(\/.*)?$/, /^scroll-active-toc(\/.*)?$/],
			output: {
				postBanner: banner,
			},
		},
	},
	plugins: [
		dts({
			bundleTypes: true,
			afterBuild: () => {
				copyDtsFiles(fileURLToPath(new URL("./dist", import.meta.url)));
			},
		}),
	],
});
