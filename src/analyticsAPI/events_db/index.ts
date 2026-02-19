import type { IEventsDB } from './IEventsDB.js'
import { Clickhouse } from './clickhouse.js'

export async function createEventsDB(config: any): Promise<IEventsDB> {
	let db: IEventsDB
	if (config.type === 'clickhouse') {
		db = new Clickhouse(config)
	} else {
		throw new Error(`Unsupported database type: ${config.dbType}`)
	}

	return db
}
