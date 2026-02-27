import type { Event } from '@declutter/lib/schema'

window.addEventListener('load', () => {
	// @ts-ignore
	const config = window.analyticsConfig

	// @ts-ignore
	const data: Event = {
		timestamp: Date.now(),
		user_agent: navigator.userAgent,
		site_id: config.site_id,
		referrer: document.referrer,
		page: window.location.pathname,
		event_id: crypto.randomUUID(),
	}

	fetch(
		config.mode === 'development'
			? 'http://localhost:3000/event'
			: 'https://declutter.phy0.in/event',
		{
			method: 'POST',
			body: JSON.stringify(data),
		}
	)
})
