# Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Domain name configured (for production)
- SSL certificates (Let's Encrypt recommended for production)

## Production Deployment on Hetzner VPS

### 1. Server Setup

SSH into your Hetzner VPS and install Docker:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group (optional, to run docker without sudo)
sudo usermod -aG docker $USER
```

### 2. Clone Repository

```bash
git clone <your-repository-url>
cd SoK-Research-Dashboard
```

### 3. Environment Configuration

Copy the example environment file and edit it:

```bash
cp .env.example .env
nano .env
```

Update the following values:

```env
MONGODB_URI=mongodb://mongo:27017/sok_research
JWT_SECRET=<generate-strong-random-secret>
JWT_REFRESH_SECRET=<generate-strong-random-secret>
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
PORT=3000
```

Generate strong secrets:

```bash
# Generate random secrets
openssl rand -base64 32
openssl rand -base64 32
```

### 4. SSL Configuration (Optional but Recommended)

For production, set up SSL certificates. You can use Let's Encrypt:

```bash
# Install Certbot
sudo apt install certbot -y

# Obtain certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be in /etc/letsencrypt/live/yourdomain.com/
```

Update `nginx/nginx.conf` to use SSL (uncomment HTTPS server block and update paths).

### 5. Build and Start Services

```bash
# Build and start all containers
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Check container status
docker-compose ps
```

### 6. Bootstrap Super Admin

Create the first super admin user:

```bash
docker-compose exec api node src/scripts/bootstrap-admin.js
```

Follow the prompts to create the admin account.

### 7. Configure Firewall

Allow HTTP and HTTPS traffic:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 8. Verify Deployment

- Frontend: https://yourdomain.com (or http://yourdomain.com)
- API Health: https://yourdomain.com/api/health
- Login with the super admin account you created

## Updates and Maintenance

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Backup Database

```bash
# Create backup
docker-compose exec mongo mongodump --out /data/backup

# Copy backup from container
docker cp sok-mongo:/data/backup ./backup-$(date +%Y%m%d)

# Restore backup
docker-compose exec -T mongo mongorestore --archive < backup-archive
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f mongo
```

### Stop Services

```bash
docker-compose down
```

### Start Services

```bash
docker-compose up -d
```

## Troubleshooting

### Port Already in Use

If port 80 or 443 is already in use:

```bash
# Check what's using the port
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service or change ports in docker-compose.yml
```

### MongoDB Connection Issues

Check MongoDB logs:

```bash
docker-compose logs mongo
```

Verify MongoDB is running:

```bash
docker-compose ps mongo
```

### Frontend Not Loading

Check frontend logs:

```bash
docker-compose logs frontend
```

Verify nginx configuration:

```bash
docker-compose exec nginx nginx -t
```

### API Errors

Check API logs:

```bash
docker-compose logs api
```

Verify environment variables:

```bash
docker-compose exec api env | grep -E 'MONGODB|JWT|CORS'
```

## Security Recommendations

1. **Change default secrets**: Never use default JWT secrets in production
2. **Use HTTPS**: Always use SSL/TLS in production
3. **Regular updates**: Keep Docker images and system packages updated
4. **Firewall**: Only expose necessary ports (80, 443)
5. **Backups**: Regularly backup MongoDB data
6. **Monitoring**: Set up monitoring and alerting for the application
7. **Rate limiting**: Ensure rate limiting is enabled (configured in backend)

## Scaling

For higher traffic, consider:

- Using a managed MongoDB service (MongoDB Atlas)
- Adding more API instances behind a load balancer
- Using CDN for static assets
- Implementing Redis for session management

