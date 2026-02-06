import { Hono } from 'hono'
import { initPulsar } from '../lib/pulsar.js'
import { sValidator } from '@hono/standard-validator'
import { EventSchema, type Event } from '../lib/schema.js'
import config from '../lib/config.js'
import { checkSiteID } from './checkSiteID.js'

const router = new Hono()

let client = initPulsar(config.pulsarServiceUrl)

let producer = await client.createProducer({
	topic: config.pulsarTopic,
})

router.post('/', sValidator('json', EventSchema), (c) => {
	const event: Event = c.req.valid('json')

	if (!checkSiteID(event.siteID)) {
		c.status(400)
		return c.text('Invalid siteID')
	}

	event.timestamp = Date.now()

	// TODO: Add more validations

	producer.send({
		data: Buffer.from(JSON.stringify(event)),
	})

	c.status(202)
	return c.text('Event produced')
})

export { router }
