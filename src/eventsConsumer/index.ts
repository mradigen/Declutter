import config from '../lib/config.js'
import { initTracing } from '../lib/tracing.js'
if (config.trace.enable) {
	initTracing('events-consumer')
}
const tracer = trace.getTracer('events-consumer')
console.log('Tracing enabled:', config.trace.enable)

import { propagation, context, trace } from '@opentelemetry/api'
import sjson from 'secure-json-parse'

import type { IStorage } from './storage/IStorage.js'

import { initPulsar } from '../lib/pulsar.js'
import { EventSchema, type Event } from '../lib/schema.js'
import { Clickhouse } from './storage/clickhouse.js'

let db: IStorage

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
} catch (error) {
	console.error('Failed to initialize database:', error)
	process.exit(1)
}

/////////////////////
// Pulsar Consumer //
/////////////////////

let client = initPulsar(config.queue.url)

const subscriptionName = 'eventsConsumer'

console.log(
	'Pulsar Consumer initialized with subscription name:',
	subscriptionName
)

await client.subscribe({
	topic: config.queue.topics.eventAdded,
	subscription: subscriptionName,
	subscriptionType: 'Shared',
	// XXX: Dead letter policy
	listener: async (message, consumer) => {
		const properties = message.getProperties()

		const parentContext = propagation.extract(context.active(), properties)

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

					await db.save(event) // consume the event and save it to the database

					consumer.acknowledge(message)
					console.log(`Consumed: ${event.event_id}`)
					span.setStatus({ code: 1 })
				} catch (error) {
					consumer.negativeAcknowledge(message)
					console.error(`Error consuming message: ${error}`)
					span.setStatus({ code: 2 })
				} finally {
					span.end()
				}
			}
		)
	},
})
