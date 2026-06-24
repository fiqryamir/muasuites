<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Field, FieldLabel } from '$lib/components/ui/field';

	let { data } = $props();

	let submitting = $state(false);
	let submitted = $state(false);
	let selectedFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			selectedFile = input.files[0];
			previewUrl = URL.createObjectURL(input.files[0]);
		}
	}

	function fmtCurrency(a: number | string) {
		return `RM ${Number(a).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
	}

	function fmtDate(d: string) {
		return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function fmtTime(t: string) {
		if (!t) return '';
		const [h, m] = t.split(':');
		const hr = parseInt(h);
		const sfx = hr >= 12 ? 'PM' : 'AM';
		const dh = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
		return `${dh}:${m} ${sfx}`;
	}
</script>

<svelte:head>
	<title>Balance Payment — MUASuites</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-8">
	{#if submitted}
		<!-- Success state -->
		<div class="w-full space-y-6 text-center animate-in-up">
			<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl dark:bg-green-900/30">
				✅
			</div>
			<div class="space-y-2">
				<h1 class="text-xl font-semibold tracking-tight">Balance paid!</h1>
				<p class="text-sm text-muted-foreground">
					Your balance payment has been submitted successfully. The MUA will review and confirm shortly.
				</p>
			</div>
			{#if data.booking}
				{@const b = data.booking}
				<div class="rounded-xl bg-card ring-1 ring-foreground/10 p-4 text-left space-y-2">
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Service</span>
						<span class="font-medium">{b.packageEmoji} {b.packageName}</span>
					</div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Event date</span>
						<span class="font-medium">{fmtDate(b.eventDate)}</span>
					</div>
					<div class="bg-border h-px w-full"></div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Amount paid</span>
						<span class="font-semibold tabular-nums">{fmtCurrency(b.balanceAmount)}</span>
					</div>
				</div>
			{/if}
		</div>
	{:else if data.status === 'already_paid'}
		<!-- Already paid state -->
		<div class="w-full space-y-6 text-center animate-in-up">
			<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl dark:bg-green-900/30">
				✅
			</div>
			<div class="space-y-2">
				<h1 class="text-xl font-semibold tracking-tight">Already fully paid</h1>
				<p class="text-sm text-muted-foreground">
					This booking for {data.clientName || 'the client'} has already been fully settled. No further payment is needed.
				</p>
			</div>
		</div>
	{:else if data.booking}
		{@const b = data.booking}

		{@const todayStr = new Date().toISOString().split('T')[0]}
		{@const isOverdue = b.balanceDueDate ? b.balanceDueDate < todayStr : false}
		{@const overdueDays = isOverdue && b.balanceDueDate
			? Math.ceil((Date.now() - new Date(b.balanceDueDate + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24))
			: 0}

		<div class="w-full space-y-6 animate-in-up">
			<!-- Header -->
			<div class="text-center space-y-1">
				<h1 class="text-lg font-semibold tracking-tight">Balance payment</h1>
				<p class="text-sm text-muted-foreground">{b.studioName || 'Studio'}</p>
			</div>

			{#if isOverdue}
				<!-- Overdue banner -->
				<div class="rounded-xl bg-orange-100 dark:bg-orange-900/30 p-4 text-center space-y-1 ring-1 ring-orange-300 dark:ring-orange-700">
					<p class="text-sm font-medium text-orange-800 dark:text-orange-300">
						⚠️ Balance payment {overdueDays > 0 ? `${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue` : 'due today'}
					</p>
					<p class="text-xs text-orange-700 dark:text-orange-400">
						Please complete the payment as soon as possible to confirm your booking.
					</p>
				</div>
			{/if}

			<!-- Booking summary card -->
			<div class="rounded-xl bg-card ring-1 ring-foreground/10 p-4 space-y-3">
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Service</span>
					<span class="font-medium">{b.packageEmoji} {b.packageName}</span>
				</div>
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Event date</span>
					<span class="font-medium">{fmtDate(b.eventDate)}</span>
				</div>
				{#if b.eventTime}
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Ready time</span>
						<span class="font-medium">{fmtTime(b.eventTime)}</span>
					</div>
				{/if}

				<div class="bg-border h-px w-full"></div>

				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Total</span>
					<span class="font-semibold tabular-nums">{fmtCurrency(b.totalAmount)}</span>
				</div>
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Deposit paid</span>
					<span class="font-medium tabular-nums text-green-600 dark:text-green-400">{fmtCurrency(b.depositAmount)}</span>
				</div>
				<div class="flex items-center justify-between text-sm font-semibold">
					<span class="text-foreground">Balance due</span>
					<span class="tabular-nums">{fmtCurrency(b.balanceAmount)}</span>
				</div>
			</div>

			<!-- QR Code -->
			{#if b.duitnowQrUrl}
				<div class="rounded-xl bg-card ring-1 ring-foreground/10 p-4 text-center space-y-3">
					<p class="text-xs font-medium text-muted-foreground">Scan to pay the balance</p>
					<img
						src={b.duitnowQrUrl}
						alt="DuitNow QR Code"
						class="mx-auto h-48 w-48 rounded-lg object-contain"
					/>
					<p class="text-xs text-muted-foreground">{fmtCurrency(b.balanceAmount)}</p>
				</div>
			{/if}

			<!-- Receipt upload form -->
			<form
				method="POST"
				enctype="multipart/form-data"
				use:enhance={() => {
					submitting = true;
					return async ({ result }) => {
						submitting = false;
						if (result.type === 'success') {
							submitted = true;
						}
					};
				}}
				class="rounded-xl bg-card ring-1 ring-foreground/10 p-4 space-y-4"
			>
				<div class="space-y-2">
					<p class="text-xs font-medium text-muted-foreground">Upload payment receipt</p>
					<p class="text-xs text-muted-foreground">After transferring, take a screenshot and upload it here.</p>
				</div>

				<Field class="gap-2">
					<label
						for="receipt"
						class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:bg-muted/50"
					>
						{#if previewUrl}
							<img src={previewUrl} alt="Receipt preview" class="max-h-40 rounded-lg object-contain" />
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-2 text-muted-foreground"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
							<span class="text-xs text-muted-foreground">Tap to choose receipt image</span>
						{/if}
					</label>
					<input
						id="receipt"
						name="receipt"
						type="file"
						accept="image/jpeg,image/png,image/webp"
						class="sr-only"
						onchange={handleFileChange}
						required
					/>
				</Field>

				<Button type="submit" class="w-full" disabled={submitting || !selectedFile}>
					{submitting ? 'Submitting…' : 'Submit receipt'}
				</Button>
			</form>

			<!-- Footer -->
			<p class="text-center text-xs text-muted-foreground">
				Powered by MUASuites
			</p>
		</div>
	{/if}
</div>