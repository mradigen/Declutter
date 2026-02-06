import { initPulsar } from '../lib/pulsar.js'
import config from '../lib/config.js'
import { Postgres } from './postgres.js'
import type { Event } from '../lib/schema.js'

// Database
const db = new Postgres()
try {
	await db.init({
		host: config.dbHost,
		port: config.dbPort,
		user: config.dbUser,
		password: config.dbPassword,
		database: config.dbName,
	})
} catch (error) {
	console.error('Failed to initialize database:', error)
	process.exit(1)
}

async function consume(event: Event) {
	await db.save(event)
}

// Pulsar Consumer

let client = initPulsar(config.pulsarServiceUrl)

const subscriptionName =
	'eventsConsumer-' + Math.random().toString(36).substring(2, 15)

let consumer = await client.subscribe({
	topic: config.pulsarTopic,
	subscription: subscriptionName,
	subscriptionType: 'Shared',
	// TODO: Dead letter policy
	listener: async (message, consumer) => {
		const event: Event = JSON.parse(message.getData().toString()) // TODO: Handle parse errors, preferably with zod

		console.log(`received: ${event.eventID}`)

		try {
			await consume(event)
			console.log('Event consumed successfully')
			consumer.acknowledge(message)
		} catch (error) {
			console.error('Error consuming message:', error)
			consumer.negativeAcknowledge(message)
		}
	},
})
