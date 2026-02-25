export type DBConfig = {
	type: string
	host: string
	port: number
	name: string
	user: string
	password: string
}

const config = {
	mode: 'development', // 'production' or 'development'

	jwtSecret: 'secret',

	trace: {
		enable: true,
		url: 'http://localhost:4318/v1/traces',
		samplingRate: 0.1,
	},

	// bloom
	bloomHost: 'localhost',
	bloomPort: 6380,
	bloomFilterName: 'siteIDFilter',
	bloomFilterErrorRate: 0.001,
	bloomFilterCapacity: 50000000,

	cache: {
		host: 'localhost',
		port: 6379,
		keys: {
			siteIDs: 'site_ids',
		},
	},

	producer: {
		listenPort: 3000,
	},

	queue: {
		type: 'pulsar',
		url: 'pulsar://localhost:6650',
		topics: {
			siteAdded: 'site-added',
			eventAdded: 'event-added',
		},
	},

	users_db: {
		type: 'postgres',
		host: 'localhost',
		port: 5432,
		name: 'postgres',
		user: 'postgres',
		password: 'password',
	},

	events_db: {
		type: 'clickhouse',
		host: 'localhost',
		port: 8123,
		name: 'default',
		user: 'clickhouse',
		password: 'password',
	},
}

export default config
