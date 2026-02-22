import { sValidator } from '@hono/standard-validator'
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

import type { Site, User } from '../../lib/schema.js'

import config from '../../lib/config.js'
import { AnalyticsParamsSchema, type AnalyticsParams } from '../types.js'
import { events_db, queue, user_db } from './index.js'

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
	const sites = await user_db.listUserSites(c.var.user)
	return c.json(sites)
})

siteRouter.post('/', async (c) => {
	const { name } = await c.req.json() // FIXME: handle if no json sent

	try {
		await user_db.addSite(name, c.var.user)
	} catch {
		return c.json({ success: false }, 400)
	}

	try {
		await queue.newSiteAdded({ site_id: name })
	} catch (error) {
		// Not critical, so we dont return an error response, but we log it for debugging
		console.error('Failed to send new site added message to queue:', error)
	}

	return c.json({ success: true })
})

// XXX: delete site

siteRouter.use('/:site_id/*', async (c, next) => {
	const site = await user_db.getSiteIfOwnedByUser(
		c.var.user,
		c.req.param('site_id')
	)

	if (!site) {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	c.set('site', site)
	await next()
})

siteRouter.get(
	'/:site_id/events',
	sValidator('query', AnalyticsParamsSchema),
	async (c) => {
		const params: AnalyticsParams = c.req.valid('query')

		if (!params.interval) {
			params.interval = '1 hour'
		}

		const result = await events_db.eventsByTime(c.var.site, params)
		return c.json(result)
	}
)

siteRouter.get(
	'/:site_id/useragent',
	sValidator('query', AnalyticsParamsSchema),
	async (c) => {
		const params: AnalyticsParams = c.req.valid('query')

		const result = await events_db.userAgentCount(c.var.site, params)
		return c.json(result)
	}
)

siteRouter.get(
	'/:site_id/location',
	sValidator('query', AnalyticsParamsSchema),
	async (c) => {
		const params: AnalyticsParams = c.req.valid('query')

		const result = await events_db.locationCount(c.var.site, params)
		return c.json(result)
	}
)
