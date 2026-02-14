import type { Site, User } from '../../lib/schema.js'
import type {
	EventsByTimeParams,
	LocationCountParams,
	UserAgentCountParams,
} from '../types.js'

export interface IDatabase {
	getUserByEmail(email: string): Promise<User | null>
	createUser(email: string, passwordHash: string): Promise<boolean>
	addSite(name: string, user: User): Promise<boolean>
	listUserSites(user: User): Promise<Site[]>
	userOwnsSite(user: User, siteID: string): Promise<Site | false>
	eventsByTime(site: Site, params: EventsByTimeParams): Promise<any>
	userAgentCount(site: Site, params: UserAgentCountParams): Promise<any>
	locationCount(site: Site, params: LocationCountParams): Promise<any>
	query(text: string, params?: any[]): Promise<any>
	close(): Promise<void>
}
