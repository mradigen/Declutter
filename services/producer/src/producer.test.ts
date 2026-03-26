import type { Event } from '@declutter/lib/schema'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Producer } from './producer.js'

describe('Producer', () => {
	let mockCache: any
	let mockProducer: any
	let service: Producer

	beforeEach(() => {
		mockCache = {
			checkSiteID: vi.fn(),
		}
		mockProducer = {
			send: vi.fn(),
		}
		service = new Producer(mockCache, mockProducer)
	})

	it('should return invalid_site if site ID is not in cache', async () => {
		mockCache.checkSiteID.mockReturnValue(false)

		const event = { site_id: 'invalid_site' } as Event
		const result = await service.handleEvent(event)

		expect(result).toEqual({ status: 'invalid_site' })

		expect(mockCache.checkSiteID).toHaveBeenCalledWith('invalid_site')
		expect(mockProducer.send).not.toHaveBeenCalled()
	})

	it('should return invalid_data if event data is invalid', async () => {
		mockCache.checkSiteID.mockReturnValue(true)

		const event = {
			site_id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
			invalid_field: 'invalid',
		} as any
		const result = await service.handleEvent(event)

		expect(result.status).toBe('invalid_data')
		expect(result.error).toBeInstanceOf(Error)

		expect(mockCache.checkSiteID).toHaveBeenCalledWith(
			'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'
		)
		expect(mockProducer.send).not.toHaveBeenCalled()
	})

	it('should return success if event is valid and sent to queue', async () => {
		mockCache.checkSiteID.mockReturnValue(true)

		const event = {
			site_id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
			// timestamp: ommited since it's generated in the producer,
			user_agent:
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/',
			location: '1.1.1.1',
			referrer: 'https://example.com',
			page: '/home',
		} as Event
		const result = await service.handleEvent(event)

		expect(result).toEqual({ status: 'success' })

		expect(mockCache.checkSiteID).toHaveBeenCalledWith(
			'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'
		)
		expect(mockProducer.send).toHaveBeenCalledTimes(1)

		const sentPayload = mockProducer.send.mock.calls[0][0]

		expect(sentPayload.data).toBeInstanceOf(Buffer)
		expect(sentPayload).toHaveProperty('properties')
		expect(sentPayload).toHaveProperty('partitionKey')

		const sentEvent = JSON.parse(sentPayload.data.toString())

		expect(sentEvent.site_id).toBe('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb')
		expect(sentEvent).toHaveProperty('event_id')
		expect(sentEvent).toHaveProperty('timestamp')
	})
})
