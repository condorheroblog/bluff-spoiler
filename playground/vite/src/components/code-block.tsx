import type { ReactNode } from "react";
import { useState } from "react";

export interface CodeBlockProps {
	code: string
	label?: ReactNode
	language?: string
}

export function CodeBlock({ code, label, language = "html" }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			window.setTimeout(setCopied, 1500, false);
		}
		catch {
			// clipboard may be unavailable on insecure origins
		}
	};

	return (
		<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0d141b]">
			<div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-800">
				<span className="font-mono text-xs text-slate-400">{label ?? language}</span>
				<button
					type="button"
					onClick={() => void copy()}
					className="cursor-pointer rounded-md px-2 py-1 font-mono text-xs text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
				>
					{copied ? "✓" : "copy"}
				</button>
			</div>
			<pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
				<code>{code}</code>
			</pre>
		</div>
	);
}
