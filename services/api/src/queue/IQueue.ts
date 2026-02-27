import type { Site } from '@declutter/lib/schema'

export interface IQueue {
	newSiteAdded(site: Site | { site_id: string }): Promise<void>
	close(): Promise<void>
}
