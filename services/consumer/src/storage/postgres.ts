import type { Event } from '@declutter/lib/schema'

import { Pool } from 'pg'

import type { IStorage } from './IStorage.js'

export class Postgres implements IStorage {
	client: Pool = null as unknown as Pool

	constructor(config: any) {
		this.client = new Pool({
			host: config.host,
			port: config.port,
			user: config.user,
			password: config.password,
			database: config.database,

			max: 20,
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 2000,
			maxLifetimeSeconds: 60,
		})
	}

	async save(event: Event): Promise<void> {
		const res = await this.client.query(
			'INSERT INTO events(event_id, site_id, timestamp, user_agent, location) VALUES($1, $2, $3, $4, $5) RETURNING *',
			[
				event.event_id,
				event.site_id,
				new Date(event.timestamp),
				event.user_agent,
				event.location,
			]
		)
		if (res.rowCount !== 1) {
			throw new Error('Failed to save event')
		}
	}
	async close(): Promise<void> {
		await this.client.end()
	}
}
