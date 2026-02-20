import sjson from 'secure-json-parse'
import config from '../lib/config.js'
import { initPulsar } from '../lib/pulsar.js'
import { EventSchema, type Event } from '../lib/schema.js'
import type { IStorage } from './storage/IStorage.js'
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

let client = initPulsar(config.pulsarServiceUrl)

const subscriptionName = 'eventsConsumer'

console.log(
	'Pulsar Consumer initialized with subscription name:',
	subscriptionName
)

let consumer = await client.subscribe({
	topic: config.pulsarTopic,
	subscription: subscriptionName,
	subscriptionType: 'Shared',
	// XXX: Dead letter policy
	listener: async (message, consumer) => {
		try {
			const json: Event = sjson.parse(message.getData().toString())
			const event: Event = await EventSchema.parseAsync(json)
			console.log(`Received: ${event.event_id}`)

			await db.save(event) // consume the event and save it to the database

			consumer.acknowledge(message)
			console.log(`Consumed: ${event.event_id}`)
		} catch (error) {
			consumer.negativeAcknowledge(message)
			console.error(`Error consuming message: ${error}`)
		}
	},
})
