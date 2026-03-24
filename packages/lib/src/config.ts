export type DBConfig = {
	type: string
	host: string
	port: number
	name: string
	user: string
	password: string
}

const config = {
	mode: process.env.NODE_ENV ?? 'development',

	api: {
		jwtSecret: process.env.JWT_SECRET ?? 'secret',
	},

	trace: {
		enable:
			process.env.TRACE_ENABLE !== undefined
				? process.env.TRACE_ENABLE === 'true'
				: true,
		url: process.env.TRACE_URL ?? 'http://localhost:4318/v1/traces',
		samplingRate:
			process.env.TRACE_SAMPLING_RATE !== undefined
				? parseFloat(process.env.TRACE_SAMPLING_RATE)
				: 1.0,
	},

	bloom: {
		errorRate:
			process.env.BLOOM_ERROR_RATE !== undefined
				? parseFloat(process.env.BLOOM_ERROR_RATE)
				: 0.001,
		capacity:
			process.env.BLOOM_CAPACITY !== undefined
				? parseInt(process.env.BLOOM_CAPACITY, 10)
				: 50_000_000,
	},

	cache: {
		host: process.env.CACHE_HOST ?? 'localhost',
		port:
			process.env.CACHE_PORT !== undefined
				? parseInt(process.env.CACHE_PORT, 10)
				: 6379,
		keys: {
			siteIDs: process.env.CACHE_KEY_SITE_IDS ?? 'site_ids',
		},
	},

	producer: {
		listenPort:
			process.env.PRODUCER_PORT !== undefined
				? parseInt(process.env.PRODUCER_PORT, 10)
				: 3000,
	},

	queue: {
		type: process.env.QUEUE_TYPE ?? 'pulsar',
		url: process.env.QUEUE_URL ?? 'pulsar://localhost:6650',
		topics: {
			siteAdded: process.env.QUEUE_TOPIC_SITE_ADDED ?? 'site-added',
			eventAdded: process.env.QUEUE_TOPIC_EVENT_ADDED ?? 'event-added',
		},
	},

	users_db: {
		type: process.env.USERS_DB_TYPE ?? 'postgres',
		host: process.env.USERS_DB_HOST ?? 'localhost',
		port:
			process.env.USERS_DB_PORT !== undefined
				? parseInt(process.env.USERS_DB_PORT, 10)
				: 5432,
		name: process.env.USERS_DB_NAME ?? 'postgres',
		user: process.env.USERS_DB_USER ?? 'postgres',
		password: process.env.USERS_DB_PASSWORD ?? 'password',
	},

	events_db: {
		type: process.env.EVENTS_DB_TYPE ?? 'clickhouse',
		host: process.env.EVENTS_DB_HOST ?? 'localhost',
		port:
			process.env.EVENTS_DB_PORT !== undefined
				? parseInt(process.env.EVENTS_DB_PORT, 10)
				: 8123,
		name: process.env.EVENTS_DB_NAME ?? 'default',
		user: process.env.EVENTS_DB_USER ?? 'clickhouse',
		password: process.env.EVENTS_DB_PASSWORD ?? 'password',
	},
}

console.log(config)

export default config
