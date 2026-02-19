import type { Site, User } from '../../lib/schema.js'
import type {
	EventsByTimeParams,
	LocationCountParams,
	UserAgentCountParams,
} from '../types.js'

export interface IUsersDB {
	getUserByEmail(email: string): Promise<User | null>
	createUser(email: string, passwordHash: string): Promise<boolean>
	addSite(name: string, user: User): Promise<boolean>
	listUserSites(user: User): Promise<Site[]>
	userOwnsSite(user: User, siteID: string): Promise<Site | false>
	query(text: string, params?: any[]): Promise<any>
	close(): Promise<void>
}
