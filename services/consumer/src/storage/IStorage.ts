import type { Event } from '@declutter/lib/schema'

export interface IStorage {
	save(event: Event): Promise<void>
	close(): Promise<void>
}
