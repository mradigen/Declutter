import type { Site } from '../../lib/schema.js'

export interface IQueue {
	newSiteAdded(site: Site | { site_id: string }): Promise<void>
	close(): Promise<void>
}
