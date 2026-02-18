import config from '../lib/config.js'
import { createAuth } from './auth/index.js'
import { createCache } from './cache/index.js'
import { createDB } from './db/index.js'
import { createRouter } from './routes/index.js'

// XXX: IMP move all factories here, leaving each depencency file clean

const db = await createDB({
	host: config.dbHost,
	port: config.dbPort,
	user: config.dbUser,
	password: config.dbPassword,
	database: config.dbName,
	type: config.dbType,
})

const auth = createAuth(db)

const router = createRouter(db, auth)
