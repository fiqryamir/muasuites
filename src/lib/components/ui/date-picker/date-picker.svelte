<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar';
	import { CalendarDate, type DateValue } from '@internationalized/date';
	import { cn } from '$lib/utils';

	let {
		value = $bindable<Date | undefined>(),
		placeholder = $bindable('Pick a date'),
		class: className,
		disabled = false,
		disabledDates = () => false
	}: {
		value?: Date | undefined;
		placeholder?: string;
		class?: string;
		disabled?: boolean;
		disabledDates?: (date: Date) => boolean;
	} = $props();

	let open = $state(false);

	// Calendar for single date selection — use DateValue | undefined
	let calendarValue = $state<DateValue | undefined>(
		value ? new CalendarDate(value.getFullYear(), value.getMonth() + 1, value.getDate()) : undefined
	);

	// Sync changes from calendar back to the Date
	$effect(() => {
		if (calendarValue) {
			value = new Date(calendarValue.year, calendarValue.month - 1, calendarValue.day);
			open = false;
		} else {
			value = undefined;
		}
	});

	function fmtDisplay(d: Date | undefined): string {
		if (!d) return placeholder;
		return d.toLocaleDateString('en-MY', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger disabled={disabled} class="w-full">
		<Button
			variant="outline"
			class={cn(
				'h-10 w-full justify-start rounded-full px-4 text-left text-sm font-normal',
				!value && 'text-muted-foreground',
				className
			)}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 shrink-0"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
			{fmtDisplay(value)}
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0 rounded-xl" side="bottom" align="start">
		<Calendar
			type="single"
			bind:value={calendarValue}
			locale="en-MY"
			isDateDisabled={(d) => disabledDates(new Date(d.year, d.month - 1, d.day))}
		/>
	</Popover.Content>
</Popover.Root>
