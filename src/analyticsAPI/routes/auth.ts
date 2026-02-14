import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import config from '../../lib/config.js'
import { auth } from '../index.js'

export const authRouter = new Hono()

authRouter.post('/login', async (c) => {
	const { email, password } = await c.req.json()

	const isValid = await auth.login(email, password)

	if (!isValid) {
		return c.json({ success: false }, 401)
	}

	const token = await sign(
		{ email, exp: Math.floor(Date.now() / 1000) + 60 * 5 },
		config.jwtSecret
	)

	c.header('Authorization', `Bearer ${token}`)

	return c.json({ success: true })
})

authRouter.post('/signup', async (c) => {
	const { email, password } = await c.req.json()

	const success = await auth.signup(email, password)

	if (!success) {
		return c.json({ success: false }, 400)
	}

	return c.json({ success: true })
})
