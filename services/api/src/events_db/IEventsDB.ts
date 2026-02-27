import type { Site } from '@declutter/lib/schema'

import type { AnalyticsParams } from '../types.js'

export interface IEventsDB {
	eventsByTime(site: Site, params: AnalyticsParams): Promise<any>
	userAgentCount(site: Site, params: AnalyticsParams): Promise<any>
	locationCount(site: Site, params: AnalyticsParams): Promise<any>
	referrerCount(site: Site, params: AnalyticsParams): Promise<any>
	close(): Promise<void>
}
