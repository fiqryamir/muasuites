<script lang="ts">
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupText
	} from '$lib/components/ui/input-group';
	import { Field, FieldLabel } from '$lib/components/ui/field';

	let { value = $bindable('') }: { value?: string } = $props();
</script>

<Field class="gap-2">
	<FieldLabel>WhatsApp number</FieldLabel>
	<InputGroup class="rounded-full bg-muted border-none overflow-hidden">
		<InputGroupAddon class="pl-4">
			<InputGroupText class="text-muted-foreground text-sm">+60</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput
			id="whatsapp"
			placeholder="123456789"
			bind:value
			required
			class="border-none bg-transparent focus-visible:ring-0"
		/>
	</InputGroup>
</Field>
