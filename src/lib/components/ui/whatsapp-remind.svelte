<script lang="ts">
	/**
	 * Smart WhatsApp button.
	 * FULLY_PAID → plain WhatsApp chat link.
	 * CONFIRMED + not overdue → single direct "Share balance link" button.
	 * CONFIRMED + overdue → popover with "Remind client" and "Share balance link".
	 */
	import * as Popover from '$lib/components/ui/popover';

	let {
		clientPhone,
		clientName,
		bookingStatus,
		balanceAmount,
		balanceToken,
		eventDate,
		isOverdue = false,
		overdueDays = 0
	}: {
		clientPhone?: string | null;
		clientName?: string | null;
		bookingStatus?: string | null;
		balanceAmount?: number | null;
		balanceToken?: string | null;
		eventDate?: string | null;
		isOverdue?: boolean;
		overdueDays?: number;
	} = $props();

	function fmtCurrency(a: number | string | null | undefined) {
		const num = Number(a);
		if (isNaN(num)) return '';
		return `RM ${num.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
	}

	function fmtDate(d: string | null | undefined) {
		if (!d) return '';
		return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function cleanPhone(phone: string) {
		return phone.replace?.(/^0/, '60') || phone;
	}

	const phoneNumber = $derived(clientPhone ? cleanPhone(clientPhone) : '');

	const balanceLink = $derived(
		balanceToken ? `${window.location.origin}/pay/balance/${balanceToken}` : ''
	);

	const shareLinkMessage = $derived(
		`Hi ${clientName || 'there'}, here's your link to complete your balance payment:\n\n${balanceLink}`
	);

	const remindMessage = $derived(
		`Hi ${clientName || 'there'}, just a gentle reminder — your balance of ${fmtCurrency(balanceAmount)} for ${fmtDate(eventDate)} is overdue. Please complete it here:\n\n${balanceLink}`
	);

	const isFullyPaid = $derived(bookingStatus === 'FULLY_PAID');
	const isConfirmedWithBalance = $derived(bookingStatus === 'CONFIRMED' && !!balanceAmount && !!balanceLink);
	const hasPhone = $derived(!!phoneNumber);
</script>

{#if hasPhone}
	{#if isFullyPaid}
		<!-- Fully paid: plain WhatsApp chat -->
		<a
			href={`https://wa.me/${phoneNumber}`}
			target="_blank"
			class="border-border text-muted-foreground hover:bg-muted inline-flex flex-1 items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-medium transition-colors"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
			WhatsApp
		</a>
	{:else if isConfirmedWithBalance && isOverdue}
		<!-- Overdue: popover with two options -->
		<Popover.Root>
			<Popover.Trigger class="border-border text-muted-foreground hover:bg-muted inline-flex flex-1 items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-medium transition-colors">
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
				WhatsApp
			</Popover.Trigger>
			<Popover.Content align="start" class="w-56 p-1.5">
				<a
					href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(remindMessage)}`}
					target="_blank"
					class="flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
					Remind client
				</a>
				<a
					href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(shareLinkMessage)}`}
					target="_blank"
					class="flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
					Share balance link
				</a>
			</Popover.Content>
		</Popover.Root>
	{:else if isConfirmedWithBalance}
		<!-- Confirmed, not overdue: single share balance link -->
		<a
			href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(shareLinkMessage)}`}
			target="_blank"
			class="border-border text-muted-foreground hover:bg-muted inline-flex flex-1 items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-medium transition-colors"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
			Share balance link
		</a>
	{:else}
		<!-- Other statuses: plain WhatsApp chat -->
		<a
			href={`https://wa.me/${phoneNumber}`}
			target="_blank"
			class="border-border text-muted-foreground hover:bg-muted inline-flex flex-1 items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-medium transition-colors"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
			WhatsApp
		</a>
	{/if}
{/if}