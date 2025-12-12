# Order Synchronization Service

A backend service responsible for synchronizing orders from an external API with a linked MongoDB instance. The service exposes REST endpoints for fetching orders and provides Swagger documentation.

## Used technologies:

- Node.js + TS
- Express.js 4
- MongoDB + Mongoose
- Zod + zod-to-openapi
- Pino
- Jest
- Swagger

## How to start project:

1. Install dependencies

```
npm install
```

2. Create .env file in main folder with following fields

   - NODE_ENV (production or development)
   - PORT
   - MONGO_URI
   - SYNC_INTERVAL_IN_MINUTES
   - API_KEY
   - IDOSELL_API_KEY

3. Start application:

```
npm run dev
npm run prod
```

## To run tests:

```
npm run test
```

## Documentation

http://localhost:{PORT}/docs
