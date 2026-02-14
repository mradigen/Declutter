import z from 'zod'

export const EventsByTimeParamsSchema = z.object({
	// siteID: z.uuid(),
	startTime: z.coerce.number().int().nonnegative(),
	endTime: z.coerce.number().int().nonnegative(),
	interval: z.string().min(1).optional(),
})

export type EventsByTimeParams = z.infer<typeof EventsByTimeParamsSchema>

export const UserAgentCountParamsSchema = z.object({
	// siteID: z.uuid(),
	startTime: z.coerce.number().int().nonnegative(),
	endTime: z.coerce.number().int().nonnegative(),
})

export type UserAgentCountParams = z.infer<typeof UserAgentCountParamsSchema>

export const LocationCountParamsSchema = z.object({
	// siteID: z.uuid(),
	startTime: z.coerce.number().int().nonnegative(),
	endTime: z.coerce.number().int().nonnegative(),
})

export type LocationCountParams = z.infer<typeof LocationCountParamsSchema>
