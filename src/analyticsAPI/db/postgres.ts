import { Pool } from 'pg'
import type { Site, User } from '../../lib/schema.js'
import type {
	EventsByTimeParams,
	LocationCountParams,
	UserAgentCountParams,
} from '../types.js'
import type { IDatabase } from './interface.js'

export class Postgres implements IDatabase {
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

	async getUserByEmail(email: string): Promise<User | null> {
		const res = await this.client.query(
			'SELECT * FROM users WHERE email = $1',
			[email]
		)

		return res.rows[0] || null
	}

	// XXX: Make use of uuidv7 for userID as its fast for dbs
	async createUser(email: string, password_hash: string): Promise<boolean> {
		const res = await this.client.query(
			'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
			[email, password_hash]
		)
		return res.rowCount === 1
	}

	async addSite(name: string, user: User): Promise<boolean> {
		const res = await this.client.query(
			'INSERT INTO sites (name, user_id) VALUES ($1, $2) RETURNING *',
			[name, user.user_id]
		)
		return res.rowCount === 1
	}

	// XXX: maybe rename this to somewthing better later, as it returns the site if user owns it, not just a boolean
	async userOwnsSite(user: User, site_id: string): Promise<Site | false> {
		const res = await this.client.query(
			'SELECT * FROM sites WHERE site_id = $1 AND user_id = $2',
			[site_id, user.user_id]
		)
		return res.rows[0] || false
	}

	async listUserSites(user: User): Promise<Site[]> {
		const res = await this.client.query(
			'SELECT * FROM sites WHERE user_id = $1',
			[user.user_id]
		)
		return res.rows
	}

	async eventsByTime(site: Site, params: EventsByTimeParams) {
		const { startTime, endTime, interval } = params

		const res = await this.client.query(
			`
			SELECT time_bucket($4, timestamp) AS time, COUNT(*)
			FROM events
			WHERE site_id = $1 AND timestamp >= to_timestamp($2) AND timestamp <= to_timestamp($3)
			GROUP BY time`,
			[site.site_id, startTime, endTime, interval]
		)
		return res.rows
	}

	async userAgentCount(site: Site, params: UserAgentCountParams) {
		const { startTime, endTime } = params

		const res = await this.client.query(
			`
			SELECT user_agent, COUNT(*)
			FROM events
			WHERE site_id = $1 AND timestamp >= to_timestamp($2) AND timestamp <= to_timestamp($3)
			GROUP BY user_agent`,
			[site.site_id, startTime, endTime]
		)
		return res.rows
	}

	async locationCount(site: Site, params: LocationCountParams) {
		const { startTime, endTime } = params

		const res = await this.client.query(
			`
			SELECT location, COUNT(*)
			FROM events
			WHERE site_id = $1 AND timestamp >= to_timestamp($2) AND timestamp <= to_timestamp($3)
			GROUP BY location`,
			[site.site_id, startTime, endTime]
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
