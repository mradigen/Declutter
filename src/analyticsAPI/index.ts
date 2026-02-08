import { serve } from '@hono/node-server'
import { sValidator } from '@hono/standard-validator'
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import config from '../lib/config.js'
import { createAuth } from './auth.js'
import { createDB } from './db/index.js'
import {
	EventsByTimeParamsSchema,
	LocationCountParamsSchema,
	UserAgentCountParamsSchema,
	type EventsByTimeParams,
	type LocationCountParams,
	type UserAgentCountParams,
} from './types.js'

const db = await createDB({
	dbHost: config.dbHost,
	dbPort: config.dbPort,
	dbUser: config.dbUser,
	dbPassword: config.dbPassword,
	dbName: config.dbName,
})

const auth = await createAuth(db)

const app = new Hono()

// TODO: IMP cache into buckets like snapgrids
app.get('/', (c) => {
	return c.text('Analytics API is running!')
})

// Auth endpoints
app.post('/auth/login', async (c) => {
	const { email, password } = await c.req.json()

	const isValid = await auth.login(email, password)

	if (!isValid) {
		return c.json({ success: false }, 401)
	}

	const token = sign(
		{ email, exp: Math.floor(Date.now() / 1000) + 60 * 5 },
		config.jwtSecret
	)

	c.header('Authorization', `Bearer ${token}`)

	return c.json({ success: true })
})

app.post('/auth/signup', async (c) => {
	const { email, password } = await c.req.json()

	const success = await auth.signup(email, password)

	if (!success) {
		return c.json({ success: false }, 400)
	}

	return c.json({ success: true })
})
// Analytics endpoints

app.post(
	'/analytics/events',
	sValidator('json', EventsByTimeParamsSchema),
	async (c) => {
		const params: EventsByTimeParams = c.req.valid('json')

		if (!params.interval) {
			params.interval = '1 hour' // TODO: default interval in config
		}

		const result = await db.eventsByTime(params)
		return c.json(result)
	}
)

app.post(
	'/analytics/useragent',
	sValidator('json', UserAgentCountParamsSchema),
	async (c) => {
		const params: UserAgentCountParams = c.req.valid('json')

		const result = await db.userAgentCount(params)
		return c.json(result)
	}
)

app.post(
	'/analytics/location',
	sValidator('json', LocationCountParamsSchema),
	async (c) => {
		const params: LocationCountParams = c.req.valid('json')

		const result = await db.locationCount(params)
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
