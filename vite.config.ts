import type { Plugin } from "vite";
import { readFileSync } from "node:fs";
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
			outDirs: [
				{ dir: "dist", moduleFormat: "esm" },
				{ dir: "dist", moduleFormat: "cjs" },
			],
		}),
	],
});
