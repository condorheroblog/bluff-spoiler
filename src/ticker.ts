/**
 * A single shared requestAnimationFrame loop for every spoiler on the page.
 *
 * One rAF callback driving dozens of components is dramatically cheaper than
 * one loop per component, and it keeps frame timing consistent.
 */

export interface TickTarget {
	/**
	 * Called once per animation frame while registered.
	 * @param deltaSeconds elapsed time since the previous frame (clamped)
	 * @param now current time from the rAF timestamp
	 */
	tick: (deltaSeconds: number, now: number) => void
}

const MAX_FRAME_DELTA = 0.05;

class SharedTicker {
	#targets = new Set<TickTarget>();
	#frameId: number | null = null;
	#lastTime: number | null = null;

	add(target: TickTarget): void {
		this.#targets.add(target);
		this.#start();
	}

	remove(target: TickTarget): void {
		this.#targets.delete(target);
		if (this.#targets.size === 0)
			this.#stop();
	}

	get size(): number {
		return this.#targets.size;
	}

	#start(): void {
		if (this.#frameId !== null)
			return;
		this.#lastTime = null;
		this.#frameId = requestAnimationFrame(this.#loop);
	}

	#stop(): void {
		if (this.#frameId !== null) {
			cancelAnimationFrame(this.#frameId);
			this.#frameId = null;
		}
		this.#lastTime = null;
	}

	#loop = (now: number): void => {
		const last = this.#lastTime ?? now;
		// Clamp long gaps (background tabs, breakpointed debuggers) so that
		// particles do not teleport across the overlay on resume.
		const delta = Math.min((now - last) / 1000, MAX_FRAME_DELTA);
		this.#lastTime = now;

		for (const target of this.#targets) {
			target.tick(delta, now);
		}

		if (this.#targets.size > 0)
			this.#frameId = requestAnimationFrame(this.#loop);
		else
			this.#frameId = null;
	};
}

export const ticker = new SharedTicker();
