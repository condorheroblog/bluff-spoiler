import type { Plugin } from "vite";
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

// @zh 仅压缩 IIFE 浏览器直连产物；ES/CJS 产物保持可读，便于调试。
// @en Minify only the IIFE browser-ready output; keep ES/CJS outputs readable.
function minifyIifeOnly(): Plugin {
	return {
		name: "minify-iife-only",
		outputOptions(options) {
			return {
				...options,
				minify: options.format === "iife",
			};
		},
	};
}

export default defineConfig({
	build: {
		emptyOutDir: true,
		minify: false,
		sourcemap: true,

		lib: {
			// @zh 单入口：零依赖的 Web Components 自定义元素。
			// @en Single entry: the dependency-free Web Components custom element.
			entry: {
				index: "src/index.ts",
			},
			name: "BluffSpoiler",
			formats: ["es", "cjs", "iife"],
			fileName: (format, entryName = "index") => {
				if (format === "es")
					return `${entryName}.mjs`;
				if (format === "cjs")
					return `${entryName}.cjs`;
				if (format === "iife")
					return `${entryName}.iife.js`;
				return `${entryName}.${format}`;
			},
		},
		rolldownOptions: {
			output: {
				postBanner: banner,
			},
		},
	},
	plugins: [
		minifyIifeOnly(),
		dts({
			bundleTypes: true,
			afterBuild: () => {
				copyDtsFiles(fileURLToPath(new URL("./dist", import.meta.url)));
			},
		}),
	],
});
