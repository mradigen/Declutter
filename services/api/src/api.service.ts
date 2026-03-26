import { serve } from '@hono/node-server'
import { httpInstrumentationMiddleware } from '@hono/otel'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import type { Auth } from './auth.js'
import type { IEventsDB } from './events-db/IEventsDB.js'
import type { SitePublisher } from './site-publisher.js'
import type { IUsersDB } from './users-db/IUsersDB.js'

import { createAuthRouter } from './routes/auth.js'
import { createSitesRouter } from './routes/sites.js'

type RouterOptions = {
	jwtSecret: string
}

export class ApiService {
	private app: Hono
	private server: ReturnType<typeof serve> | undefined

	constructor(
		private users_db: IUsersDB,
		private events_db: IEventsDB,
		private auth: Auth,
		private sitePublisher: SitePublisher,
		private options: RouterOptions
	) {
		this.app = new Hono()

		this.app.use(
			httpInstrumentationMiddleware({
				serviceName: 'analytics-api',
				serviceVersion: '1.0.0',
				captureRequestHeaders: ['user-agent', 'service-name'],
			})
		)

		this.app.get('/', (c) => {
			return c.text('Analytics API is running!')
		})

		this.app.use(
			'*',
			cors({
				origin: '*',
				allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
				allowHeaders: ['Content-Type', 'Authorization'],
				exposeHeaders: ['Authorization'],
			})
		)
		this.app.route('/auth', createAuthRouter(this.auth))
		this.app.route(
			'/sites',
			createSitesRouter(
				this.users_db,
				this.events_db,
				this.sitePublisher,
				this.options.jwtSecret
			)
		)
	}

	start() {
		this.server = serve(
			{
				fetch: this.app.fetch,
				port: 5000,
			},
			(info) => {
				console.log(
					`analyticsAPI is running on http://localhost:${info.port}`
				)
			}
		)
	}

	close() {
		this.server?.close()
	}
}
