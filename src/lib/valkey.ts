import { GlideClient } from '@valkey/valkey-glide'

let client: GlideClient | undefined

export async function initValkey(host: string, port: number) {
	if (client) {
		return client
	}

	client = await GlideClient.createClient({
		addresses: [{ host, port }],
	})

	return client
}

export function getValkey(): GlideClient | Error | undefined {
	if (!client) {
		return Error('Valkey client not initialized')
	}

	return client
}

export function closeValkey(): void {
	if (client) {
		client.close()
		client = undefined
	}
}
