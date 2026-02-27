import type { User } from '@declutter/lib/schema'

import type { IUsersDB } from '../users_db/IUsersDB.js'

import { generateHash, verifyHash } from './crypto.js'

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

	async signup(email: string, password: string): Promise<void> {
		const existingUser = await this.db.getUserByEmail(email)
		if (existingUser) {
			throw new Error(`User already exists: ${email}`)
		}

		const passwordHash = await generateHash(password)
		await this.db.createUser(email, passwordHash)
	}
}
