import { Client } from 'pg'
import config from '../lib/config.js'
import type {
	EventsByTimeParams,
	LocationCountParams,
	UserAgentCountParams,
} from './types.js'

// TODO: IMP Use a connection pool instead of a single client
// TODO: IMP abstract database logic into a separate module
const db = new Client({
	host: config.dbHost,
	port: config.dbPort,
	user: config.dbUser,
	password: config.dbPassword,
	database: config.dbName,
})

await db.connect()

function defaultInterval(params) {
	if (!params.interval) {
		params.interval = '1 hour'
	}
	return params
}

export async function eventsByTime(params: EventsByTimeParams) {
	const { siteID, startTime, endTime, interval } = defaultInterval(params)

	const res = await db.query(
		`
        SELECT time_bucket($4, timestamp) AS bucket, COUNT(*)
        FROM events
        WHERE site_id = $1 AND timestamp >= to_timestamp($2) AND timestamp <= to_timestamp($3)
        GROUP BY bucket`,
		[siteID, startTime, endTime, interval]
	)
	return res.rows
}

export async function userAgentCount(params: UserAgentCountParams) {
	const { siteID, startTime, endTime } = params

	const res = await db.query(
		`
        SELECT user_agent, COUNT(*)
        FROM events
        WHERE site_id = $1 AND timestamp >= to_timestamp($2) AND timestamp <= to_timestamp($3)
        GROUP BY user_agent`,
		[siteID, startTime, endTime]
	)
	return res.rows
}

export async function locationCount(params: LocationCountParams) {
	const { siteID, startTime, endTime } = params

	const res = await db.query(
		`
        SELECT location, COUNT(*)
        FROM events
        WHERE site_id = $1 AND timestamp >= to_timestamp($2) AND timestamp <= to_timestamp($3)
        GROUP BY location`,
		[siteID, startTime, endTime]
	)
	return res.rows
}
