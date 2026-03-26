import type { NodeClickHouseClient } from '@clickhouse/client/dist/client.js'
import type { Site } from '@declutter/lib/schema'

import { createClient } from '@clickhouse/client'

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
				WHERE site_id = {siteId:String} 
				AND timestamp >= toDateTime({start:UInt64}) 
				AND timestamp <= toDateTime({end:UInt64})
				GROUP BY time ORDER BY time
			`,
			query_params: {
				siteId: site.site_id,
				start: startTime,
				end: endTime,
			},
			format: 'JSONEachRow',
		})

		return await res.json()
	}

	async userAgentCount(site: Site, params: AnalyticsParams) {
		const { startTime, endTime } = params

		const res = await this.client.query({
			query: `
				SELECT user_agent, COUNT(*) AS count
				FROM events
				WHERE site_id = {siteId:String}
					AND timestamp >= toDateTime({startTime:UInt32})
					AND timestamp <= toDateTime({endTime:UInt32})
				GROUP BY user_agent
			`,
			query_params: {
				siteId: site.site_id,
				startTime,
				endTime,
			},
			format: 'JSONEachRow',
		})

		return await res.json()
	}

	async locationCount(site: Site, params: AnalyticsParams) {
		const { startTime, endTime } = params

		const res = await this.client.query({
			query: `
				SELECT location, COUNT(*) AS count
				FROM events
				WHERE site_id = {siteId:String}
					AND timestamp >= toDateTime({startTime:UInt32})
					AND timestamp <= toDateTime({endTime:UInt32})
				GROUP BY location
			`,
			query_params: {
				siteId: site.site_id,
				startTime,
				endTime,
			},
			format: 'JSONEachRow',
		})

		return await res.json()
	}

	async referrerCount(site: Site, params: AnalyticsParams) {
		const { startTime, endTime } = params

		const res = await this.client.query({
			query: `
				SELECT referrer, COUNT(*) AS count
				FROM events
				WHERE site_id = {siteId:String}
					AND timestamp >= toDateTime({startTime:UInt32})
					AND timestamp <= toDateTime({endTime:UInt32})
				GROUP BY referrer
			`,
			query_params: {
				siteId: site.site_id,
				startTime,
				endTime,
			},
			format: 'JSONEachRow',
		})

		return await res.json()
	}

	async topPages(site: Site, params: AnalyticsParams) {
		const { startTime, endTime } = params

		const res = await this.client.query({
			query: `
				SELECT page, COUNT(*) AS count
				FROM events
				WHERE site_id = {siteId:String}
					AND timestamp >= toDateTime({startTime:UInt32})
					AND timestamp <= toDateTime({endTime:UInt32})
				GROUP BY page
				ORDER BY count DESC
			`,
			query_params: {
				siteId: site.site_id,
				startTime,
				endTime,
			},
			format: 'JSONEachRow',
		})

		return await res.json()
	}

	async close(): Promise<void> {
		await this.client.close()
	}
}
