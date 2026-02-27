import z from 'zod'

export const AnalyticsParamsSchema = z.object({
	// siteID: z.uuid(),
	startTime: z.coerce.number().int().nonnegative(),
	endTime: z.coerce.number().int().nonnegative(),
	interval: z.string().min(1).optional(),
})

export type AnalyticsParams = z.infer<typeof AnalyticsParamsSchema>
