import { sValidator } from '@hono/standard-validator'
import { Hono } from 'hono'
import config from '../lib/config.js'
import { initPulsar } from '../lib/pulsar.js'
import { EventSchema, type Event } from '../lib/schema.js'
import { checkSiteID } from './checkSiteID.js'

export const router = new Hono()

let client = initPulsar(config.pulsarServiceUrl)

// XXX: IMP implement opentelemetry tracing and metrics for a request, and export to a collector like Jaeger, so everything can be visualized

let producer = await client.createProducer({
	topic: config.pulsarTopic,
})

console.log('Pulsar Producer initialized')

router.post('/', sValidator('json', EventSchema), (c) => {
	const event: Event = c.req.valid('json')

	if (!checkSiteID(event.site_id)) {
		// c.status(400)
		// return c.text('Invalid siteID')
		c.status(202) // sends 202 to prevent leaking information about valid siteIDs
		return c.text('Event produced')
	}

	event.timestamp = Date.now()

	// XXX: Add more validations

	producer.send({
		data: Buffer.from(JSON.stringify(event)),
	})

	c.status(202)
	return c.text('Event produced')
})
