import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { sValidator } from '@hono/standard-validator'
import {
	EventsByTimeParamsSchema,
	LocationCountParamsSchema,
	UserAgentCountParamsSchema,
	type EventsByTimeParams,
	type LocationCountParams,
	type UserAgentCountParams,
} from './types.js'
import { eventsByTime, locationCount, userAgentCount } from './analytics.js'

const app = new Hono()

// TODO: IMP auth
// TODO: IMP cache into buckets like snapgrids
app.get('/', (c) => {
	return c.text('Analytics API is running!')
})

app.post('/events', sValidator('json', EventsByTimeParamsSchema), async (c) => {
	const params: EventsByTimeParams = c.req.valid('json')

	const result = await eventsByTime(params)
	return c.json(result)
})

app.post(
	'/useragent',
	sValidator('json', UserAgentCountParamsSchema),
	async (c) => {
		const params: UserAgentCountParams = c.req.valid('json')

		const result = await userAgentCount(params)
		return c.json(result)
	}
)

app.post(
	'/location',
	sValidator('json', LocationCountParamsSchema),
	async (c) => {
		const params: LocationCountParams = c.req.valid('json')

		const result = await locationCount(params)
		return c.json(result)
	}
)

serve(
	{
		fetch: app.fetch,
		port: 4000,
	},
	(info) => {
		console.log(`analyticsAPI is running on http://localhost:${info.port}`)
	}
)
