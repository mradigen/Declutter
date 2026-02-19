import config from '../lib/config.js'
import { createAuth } from './auth/index.js'
import { createUserDB } from './users_db/index.js'
import { createRouter } from './routes/index.js'
import { createEventsDB } from './events_db/index.js'

// XXX: IMP move all factories here, leaving each depencency file clean

const user_db = await createUserDB({
	host: config.userDBHost,
	port: config.userDBPort,
	user: config.userDBUser,
	password: config.userDBPassword,
	database: config.userDBName,
	type: config.userDBType,
})

const events_db = await createEventsDB({
	host: config.eventsDBHost,
	port: config.eventsDBPort,
	user: config.eventsDBUser,
	password: config.eventsDBPassword,
	database: config.eventsDBName,
	type: config.eventsDBType,
})

const auth = createAuth(user_db)

const router = createRouter(user_db, events_db, auth)
