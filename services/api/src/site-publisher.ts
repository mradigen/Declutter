import type { Site } from '@declutter/lib'
import type { IProducer } from '@declutter/queue/types'

export class SitePublisher {
	constructor(private producer: IProducer) {}

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
}
