<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { Field, FieldLabel, FieldGroup } from '$lib/components/ui/field';

	let { start = $bindable('08:00'), end = $bindable('18:00') }: { start?: string; end?: string } =
		$props();

	const hoursList = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
	const minutesList = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

	function parseTimeToComponents(timeStr: string) {
		const [h, m] = timeStr.split(':').map(Number);
		const period = h >= 12 ? 'PM' : 'AM';
		const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
		return {
			hour: h12.toString().padStart(2, '0'),
			min: m.toString().padStart(2, '0'),
			period
		};
	}

	function composeTime(hour: string, min: string, period: string) {
		let hh = parseInt(hour, 10);
		if (period === 'PM' && hh !== 12) hh += 12;
		if (period === 'AM' && hh === 12) hh = 0;
		return `${hh.toString().padStart(2, '0')}:${min}`;
	}

	let startHour = $state('08');
	let startMin = $state('00');
	let startPeriod = $state('AM');
	let endHour = $state('06');
	let endMin = $state('00');
	let endPeriod = $state('PM');

	// Re-parse the bound props when the parent changes them externally (prefill / reload).
	let prevStart = $state(start);
	$effect(() => {
		if (start !== prevStart) {
			prevStart = start;
			const c = parseTimeToComponents(start);
			startHour = c.hour;
			startMin = c.min;
			startPeriod = c.period;
		}
	});

	let prevEnd = $state(end);
	$effect(() => {
		if (end !== prevEnd) {
			prevEnd = end;
			const c = parseTimeToComponents(end);
			endHour = c.hour;
			endMin = c.min;
			endPeriod = c.period;
		}
	});

	// Emit the composed HH:MM back to the parent as the selects change.
	$effect(() => {
		start = composeTime(startHour, startMin, startPeriod);
	});

	$effect(() => {
		end = composeTime(endHour, endMin, endPeriod);
	});
</script>

<FieldGroup class="grid gap-6 sm:grid-cols-2">
	<!-- Working Hours Start -->
	<Field class="gap-2">
		<FieldLabel>Working hours start</FieldLabel>
		<div class="flex items-center gap-2">
			<div class="flex-1">
				<Select.Root type="single" bind:value={startHour}>
					<Select.Trigger class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2">{startHour}</Select.Trigger>
					<Select.Content class="max-h-[200px] overflow-y-auto">
						{#each hoursList as hour (hour)}
							<Select.Item value={hour}>{hour}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<span class="text-muted-foreground text-sm font-medium">:</span>
			<div class="flex-1">
				<Select.Root type="single" bind:value={startMin}>
					<Select.Trigger class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2">{startMin}</Select.Trigger>
					<Select.Content class="max-h-[200px] overflow-y-auto">
						{#each minutesList as min (min)}
							<Select.Item value={min}>{min}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="flex-1">
				<Select.Root type="single" bind:value={startPeriod}>
					<Select.Trigger class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2">{startPeriod}</Select.Trigger>
					<Select.Content>
						<Select.Item value="AM">AM</Select.Item>
						<Select.Item value="PM">PM</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	</Field>

	<!-- Working Hours End -->
	<Field class="gap-2">
		<FieldLabel>Working hours end</FieldLabel>
		<div class="flex items-center gap-2">
			<div class="flex-1">
				<Select.Root type="single" bind:value={endHour}>
					<Select.Trigger class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2">{endHour}</Select.Trigger>
					<Select.Content class="max-h-[200px] overflow-y-auto">
						{#each hoursList as hour (hour)}
							<Select.Item value={hour}>{hour}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<span class="text-muted-foreground text-sm font-medium">:</span>
			<div class="flex-1">
				<Select.Root type="single" bind:value={endMin}>
					<Select.Trigger class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2">{endMin}</Select.Trigger>
					<Select.Content class="max-h-[200px] overflow-y-auto">
						{#each minutesList as min (min)}
							<Select.Item value={min}>{min}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="flex-1">
				<Select.Root type="single" bind:value={endPeriod}>
					<Select.Trigger class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2">{endPeriod}</Select.Trigger>
					<Select.Content>
						<Select.Item value="AM">AM</Select.Item>
						<Select.Item value="PM">PM</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	</Field>
</FieldGroup>
