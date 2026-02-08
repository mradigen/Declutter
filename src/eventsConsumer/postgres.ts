import type { Event } from '../lib/schema.js'
import type { IStorage } from '../lib/storage.js'
import { Client } from 'pg'

export class Postgres implements IStorage {
	client: Client = null as unknown as Client

	async init(config: any): Promise<void> {
		this.client = new Client({
			host: config.host,
			port: config.port,
			user: config.user,
			password: config.password,
			database: config.database,
		})

		await this.client.connect()

		await this.client.query(`
			CREATE TABLE IF NOT EXISTS users (
				id          UUID PRIMARY KEY,
				email       TEXT UNIQUE,
				passwordHash    TEXT
			);

			CREATE TABLE IF NOT EXISTS sites (
				id          UUID PRIMARY KEY ON DELETE CASCADE ON UPDATE CASCADE,
				userID     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
			);

			CREATE TABLE IF NOT EXISTS events (
				id          UUID PRIMARY KEY,
				siteID     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE ON UPDATE CASCADE,
				timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				userAgent  TEXT,
				location    TEXT
			);
		`)
	}

	async save(event: Event): Promise<void> {
		const res = await this.client.query(
			'INSERT INTO events(id, siteID, timestamp, userAgent, location) VALUES($1, $2, $3, $4, $5) RETURNING *',
			[
				event.eventID,
				event.siteID,
				new Date(event.timestamp),
				event.userAgent,
				event.location,
			]
		)
		if (res.rowCount !== 1) {
			throw new Error('Failed to save event')
		}
	}

	async get(eventId: string): Promise<any> {
		// Retrieve event from Postgres database here
	}
	async close(): Promise<void> {
		await this.client.end()
	}
}
