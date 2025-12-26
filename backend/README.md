# SoK Research Dashboard - Backend API

Express-based REST API for the SoK Research Dashboard.

## Development

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for access token signing
- `JWT_REFRESH_SECRET`: Secret for refresh token signing
- `CORS_ORIGIN`: Allowed CORS origin
- `FRONTEND_URL`: Frontend URL
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)

## Bootstrap Admin

Create the first super admin user:

```bash
node src/scripts/bootstrap-admin.js
```

## API Documentation

See main README.md for API endpoint documentation.

