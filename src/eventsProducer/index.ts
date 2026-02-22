import config from '../lib/config.js'
import { initTracing } from '../lib/tracing.js'
if (config.trace.enable) {
	initTracing('events-producer')
}
const tracer = trace.getTracer('my-service-name')

import { serve } from '@hono/node-server'
import { httpInstrumentationMiddleware } from '@hono/otel'
import { context, propagation, trace } from '@opentelemetry/api'
import { Hono } from 'hono'
import { validator } from 'hono/validator'

import { initPulsar } from '../lib/pulsar.js'
import { EventSchema, type Event } from '../lib/schema.js'
import { checkSiteID } from './checkSiteID.js'

const app = new Hono()

app.get('/', (c) => {
	return c.text('Events Receiver is running!')
})

let client = initPulsar(config.queue.url)

let producer = await client.createProducer({
	topic: config.queue.topics.eventAdded,
})
console.log('Pulsar Producer initialized')

app.use(
	httpInstrumentationMiddleware({
		serviceName: 'my-service',
		serviceVersion: '1.0.0',
		captureRequestHeaders: ['user-agent', 'service-name'],
	})
)

app.post(
	'/event',
	validator('json', (value) => value),
	async (c) => {
		const span = trace.getActiveSpan()
		const event: Event = c.req.valid('json') as Event

		// span?.addEvent('Checking in bloom filter')
		// const siteIDExists = await checkSiteID(event.site_id)
		const siteIDExists = await tracer.startActiveSpan(
			'check_bloom_filter',
			async (span) => {
				try {
					const result = await checkSiteID(event.site_id)
					return result
				} catch (error) {
					span.recordException(error as Error)
					span.setStatus({ code: 2 })
					throw error
				} finally {
					span.end()
				}
			}
		)

		if (!siteIDExists) {
			span?.setStatus({ code: 2 })
			if (config.mode === 'development') {
				c.status(400)
				return c.text('Invalid site_id: ' + event.site_id)
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

		const carrier = {}
		propagation.inject(context.active(), carrier)
		span?.setAttribute('app.event_id', event.event_id)

		producer.send({
			data: Buffer.from(JSON.stringify(validatedEvent)),
			properties: carrier,
			partitionKey: validatedEvent.site_id, // in case of sharding (which is bad), currently unused
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
