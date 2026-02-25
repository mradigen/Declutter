import { GlideClient, type GlideString } from '@valkey/valkey-glide'
import { BloomFilter } from 'fastbloom'

export class Valkey {
	client: GlideClient | undefined
	config: { host: string; port: number; key: string }
	fliter: BloomFilter

	constructor(config: {
		host: string
		port: number
		key: string
		bloomFilterCapacity: number
		bloomFilterErrorRate: number
	}) {
		this.config = config
		this.client = undefined
		this.fliter = new BloomFilter(
			config.bloomFilterCapacity,
			config.bloomFilterErrorRate
		)
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

	async cacheSiteIDs(): Promise<void> {
		if (!this.client) {
			throw new Error('Valkey client not initialized')
		}

		let cursor: GlideString = '0'
		let totalLoaded = 0

		do {
			const result = await this.client.sscan(this.config.key, cursor, {
				match: '*',
				count: 500_000,
			})

			cursor = result[0]
			const keys = result[1]

			totalLoaded += keys.length

			// @ts-ignore
			this.fliter.bulkAdd(keys)
			console.log(totalLoaded, 'site IDs loaded into Bloom filter')
		} while (cursor !== '0')
	}

	checkSiteID(site_id: string): boolean {
		return this.fliter.has(site_id)
	}

	close(): void {
		if (this.client) {
			this.client.close()
			this.client = undefined
		}
	}
}
