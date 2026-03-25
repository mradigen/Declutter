import config from '@declutter/lib/config'
import { Pulsar } from '@declutter/queue'
import { initTracing } from '@declutter/tracing'

import type { IStorage } from './storage/IStorage.js'

import { Valkey } from './cache.js'
import { EventConsumer } from './consumer.service.js'
import { Clickhouse } from './storage/clickhouse.js'

if (config.trace.enable) initTracing('events-consumer')

let db: IStorage
let cache: Valkey

async function bootstrap() {
	if (config.events_db.type === 'clickhouse') {
		db = new Clickhouse({
			host: config.events_db.host,
			port: config.events_db.port,
			user: config.events_db.user,
			password: config.events_db.password,
			database: config.events_db.name,
		})
	} else {
		throw new Error(
			'Unsupported database type in config: ' + config.events_db.type
		)
	}
	console.log('Database initialized:', config.events_db.type)

	// Initialize Cache
	cache = new Valkey({
		host: config.cache.host || 'localhost',
		port: config.cache.port || 6379,
		key: config.cache.keys.siteIDs,
	})
	await cache.init()
	console.log('Cache initialized with key:', config.cache.keys.siteIDs)

	// Initiate Message Subscriber (will be set in consumer service)
	const queue = new Pulsar(config.queue.url)

	// Start service
	const service = new EventConsumer(db, cache, queue)

	let subscriptionName = config.queue.topics.eventAdded
	await service.start(subscriptionName, 'eventsConsumer')

	console.log(
		'Pulsar Consumer initialized with subscription name:',
		subscriptionName
	)

	process.on('SIGTERM', async () => {
		await queue.close()
		cache.close()
		await db.close()
		// await service.stop()
		process.exit(0)
	})
}

bootstrap()
