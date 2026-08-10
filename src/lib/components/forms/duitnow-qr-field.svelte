<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Field, FieldLabel } from '$lib/components/ui/field';

	// $bindable defaults feed the two-way binding contract; eslint cannot see binding reads.
	/* eslint-disable no-useless-assignment */
	let {
		file = $bindable<File | null>(null),
		existingUrl = ''
	}: { file?: File | null; existingUrl?: string } = $props();
	/* eslint-enable no-useless-assignment */

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files?.length) {
			file = target.files[0];
		}
	}
</script>

<Field class="gap-2">
	<FieldLabel>DuitNow QR code</FieldLabel>
	<Input
		id="qr_code"
		type="file"
		accept="image/png,image/jpeg,image/webp"
		onchange={handleFileChange}
		class=""
	/>
</Field>

{#if existingUrl}
	<div class="flex items-center gap-4 rounded-2xl border border-border bg-muted/40 p-4">
		<img
			src={existingUrl}
			alt="DuitNow QR Code"
			class="h-20 w-20 rounded-lg border border-border bg-white object-contain p-1"
		/>
		<div class="space-y-0.5">
			<p class="text-sm font-medium">Current QR code</p>
			<p class="text-xs text-muted-foreground">Visible to clients during checkout.</p>
		</div>
	</div>
{/if}
