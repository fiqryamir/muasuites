<script lang="ts">
	import { onMount } from 'svelte';
	import { animate } from 'motion';
	import ChatMockup from './mockups/ChatMockup.svelte';
	import CheckoutMockup from './mockups/CheckoutMockup.svelte';
	import TelegramMockup from './mockups/TelegramMockup.svelte';
	import CalendarMockup from './mockups/CalendarMockup.svelte';
	import IphoneFrame from './IphoneFrame.svelte';

	const frames = [
		{ label: 'The chat', component: ChatMockup },
		{ label: 'The checkout', component: CheckoutMockup },
		{ label: 'The approval', component: TelegramMockup },
		{ label: 'The calendar', component: CalendarMockup }
	];

	let active = $state(0);
	let reducedMotion = $state(false);

	// Swipe state
	let pointerId: number | null = null;
	let startX = 0;
	let currentX = 0;
	let dragging = $state(false);
	let dragOffset = $state(0);
	const positionHistory: { x: number; t: number }[] = [];

	// Phone dimensions (matches the shell width)
	const PHONE_W = 300;
	const PHONE_W_SM = 340;
	// .iphone-screen has left:3.4% + right:3.4% = 6.8% inset, so visible width = 93.2%
	const SCREEN_RATIO = 1 - 2 * 0.034;
	let phoneWidth = $state(PHONE_W);
	let screenWidth = $state(PHONE_W * SCREEN_RATIO);

	function getPhoneWidth() {
		return window.matchMedia('(min-width: 640px)').matches ? PHONE_W_SM : PHONE_W;
	}

	function handlePointerDown(e: PointerEvent) {
		if (reducedMotion) return;
		const target = e.currentTarget as HTMLElement;
		target.setPointerCapture(e.pointerId);
		pointerId = e.pointerId;
		startX = e.clientX;
		currentX = e.clientX;
		dragging = true;
		dragOffset = 0;
		positionHistory.length = 0;
		positionHistory.push({ x: e.clientX, t: performance.now() });
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragging || e.pointerId !== pointerId) return;
		currentX = e.clientX;
		dragOffset = currentX - startX;
		positionHistory.push({ x: e.clientX, t: performance.now() });
		if (positionHistory.length > 5) positionHistory.shift();
	}

	function handlePointerUp(e: PointerEvent) {
		if (!dragging || e.pointerId !== pointerId) return;
		dragging = false;
		pointerId = null;

		// Calculate velocity from recent points
		let velocity = 0;
		if (positionHistory.length >= 2) {
			const last = positionHistory[positionHistory.length - 1];
			const first = positionHistory[0];
			const dt = (last.t - first.t) / 1000;
			if (dt > 0) velocity = (last.x - first.x) / dt;
		}

		phoneWidth = getPhoneWidth();
		screenWidth = phoneWidth * SCREEN_RATIO;
		const threshold = screenWidth * 0.2;
		const velocityThreshold = 300; // px/s

		let nextActive = active;
		if (Math.abs(dragOffset) > threshold || Math.abs(velocity) > velocityThreshold) {
			if (dragOffset < 0 || velocity < -velocityThreshold) {
				nextActive = Math.min(active + 1, frames.length - 1);
			} else {
				nextActive = Math.max(active - 1, 0);
			}
		}

		go(nextActive);
	}

	function go(index: number) {
		if (index === active) {
			// Snap back
			dragOffset = 0;
			return;
		}
		active = index;
		dragOffset = 0;
	}

	let frameContainerEl = $state<HTMLDivElement>();

	$effect(() => {
		// Animate frame container when active changes (only on non-drag updates)
		if (!frameContainerEl || dragging) return;
		const targetX = -active * screenWidth;
		animate(
			frameContainerEl,
			{
				transform: [
					`translateX(${frameContainerEl.style.transform?.match(/-?\d+(\.\d+)?/)?.[0] || targetX}px)`,
					`translateX(${targetX}px)`
				]
			},
			{ type: 'spring', bounce: 0.2, duration: 0.3 }
		);
	});

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		phoneWidth = getPhoneWidth();
		screenWidth = phoneWidth * SCREEN_RATIO;

		// Set initial position
		if (frameContainerEl) {
			frameContainerEl.style.transform = `translateX(0px)`;
		}
	});
</script>

<div>
	<IphoneFrame>
		<div
			class="bg-background relative h-full"
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerUp}
			role="presentation"
		>
			<div
				bind:this={frameContainerEl}
				class="flex h-full will-change-transform"
				style="width: {frames.length * 100}%; transform: translateX(0px);"
			>
				{#each frames as frame, i (frame.label)}
					<div
						class="h-full shrink-0"
						style="width: {100 / frames.length}%;"
						aria-hidden={i !== active}
					>
						<frame.component />
					</div>
				{/each}
			</div>
		</div>
	</IphoneFrame>

	<!-- Frame captions -->
	<div class="mt-5 flex items-center justify-center gap-1">
		{#each frames as frame, i (frame.label)}
			<button
				type="button"
				onclick={() => go(i)}
				aria-label="Show {frame.label}"
				class="flex min-h-11 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-colors {i ===
				active
					? 'text-foreground font-medium'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<span class="h-1.5 w-1.5 rounded-full {i === active ? 'bg-primary' : 'bg-border'}"></span>
				{frame.label}
			</button>
		{/each}
	</div>
</div>
