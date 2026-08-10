<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Field, FieldLabel } from '$lib/components/ui/field';

	let {
		chatId = $bindable(''),
		testTelegram
	}: { chatId?: string; testTelegram: () => Promise<void> } = $props();

	let testing = $state(false);

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
	<div class="flex gap-2">
		<Input
			id="telegram"
			bind:value={chatId}
			placeholder="Enter your Chat ID"
			class="flex-1 rounded-full bg-muted border-none px-4"
		/>
		<Button
			type="button"
			variant="outline"
			disabled={testing || !chatId}
			onclick={handleTest}
			class="rounded-full shrink-0"
		>
			{testing ? 'Sending...' : 'Test'}
		</Button>
	</div>
	<p class="px-2 text-xs text-muted-foreground">
		Send a message to <span class="font-medium text-foreground">@userinfobot</span> to get your ID.
	</p>
</Field>
