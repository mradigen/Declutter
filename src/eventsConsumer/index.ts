import config from '../lib/config.js'
import { initTracing } from '../lib/tracing.js'
if (config.trace.enable) {
	initTracing('events-consumer')
}
const tracer = trace.getTracer('events-consumer')

import { propagation, context, trace, SpanStatusCode } from '@opentelemetry/api'
import sjson from 'secure-json-parse'

import type { IStorage } from './storage/IStorage.js'

import { initPulsar } from '../lib/pulsar.js'
import { EventSchema, type Event } from '../lib/schema.js'
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

/////////////////////
// Pulsar Consumer //
/////////////////////

let client = initPulsar(config.queue.url)

const subscriptionName = 'eventsConsumer'

try {
	await client.subscribe({
		topic: config.queue.topics.eventAdded,
		subscription: subscriptionName,
		subscriptionType: 'Shared',
		// XXX: Dead letter policy
		listener: async (message, consumer) => {
			const properties = message.getProperties()

			const parentContext = propagation.extract(
				context.active(),
				properties
			)

			await tracer.startActiveSpan(
				'consume_event',
				{ kind: 1 },
				parentContext,
				async (span) => {
					try {
						const json: Event = sjson.parse(
							message.getData().toString()
						)
						const event: Event = await EventSchema.parseAsync(json)
						console.log(`Received: ${event.event_id}`)

						// Check cache before saving
						span.addEvent('Checking site_id in cache', {
							site_id: event.site_id,
						})
						const isValidSite = await cache.checkSiteID(
							event.site_id
						)

						span.addEvent('DB save decision', {
							isValidSite,
						})
						if (isValidSite) {
							await tracer.startActiveSpan(
								'save_event_to_db',
								async (saveSpan) => {
									try {
										await db.save(event)
										console.log(
											`Saved event ${event.event_id} to database`
										)
										saveSpan.setStatus({
											code: SpanStatusCode.OK,
											message:
												'Event saved in DB successfully',
										})
									} catch (error) {
										saveSpan.recordException(error as Error)
										saveSpan.setStatus({
											code: SpanStatusCode.ERROR,
											message: 'Failed to save event',
										})
										throw error
									} finally {
										saveSpan.end()
									}
								}
							)
						} else {
							console.warn(
								`Invalid site_id: ${event.site_id}, dropping event.`
							)
						}

						// Alternative without nested spans:
						// if (isValidSite) {
						// 	await db.save(event) // consume the event and save it to the database
						// 	console.log(`Consumed: ${event.event_id}`)
						// } else {
						// 	console.warn(
						// 		`Invalid site_id: ${event.site_id}, dropping event.`
						// 	)
						// }

						span.addEvent('Acknowledging message to Pulsar')
						consumer.acknowledge(message)
						span.setStatus({
							code: SpanStatusCode.OK,
							message: 'Message consumed successfully',
						})
					} catch (error) {
						consumer.negativeAcknowledge(message)
						console.error(`Error consuming message: ${error}`)
						span.setStatus({
							code: SpanStatusCode.ERROR,
							message: 'Failed to consume message',
						})
					} finally {
						span.end()
					}
				}
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
