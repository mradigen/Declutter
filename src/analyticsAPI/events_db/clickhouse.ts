import { createClient } from '@clickhouse/client'
import type { NodeClickHouseClient } from '@clickhouse/client/dist/client.js'
import type { Site } from '../../lib/schema.js'
import type { AnalyticsParams } from '../types.js'
import type { IEventsDB } from './IEventsDB.js'

export class Clickhouse implements IEventsDB {
	client: NodeClickHouseClient

	constructor(config: any) {
		this.client = createClient({
			url: `http://${config.host}:${config.port}`,
			username: config.user,
			password: config.password,
			database: config.database,
		})
	}

	async eventsByTime(site: Site, params: AnalyticsParams) {
		const { startTime, endTime, interval } = params

		const res = await this.client.query({
			// TODO: Make these materialized views for better performance
			query: `
				SELECT toStartOfInterval(timestamp, INTERVAL ${interval}) AS time, COUNT(*) as count
				FROM events
				WHERE site_id='${site.site_id}' AND timestamp >= toDateTime(${startTime}) AND timestamp <= toDateTime(${endTime})
				GROUP BY time
				ORDER BY time
			`,
			format: 'JSONEachRow',
		})

		return await res.json()
	}

	async userAgentCount(site: Site, params: AnalyticsParams) {
		const { startTime, endTime } = params

		const res = await this.client.query({
			query: `
				SELECT user_agent, COUNT(*) as count
				FROM events
				WHERE site_id='${site.site_id}' AND timestamp >= toDateTime(${startTime}) AND timestamp <= toDateTime(${endTime})
				GROUP BY user_agent
			`,
			format: 'JSONEachRow',
		})

		return await res.json()
	}

	async locationCount(site: Site, params: AnalyticsParams) {
		const { startTime, endTime } = params

		const res = await this.client.query({
			query: `
				SELECT location, COUNT(*) as count
				FROM events
				WHERE site_id='${site.site_id}' AND timestamp >= toDateTime(${startTime}) AND timestamp <= toDateTime(${endTime})
				GROUP BY location
			`,
			format: 'JSONEachRow',
		})

		return await res.json()
	}

	async referrerCount(site: Site, params: AnalyticsParams) {
		const { startTime, endTime } = params

		const res = await this.client.query({
			query: `
				SELECT referrer, COUNT(*) as count
				FROM events
				WHERE site_id='${site.site_id}' AND timestamp >= toDateTime(${startTime}) AND timestamp <= toDateTime(${endTime})
				GROUP BY referrer
			`,
			format: 'JSONEachRow',
		})

		return await res.json()
	}

	async close(): Promise<void> {
		await this.client.close()
	}
}
