import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { validator } from 'hono/validator'
import config from '../lib/config.js'
import { initPulsar } from '../lib/pulsar.js'
import { EventSchema, type Event } from '../lib/schema.js'
import { checkSiteID } from './checkSiteID.js'

const app = new Hono()

app.get('/', (c) => {
	return c.text('Events Receiver is running!')
})

let client = initPulsar(config.pulsarServiceUrl)

// XXX: IMP implement opentelemetry tracing and metrics for a request, and export to a collector like Jaeger, so everything can be visualized

let producer = await client.createProducer({
	topic: config.pulsarTopic,
})
console.log('Pulsar Producer initialized')

app.post(
	'/event',
	validator('json', (value) => value),
	async (c) => {
		const event: Event = c.req.valid('json') as Event

		if (!checkSiteID(event.site_id)) {
			if (config.mode === 'development') {
				c.status(400)
				return c.text('Invalid siteID')
			}

			c.status(202) // sends 202 to prevent leaking information about valid siteIDs
			return c.text('Event produced')
		}

		event.event_id = crypto.randomUUID()
		event.timestamp = Date.now()

		let validatedEvent: Event
		try {
			validatedEvent = await EventSchema.parseAsync(event)
		} catch (error) {
			c.status(400)
			return c.text('Invalid event data: ' + error)
		}

		producer.send({
			data: Buffer.from(JSON.stringify(validatedEvent)),
		})

		c.status(202)
		return c.text('Event produced')
	}
)

serve(
	{
		fetch: app.fetch,
		port: config.producer.listenPort,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`)
	}
)
