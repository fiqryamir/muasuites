<!-- Frame 3 of the hero sequence: the Telegram notification with inline approve/decline. -->
<div class="flex h-full flex-col bg-[#eef3f8]">
	<!-- Telegram header -->
	<div class="flex items-center gap-3 bg-[#5a8fbf] px-4 py-3 text-white">
		<div
			class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold"
		>
			M
		</div>
		<div class="min-w-0">
			<p class="truncate text-[13px] font-medium">MUAsuites bot</p>
			<p class="text-[11px] text-white/80">online</p>
		</div>
	</div>

	<div class="space-y-2.5 px-3.5 py-4">
		<!-- Notification bubble -->
		<div class="max-w-[92%] rounded-2xl rounded-tl-md bg-white p-3.5 shadow-sm">
			<p class="text-[13px] font-semibold">New booking — payment pending review</p>

			<div class="mt-2.5 space-y-1 text-[12px] leading-snug">
				<p><span class="text-muted-foreground">Client — </span>Sarah · wa.me/60123456789</p>
				<p><span class="text-muted-foreground">Event — </span>15 Mar · 8:00 am</p>
				<p><span class="text-muted-foreground">Venue — </span>Grand Hyatt KL</p>
			</div>

			<div class="border-border/60 mt-2.5 space-y-1 border-t pt-2 text-[12px]">
				<div class="flex justify-between">
					<span class="text-muted-foreground">Total</span>
					<span class="font-medium">RM 988.00</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Deposit paid</span>
					<span class="font-medium">RM 469.00</span>
				</div>
			</div>

			<p class="mt-2 text-[12px] font-medium text-[#2aabee]">View receipt</p>

			<!-- Inline action buttons -->
			<div class="mt-2.5 grid grid-cols-2 gap-1.5">
				<div
					class="rounded-lg bg-[#2aabee]/10 py-1.5 text-center text-[12px] font-medium text-[#2aabee]"
				>
					Approve
				</div>
				<div
					class="rounded-lg bg-[#2aabee]/10 py-1.5 text-center text-[12px] font-medium text-[#2aabee]"
				>
					Decline
				</div>
			</div>
			<p class="text-muted-foreground mt-1.5 text-right text-[10px]">now</p>
		</div>

		<!-- Follow-up confirmation -->
		<div class="max-w-[85%] rounded-2xl rounded-tl-md bg-white p-3 shadow-sm">
			<p class="text-[12px] leading-snug">
				<span class="font-semibold">Booking confirmed.</span> 15 Mar is now blocked, and the event file
				is ready for your calendar.
			</p>
			<p class="text-muted-foreground mt-1 text-right text-[10px]">now</p>
		</div>
	</div>
</div>
