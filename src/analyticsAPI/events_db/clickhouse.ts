import { Pool } from 'pg'
import { createClient } from '@clickhouse/client'
import type { Site, User } from '../../lib/schema.js'
import type {
	EventsByTimeParams,
	LocationCountParams,
	UserAgentCountParams,
} from '../types.js'
import type { IEventsDB } from './IEventsDB.js'
import type { NodeClickHouseClient } from '@clickhouse/client/dist/client.js'

// TODO: Use Clickhouse client etc.
export class Clickhouse implements IEventsDB {
	// client: Pool = null as unknown as Pool
	client: NodeClickHouseClient

	constructor(config: any) {
		this.client = createClient({
			host: `${config.host}:${config.port}`,
			// port: config.port,
			// username: config.user,
			password: config.password,
			// database: config.database,
		})
	}

	// 	this.client = new Pool({
	// 		host: config.host,
	// 		port: config.port,
	// 		user: config.user,
	// 		password: config.password,
	// 		database: config.database,

	// 		max: 20,
	// 		idleTimeoutMillis: 30000,
	// 		connectionTimeoutMillis: 2000,
	// 		maxLifetimeSeconds: 60,
	// 	})
	// }

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

	// async query(text: string, params?: any[]): Promise<any> {
	// 	return this.client.query(text, params)
	// }

	async close(): Promise<void> {
		await this.client.end()
	}
}
