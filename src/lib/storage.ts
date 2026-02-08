import type { Event } from './schema.js'

export interface IStorage {
	save(event: Event): Promise<void>
	get(eventId: any): any
	close(): void
}
