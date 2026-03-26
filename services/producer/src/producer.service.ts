import type { IProducer } from '@declutter/queue/types'

import { EventSchema, type Event } from '@declutter/lib/schema'
import { context, propagation, SpanStatusCode, trace } from '@opentelemetry/api'

import type { Valkey } from './cache.js'

export type EventResult =
	| { status: 'success' }
	| { status: 'invalid_site' }
	| { status: 'invalid_data'; error: Error }

export class ProducerService {
	constructor(
		private cache: Valkey,
		private producer: IProducer
	) {}

	async handleEvent(event: Event): Promise<EventResult> {
		const span = trace.getActiveSpan()

		span?.addEvent('Checking in bloom filter')
		const siteIDExists = this.cache.checkSiteID(event.site_id)

		if (!siteIDExists) {
			return { status: 'invalid_site' }
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

			return {
				status: 'invalid_data',
				error:
					error instanceof Error ? error : new Error('Unknown error'),
			}
		}

		const carrier = {}
		propagation.inject(context.active(), carrier)
		span?.setAttribute('app.event_id', event.event_id)

		span?.addEvent('Sending event to queue', {
			'app.event_id': event.event_id,
		})

		// TODO: consider adding retry logic here in case of transient failures, but be careful to avoid duplicates in case of retries. Pulsar's deduplication feature could help with this if enabled on the topic.
		await this.producer.send({
			data: Buffer.from(JSON.stringify(validatedEvent)),
			properties: carrier,
			partitionKey: validatedEvent.site_id, // in case of sharding (which is bad), currently unused
		})

		return { status: 'success' }
	}
}
