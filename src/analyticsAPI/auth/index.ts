import { generateHash, verifyHash } from '../../lib/crypto.js'
import type { User } from '../../lib/schema.js'
import type { IUsersDB } from '../users_db/IUsersDB.js'

export class Auth {
	db: IUsersDB

	constructor(db: IUsersDB) {
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
