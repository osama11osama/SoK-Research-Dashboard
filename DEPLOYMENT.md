# Deployment Guide: SoK Research Dashboard

Complete deployment guide for the SoK Research Dashboard on SaarMove infrastructure.

## 📋 Prerequisites

- Server with existing SaarMove infrastructure running
- SSH access to the server
- Domain `sok.saarmove.com` DNS A record pointing to server IP
- Access to `saarmove-infrastructure` repository

## 🎯 Overview

This deployment follows the existing SaarMove infrastructure pattern:
1. DNS configuration at name.com
2. Clone project repository to `~/sok-research-app/`
3. Create Docker network: `sok-research-network`
4. Create `docker-compose.prod.yml` in `projects/sok-research/`
5. Create Nginx configuration in `nginx/conf.d/40-sok.conf`
6. Update main `docker-compose.yml` to include the network
7. Build and start services (containers must exist before nginx can resolve them)
8. Connect nginx to network
9. Test nginx configuration
10. Obtain SSL certificate
11. Deploy and verify

---

## Step 1: DNS Configuration at name.com

1. Log in to your **name.com** account
2. Navigate to **DNS Management** for `saarmove.com`
3. Add a new **A Record**:
   - **Type**: A
   - **Host/Name**: `sok`
   - **Answer/Points to**: `YOUR_SERVER_IP`
   - **TTL**: 3600

4. Wait 5-30 minutes for DNS propagation

Verify DNS:
```bash
nslookup sok.saarmove.com
# Should return your server IP
```

---

## Step 2: Clone Project Repository

SSH into your server and clone the repository:

```bash
# Navigate to home directory
cd ~

# Clone the repository (use your actual repository URL)
git clone <your-repo-url> sok-research-app

# Verify structure
cd sok-research-app
ls -la
# Should show: backend/ frontend/ README.md etc.
```

---

## Step 3: Create Docker Network

```bash
# Create the network
docker network create sok-research-network

# Verify it was created
docker network ls | grep sok-research
```

---

## Step 4: Create Project Directory and Files

```bash
# Navigate to infrastructure projects directory
cd ~/saarmove-infrastructure/projects

# Create project directory
mkdir sok-research
cd sok-research
```

### 4.1 Create docker-compose.prod.yml

Create `docker-compose.prod.yml` with the following content:

```yaml
services:
  # MongoDB Database
  mongodb:
    image: mongo:7.0
    container_name: sok-research-mongodb
    restart: unless-stopped
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
    environment:
      - MONGO_INITDB_DATABASE=sok_research
    networks:
      - sok-research-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 40s

  # Backend API
  backend:
    build:
      context: ../../../sok-research-app/backend
      dockerfile: Dockerfile
    container_name: sok-research-backend
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/sok_research
      - PORT=3000
      - NODE_ENV=production
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - sok-research-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Frontend
  frontend:
    build:
      context: ../../../sok-research-app/frontend/sok-frontend
      dockerfile: Dockerfile
    container_name: sok-research-frontend
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - sok-research-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

volumes:
  mongodb_data:
    driver: local
  mongodb_config:
    driver: local

networks:
  sok-research-network:
    external: true
```

### 4.2 Create .env File

Create `.env` file in the same directory:

```bash
nano .env
```

Add the following content:

```env
# MongoDB URI (this is overridden by docker-compose environment, but kept here for reference)
MONGODB_URI=mongodb://mongodb:27017/sok_research

# JWT Secrets - GENERATE THESE FIRST (see below)
JWT_SECRET=REPLACE_WITH_GENERATED_SECRET
JWT_REFRESH_SECRET=REPLACE_WITH_GENERATED_SECRET

# Frontend and CORS Configuration
CORS_ORIGIN=https://sok.saarmove.com
FRONTEND_URL=https://sok.saarmove.com

# Environment
NODE_ENV=production
PORT=3000
```

**⚠️ IMPORTANT**: Generate JWT secrets before deploying:

```bash
openssl rand -base64 32
openssl rand -base64 32
```

Copy each output and replace `REPLACE_WITH_GENERATED_SECRET` in the `.env` file.

---

## Step 5: Create Nginx Configuration

```bash
cd ~/saarmove-infrastructure/nginx/conf.d
nano 40-sok.conf
```

Create the Nginx configuration. **Initially, we'll create it without HTTPS** (commented out) so nginx can start and serve the ACME challenge:

