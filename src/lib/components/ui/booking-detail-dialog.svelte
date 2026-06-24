<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { fmtDate, fmtCurrency } from '$lib/bookings-ui';

	let {
		open = $bindable(false),
		booking
	}: {
		open: boolean;
		booking: any;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-md rounded-xl">
		<Dialog.Header>
			<Dialog.Title>Payment details</Dialog.Title>
			<Dialog.Description>
				Breakdown for {booking.client_name || 'client'}
				{#if booking.event_date}
					· {fmtDate(booking.event_date)}
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-3">
			{#if booking.packages?.name}
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Package</span>
					<span class="font-medium">{booking.packages.emoji} {booking.packages.name}</span>
				</div>
			{/if}

			{#if booking.packages?.price}
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Base price</span>
					<span class="font-medium tabular-nums">{fmtCurrency(booking.packages.price)}</span>
				</div>
			{/if}

			{#if booking.invites?.transport_fee_override > 0}
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Transport fee</span>
					<span class="font-medium tabular-nums">{fmtCurrency(booking.invites.transport_fee_override)}</span>
				</div>
			{/if}

			{#if booking.invites?.custom_surcharge > 0}
				<div class="space-y-0.5">
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Extra surcharge</span>
						<span class="font-medium tabular-nums">{fmtCurrency(booking.invites.custom_surcharge)}</span>
					</div>
					{#if booking.invites.surcharge_remark}
						<p class="text-right text-xs text-muted-foreground">{booking.invites.surcharge_remark}</p>
					{/if}
				</div>
			{/if}

			<div class="bg-border h-px w-full"></div>

			<div class="flex items-center justify-between text-sm">
				<span class="text-muted-foreground">Total amount</span>
				<span class="font-bold tabular-nums">{fmtCurrency(booking.total_amount)}</span>
			</div>

			<div class="flex items-center justify-between text-sm">
				<span class="text-muted-foreground">Deposit paid</span>
				<span class="font-medium tabular-nums text-green-600 dark:text-green-400">{fmtCurrency(booking.deposit_amount)}</span>
			</div>

			{#if booking.balance_amount > 0}
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Balance remaining</span>
					<span class="font-medium tabular-nums">{fmtCurrency(booking.balance_amount)}</span>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Dialog.Close class="inline-flex items-center justify-center rounded-full bg-muted px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors">
				Close
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>