import { generateHash, verifyHash } from '../lib/crypto.js'
import type { IDatabase } from './db/interface.js'

class Auth {
	db: IDatabase

	constructor(db: IDatabase) {
		this.db = db
	}

	async login(email: string, password: string) {
		const user = await this.db.getUserByEmail(email)

		if (!user) {
			return false
		}

		const isValid = await verifyHash(user.passwordHash, password)
		return isValid
	}

	async signup(email: string, password: string) {
		const passwordHash = await generateHash(password)
		return await this.db.createUser(email, passwordHash)
	}
}

export function createAuth(db: IDatabase) {
	return new Auth(db)
}
