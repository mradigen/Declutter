import config from '../lib/config.js'
import { initTracing } from '../lib/tracing.js'
if (config.trace.enable) {
	initTracing('events-producer')
}
const tracer = trace.getTracer('events-producer')

import type { Producer } from 'pulsar-client'

import { serve } from '@hono/node-server'
import { httpInstrumentationMiddleware } from '@hono/otel'
import { context, propagation, SpanStatusCode, trace } from '@opentelemetry/api'
import { Hono } from 'hono'
import { validator } from 'hono/validator'

import { initPulsar } from '../lib/pulsar.js'
import { EventSchema, type Event } from '../lib/schema.js'
import { Valkey } from './cache.js'

const app = new Hono()

app.get('/', (c) => {
	return c.text('Events Receiver is running!')
})

// Initialize Pulsar
let client = initPulsar(config.queue.url)
let producer: Producer
let cache: Valkey
try {
	producer = await client.createProducer({
		topic: config.queue.topics.eventAdded,
	})
	console.log('Pulsar Producer initialized')

	cache = new Valkey({
		host: config.cache.host,
		port: config.cache.port,
		key: config.cache.keys.siteIDs,
		bloomFilterCapacity: config.bloom.capacity,
		bloomFilterErrorRate: config.bloom.errorRate,
	})
	await cache.init()
	await cache.cacheSiteIDs()
	console.log('Cache initialized with site IDs')
} catch (error) {
	console.error('Failed to initialize Queue or Cache:', error)
	process.exit(1)
}

app.use(
	httpInstrumentationMiddleware({
		serviceName: 'events-producer',
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

		span?.addEvent('Checking in bloom filter')
		const siteIDExists = cache.checkSiteID(event.site_id)
		// No need to trace a simple Bloom filter check, as it's very fast and doesn't involve I/O. If it becomes a bottleneck, we can add tracing later.
		// const siteIDExists = tracer.startActiveSpan(
		// 	'check_bloom_filter',
		// 	(span) => {
		// 		try {
		// 			const result = cache.checkSiteID(event.site_id)
		// 			return result
		// 		} catch (error) {
		// 			span.recordException(error as Error)
		// 			span.setStatus({ code: 2 })
		// 			throw error
		// 		} finally {
		// 			span.end()
		// 		}
		// 	}
		// )

		if (!siteIDExists) {
			span?.setStatus({
				code: SpanStatusCode.ERROR,
				message: 'Invalid site_id',
			})
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
			span?.setStatus({
				code: SpanStatusCode.ERROR,
				message: 'Invalid event data',
			})
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
		console.log(`Producer ready on http://localhost:${info.port}`)
	}
)
