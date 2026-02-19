import { generateHash, verifyHash } from '../../lib/crypto.js'
import type { User } from '../../lib/schema.js'
import type { IDatabase } from '../db/interface.js'

export class Auth {
	db: IDatabase

	constructor(db: IDatabase) {
		this.db = db
	}

	async login(email: string, password: string): Promise<User | false> {
		const user = await this.db.getUserByEmail(email)

		if (!user) {
			return false
		}

		const isValid = await verifyHash(user.password_hash, password)
		return isValid ? user : false
	}

	async signup(email: string, password: string) {
		const existingUser = await this.db.getUserByEmail(email)
		if (existingUser) {
			return false
		}

		const passwordHash = await generateHash(password)
		return await this.db.createUser(email, passwordHash)
	}
}
