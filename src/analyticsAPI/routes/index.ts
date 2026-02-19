import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import type { Auth } from '../auth/index.js'
import type { IEventsDB } from '../events_db/IEventsDB.js'
import type { IUsersDB } from '../users_db/IUserDB.js'
import { authRouter } from './auth.js'
import { siteRouter } from './sites.js'

export let user_db: IUsersDB
export let events_db: IEventsDB
export let auth: Auth

// Could use c.var instead of a singleton for the db, but i prefer it like this for now
export function createRouter(
	p_userdb: IUsersDB,
	p_eventsdb: IEventsDB,
	p_auth: Auth,
	config: any = {}
) {
	user_db = p_userdb
	events_db = p_eventsdb
	auth = p_auth

	const app = new Hono()

	app.get('/', (c) => {
		return c.text('Analytics API is running!')
	})

	app.route('/auth', authRouter)
	app.route('/sites', siteRouter)

	serve(
		{
			fetch: app.fetch,
			port: config.port || 4000,
		},
		(info) => {
			console.log(
				`analyticsAPI is running on http://localhost:${info.port}`
			)
		}
	)
}
