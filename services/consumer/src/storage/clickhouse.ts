import type { NodeClickHouseClient } from '@clickhouse/client/dist/client.js'
import type { Event } from '@declutter/lib/schema'

import { createClient } from '@clickhouse/client/dist/client.js'

import type { IStorage } from './IStorage.js'

export class Clickhouse implements IStorage {
	client: NodeClickHouseClient

	constructor(config: any) {
		this.client = createClient({
			url: `http://${config.host}:${config.port}`,
			username: config.user,
			password: config.password,
			database: config.database,
		})
	}

	async save(event: Event): Promise<void> {
		const res = await this.client.insert({
			table: 'events',
			values: [event], // TODO: Batch these for better performance
			format: 'JSONEachRow',
		})
		if (!res.executed) {
			throw new Error('Failed to save event')
		}
	}

	async close(): Promise<void> {
		await this.client.close()
	}

	async get(eventId: string): Promise<any> {
		const res = await this.client.query({
			query: `SELECT * FROM events WHERE event_id='${eventId}'`,
			format: 'JSONEachRow',
		})
		const data = await res.json()
		return data.length > 0 ? data[0] : null
	}
}
