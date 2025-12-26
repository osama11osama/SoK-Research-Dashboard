# SoK Research Dashboard

A web-based research dashboard designed to support a Systematization of Knowledge (SoK) workflow for academic research in web security (initially browser extensions). The system allows multiple approved users to collaboratively collect, categorize, and annotate research papers, while maintaining strict role-based access control and privacy guarantees.

## Features

- **User Management**: Controlled registration with manual approval by Super Admin
- **Role-Based Access Control**: Three user roles with fine-grained permissions
- **Paper Management**: Add, view, and manage research papers with SoK-structured metadata
- **Note System**: Public and private notes with visibility controls
- **Statistics Dashboard**: Overview of papers, notes, and user statistics
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **Docker Deployment**: Containerized system ready for Hetzner VPS deployment

## Tech Stack

- **Frontend**: Angular 17 with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Reverse Proxy**: Nginx
- **Containerization**: Docker & Docker Compose

## User Roles

### SUPER_ADMIN
- Single user (project owner)
- Full system access
- Approves or rejects user registrations
- Assigns roles to users
- Can see all data, including private notes and paper creators
- Can edit and delete papers

### REVIEWER_VIEW
- Can view papers, metadata, statistics, and public notes
- Cannot add public notes
- Can add PRIVATE notes (visible only to themselves)

### REVIEWER_NOTE
- Can view papers and metadata
- Can add PUBLIC and PRIVATE notes
- Cannot edit or delete papers

## Account Lifecycle

1. User registers with username + password + display name
2. Account is created with status = PENDING
3. Login is blocked until SUPER_ADMIN approval
4. SUPER_ADMIN approves account and assigns role
5. User can then log in and access allowed features

Account states: PENDING, APPROVED, REJECTED, DISABLED

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development)

### Production Deployment

1. Clone the repository:
```bash
git clone <repository-url>
cd SoK-Research-Dashboard
```

2. Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your production values
```

3. Build and start all services:
```bash
docker-compose up -d --build
```

4. Create the first Super Admin user:
```bash
docker-compose exec api node src/scripts/bootstrap-admin.js
```

5. Access the application:
- Frontend: http://your-domain.com
- API: http://your-domain.com/api

### Local Development

#### Backend

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Update `.env` with local MongoDB URI:
```
MONGODB_URI=mongodb://localhost:27017/sok_research
```

5. Start MongoDB (if not running):
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Or use your local MongoDB installation
```

6. Start the development server:
```bash
npm run dev
```

The API will be available at http://localhost:3000

#### Frontend

1. Navigate to frontend directory:
```bash
cd frontend/sok-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Install Tailwind CSS dependencies:
```bash
npm install -D tailwindcss postcss autoprefixer
```

4. Start the development server:
```bash
npm start
```

The frontend will be available at http://localhost:4200

### Bootstrap Super Admin

If no users exist in the database, the first user to register will automatically become a SUPER_ADMIN with APPROVED status.

Alternatively, you can use the bootstrap script:

```bash
# In production (Docker)
docker-compose exec api node src/scripts/bootstrap-admin.js

# In development
cd backend
node src/scripts/bootstrap-admin.js
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Papers
- `GET /api/papers` - Get all papers
- `GET /api/papers/:id` - Get single paper
- `POST /api/papers` - Create paper (any approved user)
- `PATCH /api/papers/:id` - Update paper (SUPER_ADMIN only)
- `DELETE /api/papers/:id` - Delete paper (SUPER_ADMIN only)

### Notes
- `GET /api/papers/:paperId/notes` - Get notes for a paper
- `POST /api/papers/:paperId/notes` - Create note (REVIEWER_NOTE or SUPER_ADMIN)

### Admin
- `GET /api/admin/users` - Get all users (with optional status filter)
- `GET /api/admin/users/:id` - Get single user
- `POST /api/admin/users/:id/approve` - Approve user
- `POST /api/admin/users/:id/reject` - Reject user
- `POST /api/admin/users/:id/disable` - Disable user
- `PATCH /api/admin/users/:id/role` - Update user role

### Statistics
- `GET /api/stats/overview` - Get overview statistics

## Database Schema

### Users Collection
- `username` (unique, lowercase)
- `passwordHash` (bcrypt hash)
- `displayName`
- `role` (SUPER_ADMIN | REVIEWER_VIEW | REVIEWER_NOTE)
- `status` (PENDING | APPROVED | REJECTED | DISABLED)
- `createdAt`
- `approvedAt`
- `approvedByUserId`

### Papers Collection
- `title`
- `authors`
- `venue`
- `year`
- `link`
- `readingStatus` (TO_READ | IN_PROGRESS | READ)
- `tags` (array)
- `sok` (object with category, method, threatModel, dataset, keyFindings, limitations, reproducibility)
- `createdByUserId`
- `createdAt`
- `updatedAt`

### Notes Collection
- `paperId`
- `authorUserId`
- `visibility` (PRIVATE | PUBLIC)
- `content`
- `createdAt`
- `updatedAt`

## Security

- HTTPS enforced (configure in nginx for production)
- Passwords stored as bcrypt hashes
- JWT-based authentication with short-lived access tokens
- Refresh tokens via HttpOnly cookies
- Role-based access control enforced on all endpoints
- Input validation on all endpoints
- Rate limiting on authentication endpoints
- CORS restricted to frontend domain

## Docker Configuration

The application consists of four containers:

1. **mongo**: MongoDB database with persistent volume
2. **api**: Node.js Express backend
3. **frontend**: Angular application served via Nginx
4. **nginx**: Reverse proxy for routing requests

### Environment Variables

See `.env.example` for required environment variables. Key variables:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for access token signing
- `JWT_REFRESH_SECRET`: Secret for refresh token signing
- `CORS_ORIGIN`: Allowed CORS origin
- `FRONTEND_URL`: Frontend URL for redirects

## Deployment on Hetzner VPS

1. Set up your Hetzner VPS with Docker and Docker Compose
2. Clone the repository to your server
3. Configure environment variables in `.env`
4. Set up SSL certificates (Let's Encrypt recommended)
5. Update nginx configuration for HTTPS
6. Build and start containers: `docker-compose up -d --build`
7. Bootstrap the first admin user
8. Configure firewall to allow ports 80 and 443

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

See LICENSE file for details.

## Support

For issues and questions, please open an issue in the repository.
