import { GlideClient } from '@valkey/valkey-glide'
import { initValkey } from '../lib/valkey.js'
import config from '../lib/config.js'

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

export async function checkSiteID(siteID: string): Promise<boolean> {
	const bloomKey = `siteID:${siteID}`

	const exists = await client.customCommand([
		'BF.EXISTS',
		bloomFilterName,
		bloomKey,
	])

	return exists === 1
}

export async function setSiteID(siteID: string): Promise<boolean> {
	const bloomKey = `siteID:${siteID}`

	const success = await client.customCommand([
		'BF.ADD',
		bloomFilterName,
		bloomKey,
	])

	return success === 1
}
