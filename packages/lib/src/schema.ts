import * as z from 'zod'

export const EventSchema = z.object({
	event_id: z.uuid(),
	site_id: z.uuid(),
	timestamp: z.number().int().nonnegative(),
	// name: z.string().min(1),
	user_agent: z.string().min(1),
	location: z.string().min(1),
	referrer: z.string().optional(),
	page: z.string().min(1),
})

export type Event = z.infer<typeof EventSchema>

export const SiteSchema = z.object({
	site_id: z.uuid(),
	user_id: z.string().min(1),
})

export type Site = z.infer<typeof SiteSchema>

export const UserSchema = z.object({
	user_id: z.string().min(1),
	email: z.email(),
	password_hash: z.string().min(1),
})

export type User = z.infer<typeof UserSchema>
