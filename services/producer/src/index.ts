import config from '@declutter/lib/config'
import { Pulsar } from '@declutter/queue'
import { initTracing } from '@declutter/tracing'
import { serve } from '@hono/node-server'

import { Valkey } from './cache.js'
import { ProducerService } from './producer.service.js'
import { createRouter } from './router.js'

if (config.trace.enable) initTracing('events-producer')

async function bootstrap() {
	// Queue
	const client = new Pulsar(config.queue.url)
	console.log('Connecting to Pulsar...')
	const producer = await client.createProducer(config.queue.topics.eventAdded)
	console.log('Pulsar Producer initialized')

	// Cache
	console.log('Initializing cache...')
	const cache = new Valkey({
		host: config.cache.host,
		port: config.cache.port,
		key: config.cache.keys.siteIDs,
		bloomFilterCapacity: config.bloom.capacity,
		bloomFilterErrorRate: config.bloom.errorRate,
	})
	await cache.init()
	let t = performance.now()
	await cache.cacheSiteIDs()
	t = performance.now() - t
	console.log(`Cache initialized in ${(t / 1000).toFixed(2)} s with site IDs`)

	const service = new ProducerService(cache, producer)
	console.log('Producer service initialized')

	const app = createRouter(service)
	const server = serve(
		{
			fetch: app.fetch,
			port: config.producer.listenPort,
		},
		(info) => {
			console.log(`Producer ready on http://localhost:${info.port}`)
		}
	)

	process.on('SIGTERM', async () => {
		console.log('Received SIGTERM, shutting down')
		server.close()
		await producer.close()
		await client.close()
		cache.close()
		process.exit(0)
	})
}

bootstrap()
