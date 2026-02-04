import * as z from 'zod'

export const EventSchema = z.object({
	eventID: z.uuid(),
	siteID: z.uuid(),
	timestamp: z.number().int().nonnegative(),
	// name: z.string().min(1),
	userAgent: z.string().min(1),
	location: z.string().min(1),
})

export type Event = z.infer<typeof EventSchema>
