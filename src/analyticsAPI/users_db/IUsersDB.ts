import type { Site, User } from '../../lib/schema.js'

export interface IUsersDB {
	getUserByEmail(email: string): Promise<User | null>
	createUser(email: string, passwordHash: string): Promise<void>
	addSite(name: string, user: User): Promise<void>
	listUserSites(user: User): Promise<Site[]>
	getSiteIfOwnedByUser(user: User, siteID: string): Promise<Site | false>
	query(text: string, params?: any[]): Promise<any>
	close(): Promise<void>
}
