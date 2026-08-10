<script lang="ts">
	import { toast } from 'svelte-sonner';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import { Field, FieldLabel } from '$lib/components/ui/field';
	import { packageSchema, type PackageRow } from '$lib/schemas';

	let {
		supabase,
		userId,
		packages = $bindable<PackageRow[]>([]),
		removable = false
	}: { supabase: SupabaseClient; userId: string; packages?: PackageRow[]; removable?: boolean } =
		$props();

	let addingPackage = $state(false);
	let removingId = $state<number | null>(null);
	let pkgEmoji = $state('💄');
	let pkgName = $state('');
	let pkgPrice = $state(0);
	let pkgDuration = $state(3.0);

	async function handleAddPackage(e: Event) {
		e.preventDefault();
		addingPackage = true;

		const result = packageSchema.safeParse({ pkgEmoji, pkgName, pkgPrice });

		if (!result.success) {
			addingPackage = false;
			toast.warning(result.error.issues[0].message);
			return;
		}

		const { data, error } = await supabase
			.from('packages')
			.insert({
				mua_id: userId,
				name: pkgName,
				price: pkgPrice,
				emoji: pkgEmoji,
				duration_hours: pkgDuration
			})
			.select()
			.single();

		addingPackage = false;

		if (error) {
			toast.error(error.message);
		} else {
			pkgName = '';
			pkgPrice = 0;
			pkgEmoji = '💄';
			pkgDuration = 3.0;
			toast.success('Package added.');
			packages = [...packages, data].sort((a, b) => Number(a.price) - Number(b.price));
		}
	}

	async function handleRemovePackage(pkg: PackageRow) {
		removingId = pkg.id;

		const { error } = await supabase.from('packages').delete().eq('id', pkg.id);

		removingId = null;

		if (error) {
			toast.error(error.message);
		} else {
			toast.success('Package removed.');
			packages = packages.filter((p) => p.id !== pkg.id);
		}
	}
</script>

{#if packages.length > 0}
	<div class="divide-y divide-border">
		{#each packages as pkg (pkg.id)}
			<div class="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
				<div class="flex items-center gap-3">
					<span
						class="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-base"
					>
						{pkg.emoji}
					</span>
					<div>
						<span class="text-sm font-medium">{pkg.name}</span>
						<p class="text-[11px] text-muted-foreground">{pkg.duration_hours} hrs</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<span class="text-sm font-semibold tabular-nums">
						RM {Number(pkg.price).toLocaleString('en-MY', {
							minimumFractionDigits: 2
						})}
					</span>
					{#if removable}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={removingId === pkg.id}
							onclick={() => handleRemovePackage(pkg)}
							class="rounded-full text-muted-foreground hover:text-destructive"
						>
							{removingId === pkg.id ? 'Removing...' : 'Remove'}
						</Button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="rounded-lg border border-dashed border-border py-10 text-center">
		<p class="text-sm text-muted-foreground">
			No packages yet. Add your first one below.
		</p>
	</div>
{/if}

<Separator />

<div class="space-y-4">
	<h4 class="text-sm font-semibold">Add new package</h4>
	<form onsubmit={handleAddPackage} class="grid gap-4 sm:grid-cols-[5rem_1fr_7rem_7rem]">
		<Field class="gap-2">
			<FieldLabel>Icon</FieldLabel>
			<Input id="pkg-emoji" bind:value={pkgEmoji} required class="text-center rounded-full bg-muted border-none" />
		</Field>
		<Field class="gap-2">
			<FieldLabel>Package name</FieldLabel>
			<Input id="pkg-name" bind:value={pkgName} required placeholder="e.g., Nikah Full Glam" class="rounded-full bg-muted border-none px-4" />
		</Field>
		<Field class="gap-2">
			<FieldLabel>Duration (hrs)</FieldLabel>
			<Input id="pkg-duration" type="number" step="0.5" min="0.5" max="12" bind:value={pkgDuration} required class="rounded-full bg-muted border-none px-4" />
		</Field>
		<Field class="gap-2">
			<FieldLabel>Price (RM)</FieldLabel>
			<Input id="pkg-price" type="number" step="0.01" bind:value={pkgPrice} required placeholder="800.00" class="rounded-full bg-muted border-none px-4" />
		</Field>
		<div class="flex justify-end sm:col-span-4">
			<Button type="submit" variant="outline" disabled={addingPackage} class="rounded-full">
				{addingPackage ? 'Adding...' : 'Add package'}
			</Button>
		</div>
	</form>
</div>
