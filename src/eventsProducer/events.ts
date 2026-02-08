import { Hono } from 'hono'
import { initPulsar } from '../lib/pulsar.js'
import { sValidator } from '@hono/standard-validator'
import { EventSchema, type Event } from '../lib/schema.js'
import config from '../lib/config.js'
import { checkSiteID } from './checkSiteID.js'

export const router = new Hono()

let client = initPulsar(config.pulsarServiceUrl)

let producer = await client.createProducer({
	topic: config.pulsarTopic,
})

router.post('/', sValidator('json', EventSchema), (c) => {
	const event: Event = c.req.valid('json')

	if (!checkSiteID(event.siteID)) {
		// c.status(400)
		// return c.text('Invalid siteID')
		c.status(202) // sends 202 to prevent leaking information about valid siteIDs
		return c.text('Event produced')
	}

	event.timestamp = Date.now()

	// TODO: Add more validations

	producer.send({
		data: Buffer.from(JSON.stringify(event)),
	})

	c.status(202)
	return c.text('Event produced')
})
