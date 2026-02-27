import config from '@declutter/lib/config'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import {
	ParentBasedSampler,
	TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

export function initTracing(serviceName: string) {
	const traceExporter = new OTLPTraceExporter({ url: config.trace.url })

	const sdk = new NodeSDK({
		resource: resourceFromAttributes({
			[ATTR_SERVICE_NAME]: serviceName,
		}),
		traceExporter,
		instrumentations: [getNodeAutoInstrumentations()],
		// We use ParentBasedSampler with TraceIdRatioBasedSampler as the root sampler to ensure
		// that if a request is sampled, all its child spans are also sampled, and we control
		// the overall sampling rate with TraceIdRatioBasedSampler

		// Although the TraceID is used for sampling using a hash function, if there are different ratios
		// on each service, its better if the producer decides to trace then the following services
		// should follow the decision of the producer, instead of making independent sampling decisions which can lead to partial traces and make debugging harder
		sampler: new ParentBasedSampler({
			root: new TraceIdRatioBasedSampler(config.trace.samplingRate),
		}),
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
