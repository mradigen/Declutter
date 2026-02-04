import { Hono } from 'hono'
import { initPulsar } from '../lib/pulsar.js'
import { sValidator } from '@hono/standard-validator'
import { EventSchema, type Event } from '../lib/schema.js'
import config from '../lib/config.js'

const router = new Hono()

let client = initPulsar()

let producer = await client.createProducer({
	topic: config.pulsarTopic,
})

router.post('/', sValidator('json', EventSchema), (c) => {
	const event: Event = c.req.valid('json')

	event.timestamp = Date.now()

	// TODO: Add more validations

	// TODO: Check if siteID exists

	producer.send({
		data: Buffer.from(JSON.stringify(event)),
	})

	c.status(202)
	return c.text('Event produced')
})

export { router }
