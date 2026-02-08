import { Client } from 'pg'
import type { IDatabase } from './interface.js'
import { generateHash, verifyHash } from '../../lib/crypto.js'
import type { User } from '../../lib/schema.js'
import type {
	EventsByTimeParams,
	UserAgentCountParams,
	LocationCountParams,
} from '../types.js'

export class Postgres implements IDatabase {
	client: Client = null as unknown as Client

	async init(config: any): Promise<void> {
		this.client = new Client({
			host: config.dbHost,
			port: config.dbPort,
			user: config.dbUser,
			password: config.dbPassword,
			database: config.dbName,
		})

		await this.client.connect()
	}

	async getUserByEmail(email: string): Promise<User | null> {
		const res = await this.client.query(
			'SELECT * FROM users WHERE email = $1',
			[email]
		)

		return res.rows[0] || null
	}

	async createUser(email: string, passwordHash: string): Promise<boolean> {
		const res = await this.client.query(
			'INSERT INTO users (email, passwordHash) VALUES ($1, $2)',
			[email, passwordHash]
		)
		return res.rowCount === 1
	}

	async eventsByTime(params: EventsByTimeParams) {
		const { siteID, startTime, endTime, interval } = params

		// if (!params.interval) {
		// 	params.interval = '1 hour' // TODO: default interval in config
		// }

		const res = await this.client.query(
			`
			SELECT time_bucket($4, timestamp) AS bucket, COUNT(*)
			FROM events
			WHERE siteID = $1 AND timestamp >= to_timestamp($2) AND timestamp <= to_timestamp($3)
			GROUP BY bucket`,
			[siteID, startTime, endTime, interval]
		)
		return res.rows
	}

	async userAgentCount(params: UserAgentCountParams) {
		const { siteID, startTime, endTime } = params

		const res = await this.client.query(
			`
			SELECT userAgent, COUNT(*)
			FROM events
			WHERE siteID = $1 AND timestamp >= to_timestamp($2) AND timestamp <= to_timestamp($3)
			GROUP BY userAgent`,
			[siteID, startTime, endTime]
		)
		return res.rows
	}

	async locationCount(params: LocationCountParams) {
		const { siteID, startTime, endTime } = params

		const res = await this.client.query(
			`
			SELECT location, COUNT(*)
			FROM events
			WHERE siteID = $1 AND timestamp >= to_timestamp($2) AND timestamp <= to_timestamp($3)
			GROUP BY location`,
			[siteID, startTime, endTime]
		)
		return res.rows
	}

	async query(text: string, params?: any[]): Promise<any> {
		return this.client.query(text, params)
	}

	async close(): Promise<void> {
		await this.client.end()
	}
}
