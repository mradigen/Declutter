import type { IMessage, IQueue } from '@declutter/queue/types'

import { EventSchema, type Event } from '@declutter/lib/schema'
import { withSpan } from '@declutter/tracing'
import {
	propagation,
	context,
	trace,
	SpanStatusCode,
	type Span,
} from '@opentelemetry/api'
import sjson from 'secure-json-parse'

import type { IStorage } from './storage/IStorage.js'

import { Valkey } from './cache.js'

const tracer = trace.getTracer('events-consumer')

export class EventConsumer {
	constructor(
		private db: IStorage,
		private cache: Valkey,
		private queue: IQueue
	) {}

	async processEvent(eventPayload: string, span: Span): Promise<void> {
		const json = sjson.parse(eventPayload)
		const event: Event = await EventSchema.parseAsync(json)
		console.log(`Received: ${event.event_id}`)

		// Check cache before saving
		span.addEvent('Checking site_id in cache', { site_id: event.site_id })
		const isValidSite = await this.cache.checkSiteID(event.site_id)
		span.addEvent('DB save decision', { isValidSite })

		if (isValidSite) {
			await withSpan(tracer, 'save_event_to_db', async (span) => {
				await this.db.save(event)
				console.log(`Saved event ${event.event_id} to database`)
				span.setStatus({
					code: SpanStatusCode.OK,
					message: 'Event saved in DB successfully',
				})
			})
		} else {
			console.warn(`Invalid site_id: ${event.site_id}, dropping event.`)
		}
	}

	// `handleMessage` is an arrow function to preserve the "this" context when passing it as a callback to the subscriber
	handleMessage = async (
		message: IMessage,
		ack: () => void,
		nack: () => void
	) => {
		const parentContext = propagation.extract(
			context.active(),
			message.getProperties()
		)

		await withSpan(
			tracer,
			'consume_event',
			async (span) => {
				try {
					await this.processEvent(message.getData().toString(), span)
					span.addEvent('Acknowledging message to Pulsar')
					ack()
				} catch (error) {
					nack()
					console.error(`Error processing event: ${error}`)
				}
			},
			{ kind: 1 },
			parentContext
		)
	}

	async start(topic: string, subscriptionName: string) {
		await this.queue.subscribe(topic, subscriptionName, this.handleMessage)
	}

	// Let the root level handle the stop/SIGTERM
	// async stop() {
	// 	await this.queue.close()
	// 	this.cache.close()
	// 	await this.db.close()
	// }
}
