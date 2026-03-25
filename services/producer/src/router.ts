import type { Event } from '@declutter/lib'

import config from '@declutter/lib/config'
import { httpInstrumentationMiddleware } from '@hono/otel'
import { Hono } from 'hono'
import { validator } from 'hono/validator'

import type { EventResult, ProducerService } from './producer.service.js'

export function createRouter(service: ProducerService) {
	const app = new Hono()

	app.use(
		httpInstrumentationMiddleware({
			serviceName: 'events-producer',
			serviceVersion: '1.0.0',
			captureRequestHeaders: ['user-agent', 'service-name'],
		})
	)

	app.get('/', (c) => {
		return c.text('Events Receiver is running!')
	})

	app.post(
		'/event',
		validator('json', (value) => value),
		async (c) => {
			const event: Event = c.req.valid('json') as Event

			const result: EventResult = await service.handleEvent(event)

			if (result.status === 'invalid_site') {
				if (config.mode === 'development') {
					return c.text('Invalid site_id: ' + event.site_id, 400)
				}

				return c.text('Event produced', 202)
			}

			if (result.status === 'invalid_data') {
				return c.text('Invalid event data: ' + result.error, 400)
			}

			return c.text('Event produced', 202)
		}
	)

	return app
}
