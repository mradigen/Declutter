import config from '@declutter/lib/config'
import { initTracing, withSpan } from '@declutter/tracing'
if (config.trace.enable) {
	initTracing('events-consumer')
}
const tracer = trace.getTracer('events-consumer')

import { EventSchema, type Event } from '@declutter/lib/schema'
import { Pulsar } from '@declutter/queue'
import {
	propagation,
	context,
	trace,
	SpanStatusCode,
	type Span,
} from '@opentelemetry/api'
import sjson from 'secure-json-parse'

import type { IStorage } from './storage/IStorage.js'

import { Valkey } from './cache.js'
import { Clickhouse } from './storage/clickhouse.js'

let db: IStorage
let cache: Valkey

try {
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
		host: config.cache?.host || 'localhost',
		port: config.cache?.port || 6379,
		key: 'site_ids',
	})
	await cache.init()
	console.log('Cache initialized with site IDs')
} catch (error) {
	console.error('Failed to initialize database or cache:', error)
	process.exit(1)
}

async function processEvent(
	eventPayload: string,
	db: IStorage,
	cache: Valkey,
	span: Span
): Promise<void> {
	const json = sjson.parse(eventPayload)
	const event: Event = await EventSchema.parseAsync(json)
	console.log(`Received: ${event.event_id}`)

	// Check cache before saving
	span.addEvent('Checking site_id in cache', { site_id: event.site_id })
	const isValidSite = await cache.checkSiteID(event.site_id)
	span.addEvent('DB save decision', { isValidSite })

	if (isValidSite) {
		await withSpan(tracer, 'save_event_to_db', async (span) => {
			await db.save(event)
			console.log(`Saved event ${event.event_id} to database`)
			span.setStatus({
				code: SpanStatusCode.OK,
				message: 'Event saved in DB successfully',
			})
		})
	} else {
		console.warn(`Invalid site_id: ${event.site_id}, dropping event.`)
	}
}

/////////////////////
// Pulsar Consumer //
/////////////////////

let client = new Pulsar(config.queue.url).getClient()

const subscriptionName = 'eventsConsumer'

try {
	await client.subscribe({
		topic: config.queue.topics.eventAdded,
		subscription: subscriptionName,
		subscriptionType: 'Shared',
		// XXX: Dead letter policy
		listener: async (message, consumer) => {
			const parentContext = propagation.extract(
				context.active(),
				message.getProperties()
			)

			await withSpan(
				tracer,
				'consume_event',
				async (span) => {
					try {
						await processEvent(
							message.getData().toString(),
							db,
							cache,
							span
						)
						span.addEvent('Acknowledging message to Pulsar')
						consumer.acknowledge(message)
					} catch (error) {
						consumer.negativeAcknowledge(message)
						console.error(`Error processing event: ${error}`)
					}
				},
				{ kind: 1 },
				parentContext
			)
		},
	})
} catch (error) {
	console.error('Failed to subscribe to Pulsar topic:', error)
	process.exit(1)
}

console.log(
	'Pulsar Consumer initialized with subscription name:',
	subscriptionName
)
