import Pulsar from 'pulsar-client'

let client: Pulsar.Client | undefined

export function initPulsar(url: string): Pulsar.Client {
	if (client) {
		return client
	}

	client = new Pulsar.Client({
		serviceUrl: url,
	})

	return client
}

export function getPulsar(): Pulsar.Client | Error | undefined {
	if (!client) {
		return Error('Pulsar client not initialized')
	}

	return client
}

export async function closePulsar(): Promise<void> {
	if (client) {
		await client.close()
		client = undefined
	}
}