```nginx
# SoK Research Dashboard Configuration
server {
    listen 80;
    server_name sok.saarmove.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Temporarily comment out HTTPS redirect until we get the certificate
    # return 301 https://$host$request_uri;
    
    # Temporary: serve HTTP until SSL certificate is obtained
    location / {
        limit_req zone=general_limit burst=50 nodelay;
        proxy_pass http://sok-research-frontend:80;
        include /etc/nginx/snippets/proxy-headers.conf;
    }

    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://sok-research-backend:3000/api/;
        include /etc/nginx/snippets/proxy-headers.conf;
    }
}

# HTTPS server block - uncomment after obtaining SSL certificate
# server {
#     listen 443 ssl;
#     http2 on;
#     server_name sok.saarmove.com;
#
#     ssl_certificate /etc/letsencrypt/live/sok.saarmove.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/sok.saarmove.com/privkey.pem;
#     
#     include /etc/nginx/snippets/ssl-common.conf;
#     include /etc/nginx/snippets/security-headers.conf;
#
#     location / {
#         limit_req zone=general_limit burst=50 nodelay;
#         proxy_pass http://sok-research-frontend:80;
#         include /etc/nginx/snippets/proxy-headers.conf;
#     }
#
#     location /api/ {
#         limit_req zone=api_limit burst=20 nodelay;
#         proxy_pass http://sok-research-backend:3000/api/;
#         include /etc/nginx/snippets/proxy-headers.conf;
#     }
# }
```

**Note**: File naming follows the pattern `40-sok.conf` (40 for new projects, ascending from 10, 20, 30).

---

## Step 6: Update Main docker-compose.yml

Edit `~/saarmove-infrastructure/docker-compose.yml`:

```bash
cd ~/saarmove-infrastructure
nano docker-compose.yml
```

Add `sok-research-network` to the nginx service networks:

```yaml
services:
  nginx:
    # ... existing config ...
    networks:
      - infrastructure-network
      - saarmove-network
      - saarlink-network
      - pistazien-network
      - sok-research-network  # Add this line

networks:
  # ... existing networks ...
  sok-research-network:  # Add this section
    external: true
```

---

## Step 7: Build and Start Services (Before Testing Nginx)

**Important**: You must build and start the services first, so the containers exist on the network before nginx tries to connect to them.

```bash
cd ~/saarmove-infrastructure/projects/sok-research
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Step 8: Connect Nginx to Network

```bash
docker network connect sok-research-network saarmove-nginx-prod

# Verify connection
docker network inspect sok-research-network | grep nginx
```

---

## Step 9: Test Nginx Configuration (Initial - HTTP Only)

Now test the nginx configuration (it should work since we're using HTTP only initially):

```bash
cd ~/saarmove-infrastructure
docker compose exec nginx nginx -t
```

If there are errors, fix them before proceeding.

**Note**: The config test will show warnings about SSL stapling for other domains - these are normal and can be ignored.

---

## Step 10: Obtain SSL Certificate

```bash
# Make sure nginx is running
cd ~/saarmove-infrastructure
docker compose up -d nginx

# Create certbot webroot directory (must match the mount path in docker-compose.yml)
mkdir -p ~/saarmove-infrastructure/certbot/www

# Request SSL certificate using webroot method
# Note: Use the host path that's mounted to /var/www/certbot in nginx container
sudo certbot certonly --webroot \
  -w /home/admin/saarmove-infrastructure/certbot/www \
  -d sok.saarmove.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email
```

**⚠️ IMPORTANT**: After obtaining the certificate:

1. Check certificate path (in case certbot added a suffix like `-0001`):
   ```bash
   ls -la /etc/letsencrypt/live/ | grep sok
   ```

2. Update the nginx configuration to enable HTTPS:
   ```bash
   nano ~/saarmove-infrastructure/nginx/conf.d/40-sok.conf
   ```
   
   - Uncomment the HTTPS server block
   - Update SSL certificate paths if certbot added a suffix (e.g., `sok.saarmove.com-0001`)
   - Uncomment the HTTP to HTTPS redirect line: `return 301 https://$host$request_uri;`
   - Comment out or remove the temporary HTTP location blocks

   Final configuration should look like:
   ```nginx
   # SoK Research Dashboard Configuration
   server {
       listen 80;
       server_name sok.saarmove.com;

       location /.well-known/acme-challenge/ {
           root /var/www/certbot;
       }

       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       http2 on;
       server_name sok.saarmove.com;

       ssl_certificate /etc/letsencrypt/live/sok.saarmove.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/sok.saarmove.com/privkey.pem;
       
       include /etc/nginx/snippets/ssl-common.conf;
       include /etc/nginx/snippets/security-headers.conf;

       location / {
           limit_req zone=general_limit burst=50 nodelay;
           proxy_pass http://sok-research-frontend:80;
           include /etc/nginx/snippets/proxy-headers.conf;
       }

       location /api/ {
           limit_req zone=api_limit burst=20 nodelay;
           proxy_pass http://sok-research-backend:3000/api/;
           include /etc/nginx/snippets/proxy-headers.conf;
       }
   }
   ```

---

