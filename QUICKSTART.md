# Quick Start Guide

Get the SoK Research Dashboard running in minutes!

## Option 1: Docker (Recommended for Production)

```bash
# 1. Clone and navigate
git clone <repository-url>
cd SoK-Research-Dashboard

# 2. Configure environment
cp .env.example .env
# Edit .env with your values (at minimum, change JWT secrets)

# 3. Start everything
docker-compose up -d --build

# 4. Create admin user
docker-compose exec api node src/scripts/bootstrap-admin.js

# 5. Access the app
# Open http://localhost in your browser
```

## Option 2: Local Development

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: MONGODB_URI=mongodb://localhost:27017/sok_research

# Start MongoDB (if not running)
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Start backend
npm run dev
# API runs on http://localhost:3000
```

### Frontend Setup

```bash
cd frontend/sok-frontend
npm install
npm install -D tailwindcss postcss autoprefixer

# Start frontend
npm start
# Frontend runs on http://localhost:4200
```

### Create Admin User & Seed Papers

**Option 1: Register first user (becomes SUPER_ADMIN)**
- Register at `/register` - first user automatically becomes SUPER_ADMIN

**Option 2: Use bootstrap script**
```bash
cd backend
npm run bootstrap-admin
```

**Option 3: Complete setup (admin + seed papers)**
```bash
cd backend
npm run setup
```

**Seed Initial Papers (22 papers)**
```bash
cd backend
npm run seed-papers
```

The seed script adds 22 foundational papers on browser extension security, properly categorized with tags and SoK metadata. See [SEED_DATA.md](SEED_DATA.md) for details.

## First Steps

1. **Login** with your admin account
2. **Register users** (or have them self-register)
3. **Approve users** in the Admin panel
4. **Add papers** to start your research collection
5. **Add notes** (public or private) to papers

## Default Routes

- `/login` - Login page
- `/register` - Registration page
- `/app/papers` - Main papers dashboard
- `/app/papers/:id` - Paper detail page
- `/app/admin/users` - User management (Super Admin only)

## Need Help?

- See [README.md](README.md) for full documentation
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guide
- Check logs: `docker-compose logs -f`

