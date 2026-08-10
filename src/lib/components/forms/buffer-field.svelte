<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { Field, FieldLabel } from '$lib/components/ui/field';

	let { value = $bindable('0') }: { value?: string } = $props();

	const bufferMinutes = $derived(parseInt(value, 10));
</script>

<Field class="gap-2">
	<FieldLabel>Travel buffer between sessions</FieldLabel>
	<Select.Root type="single" bind:value>
		<Select.Trigger
			id="buffer"
			class="flex h-10 w-full items-center justify-between rounded-full border-none bg-muted px-4 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring"
		>
			{bufferMinutes === 0 ? 'No buffer' : `${bufferMinutes} min`}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="0">No buffer</Select.Item>
			<Select.Item value="15">15 min</Select.Item>
			<Select.Item value="30">30 min</Select.Item>
			<Select.Item value="45">45 min</Select.Item>
			<Select.Item value="60">60 min</Select.Item>
		</Select.Content>
	</Select.Root>
	<p class="px-2 text-xs text-muted-foreground">
		Extra time reserved after each booking for travel. This blocks the slot so no other client can
		book too close.
	</p>
</Field>
