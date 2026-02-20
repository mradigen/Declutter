import { GlideClient } from '@valkey/valkey-glide'

import config from '../lib/config.js'
import { initValkey } from '../lib/valkey.js'

const client = await initValkey(config.bloomHost, config.bloomPort)
const bloomFilterName = config.bloomFilterName

try {
	await client.customCommand([
		'BF.RESERVE',
		config.bloomFilterName,
		config.bloomFilterErrorRate + '',
		config.bloomFilterCapacity + '',
	])
} catch (error) {
	if (error instanceof Error && error.message.includes('item exists')) {
		console.log('Bloom filter already exists, skipping creation')
	}
}

export async function checkSiteID(site_id: string): Promise<boolean> {
	const bloomKey = `${site_id}`

	const exists = await client.customCommand([
		'BF.EXISTS',
		bloomFilterName,
		bloomKey,
	])

	return exists === 1
}

export async function setSiteID(site_id: string): Promise<boolean> {
	const bloomKey = `${site_id}`

	const success = await client.customCommand([
		'BF.ADD',
		bloomFilterName,
		bloomKey,
	])

	return success === 1
}
