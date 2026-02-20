import { Client } from 'pg'

import config from '../lib/config.js'
import { initValkey } from '../lib/valkey.js'

const client = await initValkey(config.bloomHost, config.bloomPort)
const bloomFilterName = config.bloomFilterName
const newBloomFilterName = `${config.bloomFilterName}:new`

try {
	await client.customCommand([
		'BF.RESERVE',
		bloomFilterName,
		config.bloomFilterErrorRate + '',
		config.bloomFilterCapacity + '',
	])
} catch (error) {
	if (error instanceof Error && error.message.includes('item exists')) {
		console.log('Bloom filter already exists, skipping creation')
	}
}

let db: Client = null as unknown as Client

try {
	db = new Client({
		host: config.users_db.host,
		port: config.users_db.port,
		user: config.users_db.user,
		password: config.users_db.password,
		database: config.users_db.name,
	})

	await db.connect()
} catch (error) {
	console.error('Failed to initialize database:', error)
	process.exit(1)
}

async function rotateBloomFilter() {
	// XXX: Use a logger instead of console.log
	console.log('Rotating bloom filter...')
	try {
		// FIXME: this is not atomic, figure a way to do this atomically
		const res = await db.query('SELECT site_id FROM sites')

		const siteIDs = res.rows.map((row) => row.site_id)

		try {
			await client.customCommand([
				'BF.RESERVE',
				newBloomFilterName,
				config.bloomFilterErrorRate + '',
				config.bloomFilterCapacity + '',
			])
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes('item exists')
			) {
				// Delete old bloom filter if it exists
				await client.customCommand(['DEL', newBloomFilterName])
				console.log(
					'Deleted existing new bloom filter, retrying creation'
				)
				await client.customCommand([
					'BF.RESERVE',
					newBloomFilterName,
					config.bloomFilterErrorRate + '',
					config.bloomFilterCapacity + '',
				])
			}
		}

		await client.customCommand(['BF.MADD', newBloomFilterName, ...siteIDs])

		// await switchToNewBloomFilter()

		console.log('Bloom filter rotation complete')
	} catch (error) {
		console.error('Error rotating bloom filter:', error)
	}
}

async function switchToNewBloomFilter() {
	// FIXME: Make this atomic
	try {
		console.log('Switching to new bloom filter...')
		await client.customCommand(['DEL', `${bloomFilterName}:old`])
		await client.customCommand([
			'RENAMENX',
			bloomFilterName,
			`${bloomFilterName}:old`,
		])

		await client.customCommand([
			'RENAMENX',
			newBloomFilterName,
			bloomFilterName,
		])

		await client.customCommand(['DEL', newBloomFilterName])
		console.log('Successfully switched bloom filter')
	} catch (error) {
		console.error('Error switching bloom filter:', error)
	}
}

// Rotate bloom filter every hour
// FIXME: Use a proper scheduler instead of setInterval, e.g. node-cron
// setInterval(rotateBloomFilter, 60 * 60 * 1000)

await db.end()
