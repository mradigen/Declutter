import type { DBConfig } from '@declutter/lib/config'

import config from '@declutter/lib/config'
import { Pulsar } from '@declutter/queue'
import { initTracing } from '@declutter/tracing'

import { ApiService } from './api.service.js'
import { Auth } from './auth.js'
import { Clickhouse } from './events-db/clickhouse.js'
import { SitePublisher } from './site-publisher.js'
import { Postgres } from './users-db/postgres.js'

if (config.trace.enable) initTracing('analytics-api')

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

///////////////
// BOOTSTRAP //
///////////////
async function bootstrap() {
	const users_db = createUsersDB(config.users_db)
	console.log('Users DB initialized successfully')

	const events_db = createEventsDB(config.events_db)
	console.log('Events DB initialized successfully')

	const auth = new Auth(users_db)

	const client = new Pulsar(config.queue.url)
	const sitePublisherProducer = await client.createProducer(
		config.queue.topics.siteAdded
	)
	const sitePublisher = new SitePublisher(sitePublisherProducer)
	console.log('Queue initialized successfully')

	const apiService = new ApiService(
		users_db,
		events_db,
		auth,
		sitePublisher,
		{
			jwtSecret: config.api.jwtSecret,
		}
	)
	apiService.start()

	process.on('SIGTERM', async () => {
		console.log('Received SIGTERM. Shutting down')
		apiService.close()
		users_db.close()
		events_db.close()
		await sitePublisherProducer.close()
		process.exit(0)
	})
}

bootstrap()
