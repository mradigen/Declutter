import type { Event } from './schema.js'

export interface IStorage {
	init(config: any): Promise<void>
	save(event: Event): Promise<void>
	get(eventId: any): any
	close(): void
}
