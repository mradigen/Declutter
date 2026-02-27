import { initTracing } from '@declutter/tracing'
if (config.trace.enable) {
	initTracing('analytics-api')
}

import type { DBConfig } from '@declutter/lib/config'

import config from '@declutter/lib/config'
import { serve } from '@hono/node-server'
import { httpInstrumentationMiddleware } from '@hono/otel'
import { trace } from '@opentelemetry/api'
import { Hono } from 'hono'

import { Auth } from './auth/index.js'
import { Clickhouse } from './events_db/clickhouse.js'
import { Pulsar } from './queue/pulsar.js'
import { authRouter } from './routes/auth.js'
import { siteRouter } from './routes/sites.js'
import { Postgres } from './users_db/postgres.js'

///////////////
// FACTORIES //
///////////////
function createUsersDB(config: DBConfig) {
	if (config.type === 'postgres') {
		return new Postgres(config)
	}
	throw new Error(`Unsupported database type: ${config.type}`)
}

function createEventsDB(config: DBConfig) {
	if (config.type === 'clickhouse') {
		return new Clickhouse(config)
	}
	throw new Error(`Unsupported database type: ${config.type}`)
}

////////////////
// SINGLETONS //
////////////////
export const users_db = createUsersDB(config.users_db)
export const events_db = createEventsDB(config.events_db)
export const auth = new Auth(users_db)
export const queue = new Pulsar({
	url: config.queue.url,
	topic: config.queue.topics.siteAdded,
})
try {
	console.log('Connecting to queue...')
	await queue.init()
} catch (error) {
	throw new Error('Failed to initialize queue: ' + error)
}
console.log('Queue initialized successfully')
export const tracer = trace.getTracer('analytics-api')

////////////
// ROUTER //
////////////
const app = new Hono()

app.use(
	httpInstrumentationMiddleware({
		serviceName: 'analytics-api',
		serviceVersion: '1.0.0',
		captureRequestHeaders: ['user-agent', 'service-name'],
	})
)

app.get('/', (c) => {
	return c.text('Analytics API is running!')
})

app.route('/auth', authRouter)
app.route('/sites', siteRouter)

serve(
	{
		fetch: app.fetch,
		port: 5000,
	},
	(info) => {
		console.log(`analyticsAPI is running on http://localhost:${info.port}`)
	}
)