## Step 11: Update Nginx Configuration for HTTPS

After obtaining the SSL certificate, update the nginx configuration to enable HTTPS (see Step 10 notes above).

Then test and reload:

```bash
# Test the updated configuration
cd ~/saarmove-infrastructure
docker compose exec nginx nginx -t

# If test passes, reload nginx
docker compose exec nginx nginx -s reload
```

---

## Step 12: Verify Deployment

```bash
# Check container status
docker ps | grep sok-research

# Check logs
docker logs sok-research-backend
docker logs sok-research-frontend
docker logs sok-research-mongodb

# Test connectivity from nginx
docker exec saarmove-nginx-prod wget --spider http://sok-research-frontend:80
docker exec saarmove-nginx-prod wget --spider http://sok-research-backend:3000/health

# Test from command line
curl -I http://sok.saarmove.com
curl -I https://sok.saarmove.com
curl https://sok.saarmove.com/api/health
```

---

## Step 13: Create Super Admin

```bash
docker exec sok-research-backend node src/scripts/bootstrap-admin.js
```

Follow the prompts to create your admin account.

---

## Step 14: Seed Initial Papers (Optional)

```bash
docker exec sok-research-backend npm run seed-papers
```

---

## ✅ Verification Checklist

- [ ] DNS A record added at name.com
- [ ] Project repository cloned to `~/sok-research-app/`
- [ ] Docker network `sok-research-network` created
- [ ] `docker-compose.prod.yml` created in `projects/sok-research/`
- [ ] `.env` file created with all required variables (including generated JWT secrets)
- [ ] Nginx configuration `40-sok.conf` created
- [ ] Main `docker-compose.yml` updated with network
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] SSL certificate obtained
- [ ] SSL certificate paths updated in nginx config if needed
- [ ] Nginx reloaded
- [ ] Services built and started
- [ ] Nginx connected to `sok-research-network`
- [ ] All containers healthy
- [ ] Website accessible at `https://sok.saarmove.com`
- [ ] API health endpoint working
- [ ] Super admin account created

---

## 🚨 Troubleshooting

### Issue: 502 Bad Gateway

**Solution:**
```bash
# Check containers are running
docker ps | grep sok-research

# Check network connectivity
docker network inspect sok-research-network

# Ensure nginx is on network
docker network connect sok-research-network saarmove-nginx-prod

# Restart nginx
cd ~/saarmove-infrastructure
docker compose restart nginx
```

### Issue: Build context path not found

**Solution:**
- Verify repository is at `~/sok-research-app/`
- Check build context paths in `docker-compose.prod.yml`:
  - From `projects/sok-research/` to `~/sok-research-app/backend/`
  - Should be: `../../../sok-research-app/backend`

### Issue: SSL certificate not found

**Solution:**
```bash
# Check certificate exists
ls -la /etc/letsencrypt/live/ | grep sok

# If certificate has suffix (e.g., -0001), update nginx config
nano ~/saarmove-infrastructure/nginx/conf.d/40-sok.conf
# Update ssl_certificate paths to match actual certificate directory

# Reload nginx
docker exec saarmove-nginx-prod nginx -s reload
```

### Issue: Container can't connect to MongoDB

**Solution:**
```bash
# Check MongoDB container is running and healthy
docker ps | grep sok-research-mongodb
docker logs sok-research-mongodb

# Verify MongoDB URI in .env and docker-compose.prod.yml
# Should be: mongodb://mongodb:27017/sok_research
# Note: service name is "mongodb" (from docker-compose), not "sok-research-mongodb"
```

---

## 🔄 Updating the Application

### Pull Latest Changes

```bash
# Pull infrastructure changes
cd ~/saarmove-infrastructure
git pull

# Pull application changes
cd ~/sok-research-app
git pull
```

### Rebuild and Restart

```bash
cd ~/saarmove-infrastructure/projects/sok-research
docker compose -f docker-compose.prod.yml up -d --build
```

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker logs sok-research-backend -f
docker logs sok-research-frontend -f
```

---

## 📁 File Locations Summary

| File | Location |
|------|----------|
| Repository | `~/sok-research-app/` |
| Docker Compose | `~/saarmove-infrastructure/projects/sok-research/docker-compose.prod.yml` |
| Environment File | `~/saarmove-infrastructure/projects/sok-research/.env` |
| Nginx Config | `~/saarmove-infrastructure/nginx/conf.d/40-sok.conf` |
| Main Docker Compose | `~/saarmove-infrastructure/docker-compose.yml` |

## 🔑 Key Container Names

- `sok-research-backend`
- `sok-research-frontend`
- `sok-research-mongodb`
- Network: `sok-research-network`

---

## 🎉 Success!

Your SoK Research Dashboard is now deployed and accessible at `https://sok.saarmove.com`!
