import { Client } from 'pg'
import type { User } from '../../lib/schema.js'
import type {
	EventsByTimeParams,
	LocationCountParams,
	UserAgentCountParams,
} from '../types.js'

export interface IDatabase {
	client: Client
	init(config: any): Promise<void>
	getUserByEmail(email: string): Promise<User | null>
	createUser(email: string, passwordHash: string): Promise<boolean>
	eventsByTime(params: EventsByTimeParams): Promise<any>
	userAgentCount(params: UserAgentCountParams): Promise<any>
	locationCount(params: LocationCountParams): Promise<any>
	query(text: string, params?: any[]): Promise<any>
	close(): Promise<void>
}
