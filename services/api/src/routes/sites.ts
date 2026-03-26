import type { Site, User } from '@declutter/lib/schema'

import { sValidator } from '@hono/standard-validator'
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

import type { IEventsDB } from '../events-db/IEventsDB.js'
import type { SitePublisher } from '../site-publisher.js'
import type { IUsersDB } from '../users-db/IUsersDB.js'

import { AnalyticsParamsSchema, type AnalyticsParams } from '../types.js'

type Variables = {
	user: User
	site: Site
}

export function createSitesRouter(
	users_db: IUsersDB,
	events_db: IEventsDB,
	sitePublisher: SitePublisher,
	jwtSecret: string
) {
	const siteRouter = new Hono<{ Variables: Variables }>()

	siteRouter.use(
		'*',
		jwt({ secret: jwtSecret, alg: 'HS256' }),
		async (c, next) => {
			const { email, user_id } = c.get('jwtPayload') as User
			c.set('user', { email, user_id } as User)
			await next()
		}
	)

	siteRouter.get('/', async (c) => {
		const sites = await users_db.listUserSites(c.var.user)
		return c.json(sites)
	})

	siteRouter.post('/', async (c) => {
		const { name } = await c.req.json() // FIXME: handle if no json sent

		try {
			await users_db.addSite(name, c.var.user)
		} catch {
			return c.json({ success: false }, 400)
		}

		try {
			await sitePublisher.newSiteAdded({ site_id: name })
		} catch (error) {
			// Not critical, so we dont return an error response, but we log it for debugging
			console.error(
				'Failed to send new site added message to site publisher:',
				error
			)
		}

		return c.json({ success: true })
	})

	// XXX: delete site

	siteRouter.use('/:site_id/*', async (c, next) => {
		const site = await users_db.getSiteIfOwnedByUser(
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

	siteRouter.get(
		'/:site_id/referrer',
		sValidator('query', AnalyticsParamsSchema),
		async (c) => {
			const params: AnalyticsParams = c.req.valid('query')

			const result = await events_db.referrerCount(c.var.site, params)
			return c.json(result)
		}
	)

	siteRouter.get(
		'/:site_id/toppages',
		sValidator('query', AnalyticsParamsSchema),
		async (c) => {
			const params: AnalyticsParams = c.req.valid('query')

			const result = await events_db.topPages(c.var.site, params)
			return c.json(result)
		}
	)

	return siteRouter
}
