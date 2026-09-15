import type {
	BluffSpoilerStateDetail,
	BluffSpoilerToggleDetail,
	ParticleMotion,
	ParticleShape,
} from "bluff-spoiler";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import "bluff-spoiler";

export interface BluffSpoilerProps {
	children: ReactNode
	particleColor?: string
	particleSize?: number
	particleDensity?: number
	particleCount?: number | null
	particleBloom?: boolean
	particleOpacity?: number
	particleSpeed?: number
	particleJitter?: number
	particleShape?: ParticleShape
	particleMotion?: ParticleMotion
	particleTransition?: number
	particleFade?: number
	revealed?: boolean
	className?: string
	/** Emitted before the state changes; call event.preventDefault() to cancel. */
	onToggle?: (detail: BluffSpoilerToggleDetail, event: CustomEvent<BluffSpoilerToggleDetail>) => void
	onReveal?: (detail: BluffSpoilerStateDetail) => void
	onHide?: (detail: BluffSpoilerStateDetail) => void
}

type BluffSpoilerElement = HTMLElement & {
	revealed: boolean
	particleColor: string
	particleSize: number
	particleDensity: number
	particleCount: number | null
	particleBloom: boolean
	particleOpacity: number
	particleSpeed: number
	particleJitter: number
	particleShape: ParticleShape
	particleMotion: ParticleMotion
	particleTransition: number
	particleFade: number
};

/**
 * Thin typed React wrapper around the <bluff-spoiler> custom element.
 * Attributes/properties are synced imperatively so every React 19 custom
 * element quirk (boolean attrs, null count) behaves deterministically.
 */
export function BluffSpoiler({
	children,
	particleColor,
	particleSize,
	particleDensity,
	particleCount,
	particleBloom,
	particleOpacity,
	particleSpeed,
	particleJitter,
	particleShape,
	particleMotion,
	particleTransition,
	particleFade,
	revealed,
	className,
	onToggle,
	onReveal,
	onHide,
}: BluffSpoilerProps) {
	const ref = useRef<BluffSpoilerElement | null>(null);

	useEffect(() => {
		const element = ref.current;
		if (!element)
			return;

		if (particleColor !== undefined)
			element.setAttribute("particle-color", particleColor);
		if (particleSize !== undefined)
			element.setAttribute("particle-size", String(particleSize));
		if (particleDensity !== undefined)
			element.setAttribute("particle-density", String(particleDensity));
		if (particleOpacity !== undefined)
			element.setAttribute("particle-opacity", String(particleOpacity));
		if (particleSpeed !== undefined)
			element.setAttribute("particle-speed", String(particleSpeed));
		if (particleJitter !== undefined)
			element.setAttribute("particle-jitter", String(particleJitter));
		if (particleShape !== undefined)
			element.setAttribute("particle-shape", particleShape);
		if (particleMotion !== undefined)
			element.setAttribute("particle-motion", particleMotion);
		if (particleTransition !== undefined)
			element.setAttribute("particle-transition", String(particleTransition));
		if (particleFade !== undefined)
			element.setAttribute("particle-fade", String(particleFade));

		if (particleCount === undefined || particleCount === null)
			element.removeAttribute("particle-count");
		else
			element.setAttribute("particle-count", String(particleCount));

		element.toggleAttribute("particle-bloom", Boolean(particleBloom));
	}, [
		particleColor,
		particleSize,
		particleDensity,
		particleCount,
		particleBloom,
		particleOpacity,
		particleSpeed,
		particleJitter,
		particleShape,
		particleMotion,
		particleTransition,
		particleFade,
	]);

	useEffect(() => {
		const element = ref.current;
		if (!element || revealed === undefined)
			return;
		if (element.revealed !== revealed)
			element.revealed = revealed;
	}, [revealed]);

	useEffect(() => {
		const element = ref.current;
		if (!element)
			return;
		const handleToggle = (event: Event) => {
			const customEvent = event as CustomEvent<BluffSpoilerToggleDetail>;
			onToggle?.(customEvent.detail, customEvent);
		};
		const handleReveal = (event: Event) => {
			onReveal?.((event as CustomEvent<BluffSpoilerStateDetail>).detail);
		};
		const handleHide = (event: Event) => {
			onHide?.((event as CustomEvent<BluffSpoilerStateDetail>).detail);
		};
		element.addEventListener("toggle", handleToggle);
		element.addEventListener("reveal", handleReveal);
		element.addEventListener("hide", handleHide);
		return () => {
			element.removeEventListener("toggle", handleToggle);
			element.removeEventListener("reveal", handleReveal);
			element.removeEventListener("hide", handleHide);
		};
	}, [onToggle, onReveal, onHide]);

	return (
		<bluff-spoiler
			ref={(node) => {
				ref.current = node as BluffSpoilerElement | null;
			}}
			className={className}
		>
			{children}
		</bluff-spoiler>
	);
}
