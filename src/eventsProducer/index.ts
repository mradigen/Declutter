import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { router as eventsRouter } from './events.js'

const app = new Hono()

app.get('/', (c) => {
	return c.text('Events Receiver is running!')
})

app.route('/events', eventsRouter)

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`)
	}
)
