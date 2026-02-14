import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import config from '../../lib/config.js'
import type { User } from '../../lib/schema.js'

import { sValidator } from '@hono/standard-validator'
import { db } from '../index.js'
import {
	EventsByTimeParamsSchema,
	LocationCountParamsSchema,
	UserAgentCountParamsSchema,
	type EventsByTimeParams,
	type LocationCountParams,
	type UserAgentCountParams,
} from '../types.js'

type Variables = {
	user: User
}

export const siteRouter = new Hono<{ Variables: Variables }>()

siteRouter.use(
	'*',
	jwt({ secret: config.jwtSecret, alg: 'HS256' }),
	async (c, next) => {
		const { email, user_id } = c.get('jwtPayload') as User
		c.set('user', { email, user_id } as User)
		await next()
	}
)

siteRouter.get('/', async (c) => {
	const sites = await db.listUserSites(c.var.user)
	console.log(sites)
	return c.json(sites)
})

siteRouter.post('/', async (c) => {
	const { name } = await c.req.json() // TODO: handle if no json sent
	// TODO: add to bloom filter as well
	const success = await db.addSite(name, c.var.user)

	if (!success) {
		return c.json({ success: false }, 400)
	}

	return c.json({ success: true })
})

// TODO: delete site

siteRouter.use('/:siteid/*', async (c, next) => {
	// BUG: potential error bubble if user doesnt own site, do try/catch
	const userOwnsSite = await db.userOwnsSite(
		c.var.user,
		c.req.param('siteid')
	)

	if (!userOwnsSite) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	await next()
})

// TODO: IMP cache into buckets like snapgrids

siteRouter.get(
	'/:siteid/events',
	sValidator('query', EventsByTimeParamsSchema),
	async (c) => {
		const params: EventsByTimeParams = c.req.valid('query')

		console.log(c.var.user)

		if (!params.interval) {
			params.interval = '1 hour'
		}

		const result = await db.eventsByTime(params)
		return c.json(result)
	}
)

siteRouter.post(
	'/:siteid/useragent',
	sValidator('query', UserAgentCountParamsSchema),
	async (c) => {
		const params: UserAgentCountParams = c.req.valid('query')

		const result = await db.userAgentCount(params)
		return c.json(result)
	}
)

siteRouter.post(
	'/:siteid/location',
	sValidator('query', LocationCountParamsSchema),
	async (c) => {
		const params: LocationCountParams = c.req.valid('query')

		const result = await db.locationCount(params)
		return c.json(result)
	}
)
