import PulsarClient from 'pulsar-client'

import type { Site } from '../../lib/schema.js'
import type { IQueue } from './IQueue.js'

export class Pulsar implements IQueue {
	client: PulsarClient.Client | undefined
	producer: PulsarClient.Producer | undefined
	config: any

	constructor(config: { url: string; topic: string }) {
		this.config = config
	}

	async init() {
		this.client = new PulsarClient.Client({
			serviceUrl: this.config.url,
		})
		this.producer = await this.client.createProducer({
			topic: this.config.topic,
		})
	}

	async newSiteAdded(site: Site | { site_id: string }): Promise<void> {
		if (!this.producer) {
			throw new Error('Pulsar producer not initialized')
		}

		const messageID = await this.producer.send({
			data: Buffer.from(JSON.stringify({ site_id: site.site_id })),
		})

		if (messageID == undefined) {
			throw new Error(
				`Failed to send message to Pulsar: (${site.site_id})`
			)
		}
	}

	async close(): Promise<void> {
		if (this.producer) {
			this.producer.close()
		}
		if (this.client) {
			this.client.close()
		}
	}
}
