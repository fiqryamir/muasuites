export interface Faq {
	question: string;
	answer: string;
}

export const faqs: Faq[] = [
	{
		question: 'Do my clients need to download an app?',
		answer:
			'No. Everything runs from the link you send — it opens in their browser and disappears when they’re done.'
	},
	{
		question: 'Do I need to switch calendar apps?',
		answer:
			'No. Confirmed bookings arrive as a standard calendar file that opens in Apple Calendar, Google Calendar, and whatever else you already use.'
	},
	{
		question: 'What if someone uploads a fake receipt?',
		answer:
			'Nothing confirms automatically. You check the transfer in your own banking app first — a screenshot alone never books a date.'
	},
	{
		question: 'What happens when I hit my free-plan limit?',
		answer:
			'Existing bookings continue as normal. New link generation pauses until a slot frees up or you upgrade — we’ll never charge you without asking.'
	},
	{
		question: 'Can I still take cash or direct bookings?',
		answer:
			'Yes. Generate the link yourself and approve it directly — the date is still blocked and in your calendar.'
	},
	{
		question: 'What if a client enters the wrong details?',
		answer:
			'Decline the booking with a reason, or send a corrected link. You’re never locked into a booking you didn’t approve.'
	}
];
