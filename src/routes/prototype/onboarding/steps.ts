// PROTOTYPE — throwaway content for the onboarding wizard prototype.
// This is the *content* under test: step structure, field lists, and plain-language
// teaching copy for non-technical MUAs. Layout is up to each variant.

export interface Field {
	id: string;
	label: string;
	type:
		| 'text'
		| 'slug'
		| 'phone'
		| 'select'
		| 'number'
		| 'qr'
		| 'package'
		| 'telegram'
		| 'travel'
		| 'hours'
		| 'buffer';
	required?: boolean;
	placeholder?: string;
	options?: string[];
	why?: string;
}

export interface Step {
	id: string;
	number: number;
	title: string;
	subtitle: string;
	optional?: boolean;
	fields: Field[];
}

export const steps: Step[] = [
	{
		id: 'identity',
		number: 1,
		title: 'Tell clients who you are',
		subtitle: 'Three quick things — then we move on.',
		fields: [
			{
				id: 'studio_name',
				label: 'Studio name',
				type: 'text',
				required: true,
				placeholder: 'Glam by Sarah',
				why: 'Clients see this name at the top of your booking page. Use the name they already know you by.'
			},
			{
				id: 'slug',
				label: 'Booking link',
				type: 'slug',
				required: true,
				why: 'This is your personal page address. Clients open it from your Instagram bio or WhatsApp to check your dates. Short and easy to type is best.'
			},
			{
				id: 'whatsapp',
				label: 'WhatsApp number',
				type: 'phone',
				required: true,
				why: 'Your business number. Clients reach you here, and booking reminders come to this number too.'
			}
		]
	},
	{
		id: 'payment',
		number: 2,
		title: 'How clients pay you',
		subtitle: 'A deposit upfront secures the date — for both of you.',
		fields: [
			{
				id: 'deposit_mode',
				label: 'Deposit type',
				type: 'select',
				required: true,
				options: ['Fixed amount (RM)', 'Percentage (%)'],
				why: 'Ask for a fixed RM amount, or a percentage of the package price.'
			},
			{
				id: 'deposit_value',
				label: 'Deposit',
				type: 'number',
				required: true,
				why: 'Clients pay this upfront when they book. The rest is paid on the event day.'
			},
			{
				id: 'qr',
				label: 'DuitNow QR code',
				type: 'qr',
				required: true,
				why: 'Clients scan this to pay their deposit, then upload the receipt so you can approve the booking.'
			}
		]
	},
	{
		id: 'packages',
		number: 3,
		title: 'Your services',
		subtitle: 'The services clients can book. One is enough to start.',
		fields: [
			{
				id: 'packages',
				label: 'Packages',
				type: 'package',
				required: true,
				why: 'Each package has a price so clients know what to expect. You can edit these anytime.'
			}
		]
	},
	{
		id: 'extras',
		number: 4,
		title: 'Make it even easier',
		subtitle: 'Everything here is optional — you can add it later from Settings.',
		optional: true,
		fields: [
			{
				id: 'telegram',
				label: 'Telegram alerts',
				type: 'telegram',
				why: 'Get an instant message whenever a client books or pays, so nothing slips through. To find your Chat ID, message @userinfobot on Telegram.'
			},
			{
				id: 'travel',
				label: 'Travel fee',
				type: 'travel',
				why: 'Set where you usually travel from and a rate per km. Clients can then estimate their own travel cost — no more “berapa untuk transport?” back-and-forth.'
			},
			{
				id: 'hours',
				label: 'Working hours',
				type: 'hours',
				why: 'The times clients can book you. Defaults to 8:00 AM – 6:00 PM.'
			},
			{
				id: 'buffer',
				label: 'Break between bookings',
				type: 'buffer',
				why: 'Extra free time after each booking for travel. Stops clients from booking back-to-back.'
			}
		]
	},
	{
		id: 'done',
		number: 5,
		title: "You're all set!",
		subtitle: 'This is your booking page — share it anywhere.',
		fields: []
	}
];
