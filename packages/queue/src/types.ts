export interface IMessage {
	getData(): Buffer
	getProperties(): Record<string, string>
}

export interface IProducer {
	send(options: {
		data: Buffer
		properties?: Record<string, string>
		partitionKey?: string
	}): Promise<void>

	close(): Promise<void>
}

export interface IQueue {
	subscribe(
		topic: string,
		subscriptionName: string,
		onMessage: (
			message: IMessage,
			acknowledge: () => void,
			negativeAcknowledge: () => void
		) => Promise<void>
	): Promise<void>

	createProducer(topic: string): Promise<IProducer>

	close(): Promise<void>
}
