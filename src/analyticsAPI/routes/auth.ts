import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import config from '../../lib/config.js'
import { auth } from '../index.js'

export const authRouter = new Hono()

authRouter.post('/login', async (c) => {
	const { email, password } = await c.req.json()

	const user = await auth.login(email, password)

	if (!user) {
		return c.json({ success: false }, 401)
	}

	const token = await sign(
		{
			email: user.email,
			user_id: user.user_id,
			exp: Math.floor(Date.now() / 1000) + 60 * 5,
		},
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
