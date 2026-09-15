export interface LogoProps {
	size?: number
	className?: string
}

export function Logo({ size = 32, className }: LogoProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 64 64"
			width={size}
			height={size}
			className={className}
			role="img"
			aria-label="bluff-spoiler logo"
		>
			<title>bluff-spoiler</title>
			<defs>
				<radialGradient id="logo-glow" cx="50%" cy="50%" r="60%">
					<stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
					<stop offset="100%" stopColor="#1fa669" stopOpacity="0" />
				</radialGradient>
				<linearGradient id="logo-bar" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#16202b" />
					<stop offset="100%" stopColor="#0d141b" />
				</linearGradient>
			</defs>
			<rect x="4" y="12" width="56" height="40" rx="9" fill="url(#logo-bar)" />
			<rect
				x="4"
				y="12"
				width="56"
				height="40"
				rx="9"
				fill="none"
				stroke="#1fa669"
				strokeOpacity="0.45"
				strokeWidth="1.5"
			/>
			<circle cx="32" cy="32" r="15" fill="url(#logo-glow)" />
			<circle cx="18" cy="26" r="2.4" fill="#34d399" />
			<circle cx="28" cy="22" r="1.7" fill="#6ee7b7" fillOpacity="0.85" />
			<circle cx="40" cy="25" r="2.1" fill="#34d399" fillOpacity="0.9" />
			<circle cx="47" cy="33" r="1.6" fill="#a7f3d0" fillOpacity="0.8" />
			<circle cx="38" cy="41" r="2.3" fill="#34d399" />
			<circle cx="24" cy="40" r="1.8" fill="#6ee7b7" fillOpacity="0.8" />
			<circle cx="15" cy="36" r="1.5" fill="#a7f3d0" fillOpacity="0.75" />
			<rect x="29.4" y="29.4" width="5.2" height="5.2" rx="0.8" transform="rotate(45 32 32)" fill="#ecfdf5" />
		</svg>
	);
}
