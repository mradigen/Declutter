import Pulsar from 'pulsar-client'
import config from './config.js'

let client: Pulsar.Client | undefined

export function initPulsar(): Pulsar.Client {
	if (client) {
		return client
	}

	client = new Pulsar.Client({
		serviceUrl: config.pulsarServiceUrl,
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
