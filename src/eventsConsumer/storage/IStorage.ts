import type { Event } from '../../lib/schema.js'

export interface IStorage {
	save(event: Event): Promise<void>
	get(eventId: any): any
	close(): Promise<void>
}
