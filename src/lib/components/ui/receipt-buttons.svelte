<script lang="ts">
	/**
	 * Smart receipt button component.
	 * Shows a single button if only one receipt exists.
	 * Shows a Popover menu with both choices if both deposit and balance receipts exist.
	 */
	import * as Popover from '$lib/components/ui/popover';

	let {
		depositReceiptUrl,
		balanceReceiptUrl
	}: {
		depositReceiptUrl?: string | null;
		balanceReceiptUrl?: string | null;
	} = $props();

	const hasDeposit = $derived(!!depositReceiptUrl);
	const hasBalance = $derived(!!balanceReceiptUrl);
	const hasBoth = $derived(hasDeposit && hasBalance);
	const hasAny = $derived(hasDeposit || hasBalance);
</script>

{#if hasAny}
	{#if hasBoth}
		<!-- Both receipts: show popover menu -->
		<Popover.Root>
			<Popover.Trigger class="border-border text-muted-foreground hover:bg-muted inline-flex flex-1 items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-medium transition-colors">
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
				Receipt
			</Popover.Trigger>
			<Popover.Content align="start" class="w-56 p-1.5">
				<a
					href={depositReceiptUrl}
					target="_blank"
					class="flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
					Deposit receipt
				</a>
				<a
					href={balanceReceiptUrl}
					target="_blank"
					class="flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
					Balance receipt
				</a>
			</Popover.Content>
		</Popover.Root>
	{:else}
		<!-- Single receipt: direct link -->
		<a
			href={depositReceiptUrl || balanceReceiptUrl}
			target="_blank"
			class="border-border text-muted-foreground hover:bg-muted inline-flex flex-1 items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-medium transition-colors"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
			{hasBalance ? 'Balance receipt' : 'Receipt'}
		</a>
	{/if}
{/if}