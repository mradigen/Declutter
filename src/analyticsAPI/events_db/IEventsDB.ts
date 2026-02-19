import type { Site } from '../../lib/schema.js'
import type {
	EventsByTimeParams,
	LocationCountParams,
	UserAgentCountParams,
} from '../types.js'

export interface IEventsDB {
	eventsByTime(site: Site, params: EventsByTimeParams): Promise<any>
	userAgentCount(site: Site, params: UserAgentCountParams): Promise<any>
	locationCount(site: Site, params: LocationCountParams): Promise<any>
	close(): Promise<void>
}
