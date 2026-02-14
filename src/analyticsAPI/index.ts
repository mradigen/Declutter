import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import config from '../lib/config.js'
import { createAuth } from './auth/index.js'
import { createDB } from './db/index.js'
import { authRouter } from './routes/auth.js'
import { siteRouter } from './routes/sites.js'

export const db = await createDB({
	host: config.dbHost,
	port: config.dbPort,
	user: config.dbUser,
	password: config.dbPassword,
	database: config.dbName,
	type: config.dbType,
})

export const auth = createAuth(db)

const app = new Hono()

app.get('/', (c) => {
	return c.text('Analytics API is running!')
})

app.route('/auth', authRouter)
app.route('/sites', siteRouter)

serve(
	{
		fetch: app.fetch,
		port: 4000,
	},
	(info) => {
		console.log(`analyticsAPI is running on http://localhost:${info.port}`)
	}
)
