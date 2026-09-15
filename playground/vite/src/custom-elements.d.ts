import type { DetailedHTMLProps, HTMLAttributes } from "react";

type BluffSpoilerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
	"revealed"?: boolean
	"particle-color"?: string
	"particle-size"?: number | string
	"particle-density"?: number | string
	"particle-count"?: number | string
	"particle-bloom"?: boolean | string
	"particle-opacity"?: number | string
	"particle-speed"?: number | string
	"particle-jitter"?: number | string
	"particle-shape"?: "circle" | "square" | "triangle" | "diamond"
	"particle-motion"?: "up" | "down" | "cross" | "orbit"
	"particle-transition"?: number | string
	"particle-fade"?: number | string
};

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"bluff-spoiler": BluffSpoilerAttributes
		}
	}
}
