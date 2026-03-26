import type { Event } from '@declutter/lib'

import { serve } from '@hono/node-server'
import { httpInstrumentationMiddleware } from '@hono/otel'
import { Hono } from 'hono'
import { validator } from 'hono/validator'

import type { EventResult, ProducerService } from './producer.service.js'

type RouterOptions = {
	exposeInvalidSite: boolean
}

export class Router {
	private app: Hono
	private server: ReturnType<typeof serve> | undefined

	constructor(
		private service: ProducerService,
		private options: RouterOptions
	) {
		this.app = new Hono()

		this.app.use(
			httpInstrumentationMiddleware({
				serviceName: 'events-producer',
				serviceVersion: '1.0.0',
				captureRequestHeaders: ['user-agent', 'service-name'],
			})
		)

		this.app.get('/', (c) => {
			return c.text('Events Receiver is running!')
		})

		this.app.post(
			'/event',
			validator('json', (value) => value),
			async (c) => {
				const event: Event = c.req.valid('json') as Event

				const result: EventResult =
					await this.service.handleEvent(event)

				if (result.status === 'invalid_site') {
					if (this.options.exposeInvalidSite) {
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
	}

	start(port: number) {
		this.server = serve(
			{
				fetch: this.app.fetch,
				port: port,
			},
			(info) => {
				console.log(`Producer ready on http://localhost:${info.port}`)
			}
		)
	}

	close() {
		this.server?.close()
	}
}
