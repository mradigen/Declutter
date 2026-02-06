import { Client } from 'pg'

let client: Client = null as unknown as Client

export async function initPostgres(config: any): Promise<Client> {
	if (client) {
		return client
	}

	client = new Client({
		host: config.host,
		port: config.port,
		user: config.user,
		password: config.password,
		database: config.database,
	})

	await client.connect()

	return client
}
