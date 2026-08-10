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
	<FieldLabel>Custom booking link</FieldLabel>
	<InputGroup class="rounded-full bg-muted border-none overflow-hidden">
		<InputGroupAddon class="pl-4">
			<InputGroupText class="text-muted-foreground text-sm">muasuites.com/</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput
			id="slug"
			bind:value
			required
			placeholder="your-handle"
			class="border-none bg-transparent focus-visible:ring-0"
		/>
	</InputGroup>
</Field>
