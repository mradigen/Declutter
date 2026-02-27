import PulsarClient from 'pulsar-client'

export class Pulsar {
	client: PulsarClient.Client

	constructor(url: string) {
		this.client = new PulsarClient.Client({
			serviceUrl: url,
		})
	}

	getClient(): PulsarClient.Client {
		if (!this.client) {
			throw Error('Pulsar client not initialized')
		}

		return this.client
	}

	async closeClient(): Promise<void> {
		if (this.client) {
			await this.client.close()
		}
	}
}
