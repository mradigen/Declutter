import type { DBConfig } from '../lib/config.js'

import config from '../lib/config.js'
import { Auth } from './auth/index.js'
import { Clickhouse } from './events_db/clickhouse.js'
import { Pulsar } from './queue/pulsar.js'
import { createRouter } from './routes/index.js'
import { Postgres } from './users_db/postgres.js'

function createUsersDB(config: DBConfig) {
	if (config.type === 'postgres') {
		return new Postgres(config)
	}
	throw new Error(`Unsupported database type: ${config.type}`)
}

function createEventsDB(config: DBConfig) {
	if (config.type === 'clickhouse') {
		return new Clickhouse(config)
	}
	throw new Error(`Unsupported database type: ${config.type}`)
}

const users_db = createUsersDB(config.users_db)
const events_db = createEventsDB(config.events_db)
const auth = new Auth(users_db)
const queue = new Pulsar({
	url: config.queue.url,
	topic: config.queue.topics.siteAdded,
})

const _ = createRouter(users_db, events_db, auth, queue)
