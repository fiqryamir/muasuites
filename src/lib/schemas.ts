import { z } from 'zod';

export const secureSlotSchema = z.object({
	mua_id: z.string().uuid({ message: 'Invalid identity identifier.' }),
	invite_id: z.string().uuid({ message: 'Invalid invitation identifier.' }).nullable().optional(),
	package_id: z.coerce.number().int().positive({ message: 'Please select an active makeup package.' }),
	event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please select a valid event date.' }),
	event_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'Please enter a valid target ready time.' }),
	client_name: z.string().min(2, { message: 'Name must be at least 2 characters long.' }),
	client_phone: z.string().regex(/^(601)[0-9]{8,10}$/, {
		message: 'Please enter a valid Malaysian mobile number.'
	}),
	venue_address: z.string().min(5, { message: 'Please provide a more complete venue location address.' }),
	total_amount: z.coerce.number().nonnegative(),
	deposit_amount: z.coerce.number().nonnegative(),
	balance_amount: z.coerce.number().nonnegative()
});

/** Schema for validating invite generator form fields */
export const inviteGeneratorSchema = z.object({
	transportOverride: z.coerce.number().nonnegative('Transport fee must be 0 or more.'),
	customSurcharge: z.coerce.number().nonnegative('Surcharge must be 0 or more.'),
	surchargeRemark: z.string().optional(),
	depositValueOverride: z.coerce.number().positive('Must be greater than 0.').nullable().optional(),
	bufferMinutesOverride: z.coerce.number().int().min(0, 'Buffer must be 0 or more.').max(120, 'Buffer cannot exceed 120 minutes.').nullable().optional()
});
