import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import config from '../../lib/config.js'
import type { Site, User } from '../../lib/schema.js'

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
	site: Site
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
	return c.json(sites)
})

siteRouter.post('/', async (c) => {
	const { name } = await c.req.json() // FIXME: handle if no json sent
	// FIXME: add to bloom filter as well
	const success = await db.addSite(name, c.var.user)

	if (!success) {
		return c.json({ success: false }, 400)
	}

	return c.json({ success: true })
})

// XXX: delete site

siteRouter.use('/:site_id/*', async (c, next) => {
	// FIXME: potential error bubble if user doesnt own site, do try/catch
	const site = await db.userOwnsSite(c.var.user, c.req.param('site_id'))

	if (!site) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	c.set('site', site)
	await next()
})

// TODO: IMP cache into buckets like snapgrids

siteRouter.get(
	'/:site_id/events',
	sValidator('query', EventsByTimeParamsSchema),
	async (c) => {
		const params: EventsByTimeParams = c.req.valid('query')

		if (!params.interval) {
			params.interval = '1 hour'
		}

		const result = await db.eventsByTime(c.var.site, params)
		return c.json(result)
	}
)

siteRouter.get(
	'/:site_id/useragent',
	sValidator('query', UserAgentCountParamsSchema),
	async (c) => {
		const params: UserAgentCountParams = c.req.valid('query')

		const result = await db.userAgentCount(c.var.site, params)
		return c.json(result)
	}
)

siteRouter.get(
	'/:site_id/location',
	sValidator('query', LocationCountParamsSchema),
	async (c) => {
		const params: LocationCountParams = c.req.valid('query')

		const result = await db.locationCount(c.var.site, params)
		return c.json(result)
	}
)
