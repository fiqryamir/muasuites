<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Field, FieldLabel } from '$lib/components/ui/field';
	import { DatePicker } from '$lib/components/ui/date-picker';

	type BlackoutDate = {
		id: number;
		mua_id: string;
		blackout_date: string;
		reason: string | null;
	};

	let supabase = $derived(page.data.supabase);
	let session = $derived(page.data.session);

	let loading = $state(true);
	let adding = $state(false);
	let deletingId = $state<number | null>(null);

	let userId = $state('');
	let muaSlug = $state('');

	let blackouts = $state<BlackoutDate[]>([]);

	let selectedDate = $state<Date | undefined>();
	let reason = $state('');

	function dateKey(d: Date) {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
			d.getDate()
		).padStart(2, '0')}`;
	}

	const todayKey = dateKey(new Date());

	function disabledDate(d: Date) {
		return dateKey(d) < todayKey;
	}

	function fmtDisplay(d: Date) {
		return d.toLocaleDateString('en-MY', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	onMount(async () => {
		if (!session) return;
		userId = session.user.id;
		await loadBlackouts();
	});

	async function loadBlackouts() {
		loading = true;

		const { data: prof } = await supabase.from('muas').select('slug').eq('id', userId).single();

		if (prof) muaSlug = prof.slug;

		const { data: dates } = await supabase
			.from('blackout_dates')
			.select('*')
			.eq('mua_id', userId)
			.gte('blackout_date', todayKey)
			.order('blackout_date', { ascending: true });

		blackouts = dates || [];
		loading = false;
	}

	async function invalidatePublicCache() {
		if (!muaSlug) return;
		fetch('/api/cache/invalidate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ slugs: [muaSlug] })
		}).catch(() => {});
	}

	async function handleAdd(e: Event) {
		e.preventDefault();
		if (!selectedDate) {
			toast.warning('Pick a date first.');
			return;
		}

		const key = dateKey(selectedDate);
		adding = true;

		const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

		const { count } = await supabase
			.from('bookings')
			.select('id', { count: 'exact', head: true })
			.eq('mua_id', userId)
			.eq('event_date', key)
			.or(
				`status.in.(CONFIRMED,FULLY_PAID,PENDING_APPROVAL),and(status.eq.CHECKING_OUT,locked_at.gt.${tenMinAgo})`
			);

		const { error } = await supabase.from('blackout_dates').insert({
			mua_id: userId,
			blackout_date: key,
			reason: reason.trim() || null
		});

		adding = false;

		if (error) {
			if (error.code === '23505') {
				toast.error('This date is already an off day.');
			} else {
				toast.error(error.message);
			}
			return;
		}

		if (count && count > 0) {
			toast.warning(
				`${count} active booking${count === 1 ? '' : 's'} on this date — existing bookings are not affected.`
			);
		} else {
			toast.success('Off day added.');
		}

		selectedDate = undefined;
		reason = '';
		await loadBlackouts();
		invalidatePublicCache();
	}

	async function handleDelete(id: number) {
		deletingId = id;

		const { error } = await supabase.from('blackout_dates').delete().eq('id', id);

		deletingId = null;

		if (error) {
			toast.error(error.message);
			return;
		}

		toast.success('Off day removed.');
		await loadBlackouts();
		invalidatePublicCache();
	}
</script>

{#if loading}
	<div class="flex items-center justify-center py-24">
		<div class="text-muted-foreground flex items-center gap-3">
			<svg
				class="h-4 w-4 animate-spin"
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
			<span class="text-sm">Loading off days...</span>
		</div>
	</div>
{:else}
	<div class="animate-in-up space-y-8">
		<!-- Page Header -->
		<div class="flex items-start justify-between gap-4">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Off days</h1>
				<p class="text-muted-foreground mt-1 text-sm">
					Block dates when you're unavailable — clients won't be able to book them.
				</p>
			</div>
		</div>

		<!-- Add Off Day Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Add an off day</Card.Title>
				<Card.Description>Pick a date to block. Past dates can't be selected.</Card.Description>
			</Card.Header>
			<Card.Content>
				<form onsubmit={handleAdd} class="space-y-6">
					<div class="grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-end">
						<Field class="gap-2">
							<FieldLabel>Date</FieldLabel>
							<DatePicker bind:value={selectedDate} disabledDates={disabledDate} />
						</Field>
						<Field class="gap-2">
							<FieldLabel
								>Reason <span class="text-muted-foreground font-normal">(optional)</span
								></FieldLabel
							>
							<Input
								id="reason"
								bind:value={reason}
								placeholder="e.g., Wedding of a friend"
								class="bg-muted rounded-full border-none px-4"
							/>
						</Field>
					</div>
					<div class="flex justify-end">
						<Button type="submit" disabled={adding} class="rounded-full px-8">
							{adding ? 'Adding...' : 'Add off day'}
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- Upcoming Off Days Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Upcoming off days</Card.Title>
				<Card.Description>
					Dates clients can't book. Remove one to become available again.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if blackouts.length > 0}
					<div class="divide-border divide-y">
						{#each blackouts as day (day.id)}
							<div class="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
								<div class="min-w-0">
									<p class="text-sm font-medium">
										{fmtDisplay(new Date(day.blackout_date + 'T00:00:00'))}
									</p>
									{#if day.reason}
										<p class="text-muted-foreground mt-0.5 truncate text-xs">{day.reason}</p>
									{:else}
										<p class="text-muted-foreground mt-0.5 text-xs">No reason given</p>
									{/if}
								</div>
								<Button
									variant="ghost"
									size="sm"
									disabled={deletingId === day.id}
									onclick={() => handleDelete(day.id)}
									class="text-muted-foreground hover:text-destructive shrink-0"
									aria-label="Remove off day"
								>
									{#if deletingId === day.id}
										<svg
											class="h-4 w-4 animate-spin"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
									{:else}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path
												d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
											/></svg
										>
									{/if}
								</Button>
							</div>
						{/each}
					</div>
				{:else}
					<div class="border-border rounded-lg border border-dashed py-10 text-center">
						<p class="text-muted-foreground text-sm">
							No off days yet. Clients can book any day within your working hours.
						</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
{/if}
