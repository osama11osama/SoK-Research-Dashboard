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

## Quick Start (Local Development)

### Prerequisites

- Docker Desktop installed
- Node.js 20+ installed
- npm installed

### One-Command Setup

Simply run:

```powershell
.\setup-local.ps1
```

This script will:
1. ✅ Check prerequisites (Docker, Node.js, npm)
2. ✅ Create/start MongoDB container with name `sok-research-mongodb-local`
3. ✅ Install backend and frontend dependencies
4. ✅ Start backend server (port 3000)
5. ✅ Start frontend server (port 4200)
6. ✅ Open browser automatically

The MongoDB container uses a recognizable name: **`sok-research-mongodb-local`** (different from docker-compose containers).

### Seed Initial Papers

After setting up, you can seed the database with 22 foundational papers:

```bash
cd backend
npm run seed-papers
```

Or use the complete setup script (creates admin + seeds papers):
```bash
cd backend
npm run setup
```

See [SEED_DATA.md](SEED_DATA.md) for details about the initial papers.

### Stop Services

```powershell
.\stop-local.ps1
```

Or manually:
- Close the PowerShell windows for Backend and Frontend
- Stop MongoDB: `docker stop sok-research-mongodb-local`

### Create Super Admin

The first user to register automatically becomes SUPER_ADMIN, or use:

```powershell
cd backend
node src/scripts/bootstrap-admin.js
```

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

## Production Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete deployment instructions on SaarMove infrastructure.

The deployment guide includes:
- [DNS configuration](DEPLOYMENT.md#step-1-dns-configuration-at-namecom)
- [Clone project repository](DEPLOYMENT.md#step-2-clone-project-repository)
- [Create Docker network](DEPLOYMENT.md#step-3-create-docker-network)
- [Create project directory and files](DEPLOYMENT.md#step-4-create-project-directory-and-files)
  - [docker-compose.prod.yml](DEPLOYMENT.md#41-create-docker-composeprodyml)
  - [.env file](DEPLOYMENT.md#42-create-env-file)
- [Create Nginx configuration](DEPLOYMENT.md#step-5-create-nginx-configuration)
- [Update main docker-compose.yml](DEPLOYMENT.md#step-6-update-main-docker-composeyml)
- [Test Nginx configuration](DEPLOYMENT.md#step-7-test-nginx-configuration)
- [Obtain SSL certificate](DEPLOYMENT.md#step-8-obtain-ssl-certificate)
- [Reload Nginx](DEPLOYMENT.md#step-9-reload-nginx)
- [Build and start services](DEPLOYMENT.md#step-10-build-and-start-services)
- [Connect Nginx to network](DEPLOYMENT.md#step-11-connect-nginx-to-network)
- [Verify deployment](DEPLOYMENT.md#step-12-verify-deployment)
- [Create super admin](DEPLOYMENT.md#step-13-create-super-admin)
- [Seed initial papers](DEPLOYMENT.md#step-14-seed-initial-papers-optional)
- [Verification checklist](DEPLOYMENT.md#verification-checklist)
- [Troubleshooting guide](DEPLOYMENT.md#troubleshooting)
- [Updating the application](DEPLOYMENT.md#updating-the-application)
- [File locations summary](DEPLOYMENT.md#file-locations-summary)

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

### Local Development
- MongoDB container: `sok-research-mongodb-local` (easily recognizable)
- Runs on localhost ports

### Production Deployment
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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

See LICENSE file for details.

## Support

For issues and questions, please open an issue in the repository.
