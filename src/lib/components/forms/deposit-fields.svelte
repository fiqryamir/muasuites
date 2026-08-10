<script lang="ts">
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupText
	} from '$lib/components/ui/input-group';
	import { Field, FieldLabel, FieldGroup } from '$lib/components/ui/field';
	import * as Select from '$lib/components/ui/select';

	let {
		mode = $bindable<'FIXED' | 'PERCENT'>('FIXED'),
		value = $bindable(0)
	}: { mode?: 'FIXED' | 'PERCENT'; value?: number } = $props();
</script>

<FieldGroup class="grid gap-4 sm:grid-cols-2">
	<Field class="gap-2">
		<FieldLabel>Deposit type</FieldLabel>
		<Select.Root type="single" bind:value={mode}>
			<Select.Trigger
				id="deposit_mode"
				class="flex h-10 w-full items-center justify-between rounded-full border-none bg-muted px-4 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring"
			>
				{mode === 'FIXED' ? 'Fixed Amount (RM)' : 'Percentage (%)'}
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><path d="m6 9 6 6 6-6"/></svg>
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="FIXED">Fixed Amount (RM)</Select.Item>
				<Select.Item value="PERCENT">Percentage (%)</Select.Item>
			</Select.Content>
		</Select.Root>
	</Field>

	<Field class="gap-2">
		<FieldLabel>
			{mode === 'FIXED' ? 'Deposit amount' : 'Deposit percentage'}
		</FieldLabel>
		<InputGroup class="rounded-full bg-muted border-none overflow-hidden">
			{#if mode === 'FIXED'}
				<InputGroupAddon class="pl-4">
					<InputGroupText class="text-muted-foreground text-sm">RM</InputGroupText>
				</InputGroupAddon>
			{/if}
			<InputGroupInput
				id="deposit_value"
				type="number"
				step="0.01"
				bind:value
				required
				class="border-none bg-transparent focus-visible:ring-0"
			/>
			{#if mode === 'PERCENT'}
				<InputGroupAddon class="pr-4">
					<InputGroupText class="text-muted-foreground text-sm">%</InputGroupText>
				</InputGroupAddon>
			{/if}
		</InputGroup>
	</Field>
</FieldGroup>
