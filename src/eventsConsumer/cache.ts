import { trace } from '@opentelemetry/api'
import { GlideClient } from '@valkey/valkey-glide'

const tracer = trace.getTracer('consumer-cache')

export class Valkey {
	client: GlideClient | undefined
	config: { host: string; port: number; key: string }

	constructor(config: { host: string; port: number; key: string }) {
		this.config = config
		this.client = undefined
	}

	async init() {
		if (this.client) {
			return this.client
		}

		this.client = await GlideClient.createClient({
			addresses: [{ host: this.config.host, port: this.config.port }],
			requestTimeout: 1000,
		})

		return this.client
	}

	async checkSiteID(site_id: string): Promise<boolean> {
		if (!this.client) {
			throw new Error('Valkey client not initialized')
		}

		return await tracer.startActiveSpan('check_site_id', async (span) => {
			try {
				// @ts-ignore: Object is possibly 'undefined'.
				const result = await this.client.sismember(
					this.config.key,
					site_id
				)
				return result
			} catch (error) {
				span.recordException(error as Error)
				throw error
			} finally {
				span.end()
			}
		})
	}

	close(): void {
		if (this.client) {
			this.client.close()
			this.client = undefined
		}
	}
}
