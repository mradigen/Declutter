import type { User } from '@declutter/lib/schema'

import * as argon2 from 'argon2'

import type { IUsersDB } from './users-db/IUsersDB.js'

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

		// const isValid = await verifyHash(user.password_hash, password)
		const isValid = await argon2.verify(user.password_hash, password)
		return isValid ? user : false
	}

	async signup(email: string, password: string): Promise<void> {
		const existingUser = await this.db.getUserByEmail(email)
		if (existingUser) {
			throw new Error(`User already exists: ${email}`)
		}

		// const passwordHash = await generateHash(password)
		const passwordHash = await argon2.hash(password)

		await this.db.createUser(email, passwordHash)
	}
}
