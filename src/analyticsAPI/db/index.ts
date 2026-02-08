import type { IDatabase } from './interface.js'
import { Postgres } from './postgres.js'

export async function createDB(config: any): Promise<IDatabase> {
	let db: IDatabase
	if (config.type === 'postgres') {
		db = new Postgres(config)
	} else {
		throw new Error(`Unsupported database type: ${config.dbType}`)
	}

	return db
}
