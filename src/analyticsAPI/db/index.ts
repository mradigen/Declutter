import type { IDatabase } from './interface.js'
import { Postgres } from './postgres.js'

export async function createDB(config: any): Promise<IDatabase> {
	// TODO: add logic to check whether postgres or cassandra or something
	const db = new Postgres()
	await db.init(config)
	return db
}
