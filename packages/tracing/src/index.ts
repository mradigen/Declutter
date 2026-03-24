import config from '@declutter/lib/config'
import {
	SpanStatusCode,
	type Context,
	type Span,
	type SpanOptions,
	type Tracer,
} from '@opentelemetry/api'
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

export async function withSpan<T>(
	tracer: Tracer,
	spanName: string,
	fn: (span: Span) => Promise<T>,
	options?: SpanOptions,
	context?: Context
): Promise<T> {
	const spanHandler = async (span: Span): Promise<T> => {
		try {
			const result = await fn(span)
			span.setStatus({ code: SpanStatusCode.OK })
			return result
		} catch (error) {
			span.recordException(error as Error)
			span.setStatus({
				code: SpanStatusCode.ERROR,
				message:
					error instanceof Error ? error.message : 'Unknown error',
			})

			throw error // Rethrow the error after recording it in the span
		} finally {
			span.end()
		}
	}

	if (context) {
		return tracer.startActiveSpan(
			spanName,
			options || {},
			context,
			spanHandler
		)
	}

	return tracer.startActiveSpan(spanName, options || {}, spanHandler)
}
