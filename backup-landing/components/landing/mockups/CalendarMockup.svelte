<!-- Frame 4 of the hero sequence: the confirmed date in the MUA's native calendar. -->
<div class="flex h-full flex-col px-4 py-4">
	<div class="flex items-baseline justify-between">
		<p class="text-[15px] font-semibold tracking-tight">March 2026</p>
		<p class="text-muted-foreground text-[11px]">Calendar</p>
	</div>

	<!-- Mini month grid (March 2026 starts on a Sunday) -->
	<div class="text-muted-foreground mt-3 grid grid-cols-7 gap-y-1 text-center text-[10px]">
		<span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span
			>Sa</span
		>
	</div>
	<div class="mt-1 grid grid-cols-7 gap-y-1.5 text-center text-[11px]">
		{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31] as day (day)}
			{#if day === 15}
				<span class="relative mx-auto flex h-6 w-6 items-center justify-center">
					<span class="bg-primary absolute inset-0 rounded-full"></span>
					<span class="text-primary-foreground relative font-medium">{day}</span>
				</span>
			{:else}
				<span class="text-foreground/70 mx-auto flex h-6 w-6 items-center justify-center">
					{day}
				</span>
			{/if}
		{/each}
	</div>

	<!-- Event card -->
	<div class="ring-foreground/10 bg-card mt-4 rounded-xl p-3.5 ring-1">
		<div class="flex items-center gap-2">
			<span class="bg-primary h-2 w-2 rounded-full"></span>
			<p class="text-[13px] font-semibold">Bridal makeup — Sarah</p>
		</div>
		<div class="text-muted-foreground mt-1.5 space-y-0.5 text-[11px]">
			<p>Sun, 15 Mar · 8:00 am – 12:00 pm</p>
			<p>Grand Hyatt KL, Jalan Pinang</p>
			<p>Deposit RM 469.00 · Balance RM 519.00</p>
		</div>
	</div>

	<p class="text-muted-foreground mt-3 text-center text-[11px]">Added automatically on approval</p>
</div>
