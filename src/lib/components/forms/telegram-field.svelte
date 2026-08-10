<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Field, FieldLabel } from '$lib/components/ui/field';
	import { toast } from 'svelte-sonner';

	let {
		chatId = $bindable(''),
		testTelegram
	}: { chatId?: string; testTelegram: () => Promise<void> } = $props();

	const connected = $derived(Boolean(chatId));

	let connecting = $state(false);
	let advanced = $state(false);
	let testing = $state(false);
	let pendingUrl = $state('');
	let pollTimer: ReturnType<typeof setInterval> | undefined;
	let pollCount = 0;

	function stopPolling() {
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = undefined;
		}
	}

	$effect(() => {
		return () => stopPolling();
	});

	async function startConnect() {
		try {
			const res = await fetch('/api/telegram/connect', { method: 'POST' });
			const data = await res.json();

			if (!data.success) {
				toast.error(data.error || 'Could not start the Telegram connection.');
				return;
			}

			pendingUrl = data.url;
			window.open(pendingUrl, '_blank');
			connecting = true;
			pollCount = 0;
			stopPolling();
			pollTimer = setInterval(checkStatus, 3000);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Could not start the Telegram connection.');
		}
	}

	async function checkStatus(manual = false) {
		if (!manual) pollCount += 1;

		try {
			const res = await fetch('/api/telegram/status');
			const data = await res.json();

			if (data.success && data.connected) {
				chatId = data.chatId || chatId;
				stopPolling();
				connecting = false;
				toast.success("Telegram connected — you'll get alerts here.");
				return;
			}
		} catch {
			// Transient network error — keep polling.
		}

		if (pollCount >= 15) {
			stopPolling();
			connecting = false;
			toast.warning('Still waiting — open Telegram, press Start, then press "Check again".');
		}
	}

	function cancelConnect() {
		stopPolling();
		connecting = false;
		pendingUrl = '';
	}

	function reopenTelegram() {
		if (pendingUrl) window.open(pendingUrl, '_blank');
	}

	async function handleTest() {
		testing = true;
		try {
			await testTelegram();
		} finally {
			testing = false;
		}
	}
</script>

<Field class="gap-2">
	<FieldLabel>Telegram notifications</FieldLabel>

	{#if connected}
		<div class="border-border bg-muted/40 flex items-center gap-3 rounded-full border px-4 py-2">
			<svg
				class="text-primary h-4 w-4 shrink-0"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg
			>
			<p class="text-sm font-medium">Connected — alerts go straight to your Telegram</p>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<Button
				type="button"
				variant="outline"
				class="rounded-full"
				disabled={testing}
				onclick={handleTest}
			>
				{testing ? 'Sending...' : 'Test'}
			</Button>
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
				onclick={() => (advanced = !advanced)}
			>
				Use a Chat ID manually (for groups)
			</button>
		</div>
	{:else if connecting}
		<div class="border-border bg-muted/30 space-y-3 rounded-2xl border p-4">
			<div class="flex items-center gap-2 text-sm">
				<svg
					class="text-muted-foreground h-4 w-4 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<span>Waiting for you to press Start in Telegram…</span>
			</div>
			<div class="flex flex-wrap gap-2">
				<Button type="button" variant="outline" class="rounded-full" onclick={reopenTelegram}>
					Open Telegram again
				</Button>
				<Button
					type="button"
					variant="outline"
					class="rounded-full"
					onclick={() => checkStatus(true)}
				>
					Check again
				</Button>
				<Button type="button" variant="ghost" class="rounded-full" onclick={cancelConnect}>
					Cancel
				</Button>
			</div>
		</div>
	{:else}
		<Button type="button" class="w-full rounded-full" onclick={startConnect}>
			Connect Telegram
		</Button>
	{/if}

	{#if advanced}
		<div class="flex gap-2 pt-1">
			<Input
				id="telegram"
				bind:value={chatId}
				placeholder="Enter your Chat ID"
				class="bg-muted flex-1 rounded-full border-none px-4"
			/>
			<Button
				type="button"
				variant="outline"
				class="shrink-0 rounded-full"
				disabled={testing || !chatId}
				onclick={handleTest}
			>
				{testing ? 'Sending...' : 'Test'}
			</Button>
		</div>
	{/if}

	<p class="text-muted-foreground px-2 text-xs">
		{#if connected}
			One tap connects your Telegram — group chats can use the manual option.
		{:else}
			One tap connects your Telegram and you'll get an instant message whenever a client books or
			pays — no codes to copy.
		{/if}
	</p>
</Field>
