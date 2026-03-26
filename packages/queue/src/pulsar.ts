import PulsarClient from 'pulsar-client'

import type { IMessage, IProducer, IQueue } from './types.js'

export class Pulsar implements IQueue {
	private client: PulsarClient.Client

	constructor(url: string) {
		this.client = new PulsarClient.Client({
			serviceUrl: url,
			// listenerName: 'external', // This tells the client to reconnect using only the external localhost address, not the internal docker dns address "broker". Not required for development, but can be useful for testing in production-like environments where the internal and external addresses differ.
		})
	}

	async subscribe(
		topic: string,
		subscriptionName: string,
		onMessage: (
			message: IMessage,
			acknowledge: () => void,
			negativeAcknowledge: () => void
		) => Promise<void>
	): Promise<void> {
		await this.client.subscribe({
			topic: topic,
			subscription: subscriptionName,
			subscriptionType: 'Shared',
			listener: async (message, consumer) => {
				const ack = () => consumer.acknowledge(message)
				const nack = () => consumer.negativeAcknowledge(message)

				await onMessage(message, ack, nack)
			},
		})
	}

	async createProducer(topic: string): Promise<IProducer> {
		const producer = await this.client.createProducer({
			topic: topic,
			// batchingEnabled: false, // Disable batching for lower latency, but higher overhead. Can be enabled for higher throughput if latency is not a concern.
		})

		return {
			send: async (options: {
				data: Buffer
				properties?: Record<string, string>
				partitionKey?: string
			}) => {
				await producer.send({
					data: options.data,
					properties: options.properties,
					partitionKey: options.partitionKey,
				})
			},
			close: async () => {
				await producer.close()
			},
		}
	}

	async close(): Promise<void> {
		await this.client.close()
	}
}
