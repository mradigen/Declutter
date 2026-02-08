import sjson from 'secure-json-parse'
import config from '../lib/config.js'
import { initPulsar } from '../lib/pulsar.js'
import { EventSchema, type Event } from '../lib/schema.js'
import type { IStorage } from '../lib/storage.js'
import { Postgres } from './postgres.js'

let db: IStorage

try {
	if (config.dbType === 'postgres') {
		db = new Postgres({
			host: config.dbHost,
			port: config.dbPort,
			user: config.dbUser,
			password: config.dbPassword,
			database: config.dbName,
		})
	} else {
		throw new Error('Unsupported database type in config: ' + config.dbType)
	}
} catch (error) {
	console.error('Failed to initialize database:', error)
	process.exit(1)
}

/////////////////////
// Pulsar Consumer //
/////////////////////

let client = initPulsar(config.pulsarServiceUrl)

const subscriptionName =
	'eventsConsumer-' + Math.random().toString(36).substring(2, 15)

let consumer = await client.subscribe({
	topic: config.pulsarTopic,
	subscription: subscriptionName,
	subscriptionType: 'Shared',
	// TODO: Dead letter policy
	listener: async (message, consumer) => {
		try {
			// const json: Event = JSON.parse(message.getData().toString())
			const json: Event = sjson.parse(message.getData().toString())

			const event: Event = await EventSchema.parseAsync(json)

			console.log(`received: ${event.eventID}`)

			await db.save(event) // consume the event and save it to the database
			console.log('Event consumed successfully')
			consumer.acknowledge(message)
		} catch (error) {
			console.error('Error consuming message:', error)
			consumer.negativeAcknowledge(message)
		}
	},
})
