const config = {
	// jwt
	jwtSecret: 'secret',

	// bloom
	bloomHost: 'localhost',
	bloomPort: 6380,
	bloomFilterName: 'siteIDFilter',
	bloomFilterErrorRate: 0.001,
	bloomFilterCapacity: 50000000,

	// pulsar
	pulsarServiceUrl: 'pulsar://localhost:6650',
	pulsarTopic: 'my-topic', // XXX: IMP learn about how many topics we need and how to structure them

	// database
	dbType: 'postgres',
	dbHost: 'localhost',
	dbPort: 5432,
	dbName: 'postgres',
	dbUser: 'postgres',
	dbPassword: 'password',
}

export default config
