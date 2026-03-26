import z from 'zod'

const INTERVALS = ['1 SECOND', '1 MINUTE', '1 HOUR', '1 DAY', '1 WEEK'] as const

export const AnalyticsParamsSchema = z.object({
	// siteID: z.uuid(),
	startTime: z.coerce.number().int().nonnegative(),
	endTime: z.coerce.number().int().nonnegative(),
	interval: z.enum(INTERVALS).optional(),
})

export type AnalyticsParams = z.infer<typeof AnalyticsParamsSchema>
