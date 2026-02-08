import type { IDatabase } from './interface.js'
import { Postgres } from './postgres.js'

export async function createDB(config: any): Promise<IDatabase> {
	let db: IDatabase
	if (config.dbType === 'postgres') {
		db = new Postgres()
	} else {
		throw new Error(`Unsupported database type: ${config.dbType}`)
	}

	await db.init(config)
	return db
}
