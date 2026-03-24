import PulsarClient from 'pulsar-client'

export class Pulsar {
	client: PulsarClient.Client

	constructor(url: string) {
		this.client = new PulsarClient.Client({
			serviceUrl: url,
			listenerName: 'external', // This tells the client to reconnect using only the external localhost address, not the internal docker dns address "broker"
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
