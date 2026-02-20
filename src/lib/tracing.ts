import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

import config from './config.js'

export function initTracing(serviceName: string) {
	const traceExporter = new OTLPTraceExporter({ url: config.trace.url })

	const sdk = new NodeSDK({
		resource: resourceFromAttributes({
			[ATTR_SERVICE_NAME]: serviceName,
		}),
		traceExporter,
		instrumentations: [getNodeAutoInstrumentations()],
	})

	sdk.start()

	// Graceful shutdown
	process.on('SIGTERM', () => {
		sdk.shutdown()
			.then(() => console.log('Tracing terminated'))
			.catch((error) =>
				console.log(`Error terminating tracing: ${error}`)
			)
			.finally(() => process.exit(0))
	})

	console.log(`OpenTelemetry initialized for service: ${serviceName}`)
}
