import * as argon2 from 'argon2'

export async function verifyHash(
	passwordHash: string,
	password: string
): Promise<boolean> {
	return argon2.verify(passwordHash, password)
}

export async function generateHash(password: string): Promise<string> {
	return argon2.hash(password)
}
