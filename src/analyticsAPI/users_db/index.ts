import type { IUsersDB } from './IUserDB.js'
import { Postgres } from './postgres.js'

export async function createUserDB(config: any): Promise<IUsersDB> {
	let db: IUsersDB
	if (config.type === 'postgres') {
		db = new Postgres(config)
	} else {
		throw new Error(`Unsupported database type: ${config.dbType}`)
	}

	return db
}
