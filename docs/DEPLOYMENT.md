# 🚀 Deployment Guide

## Merit-Misconduct System - Production Deployment

---

## 📋 Pre-Deployment Checklist

- [ ] Node.js v18+ installed on server
- [ ] Domain & SSL certificate ready
- [ ] Database backup strategy
- [ ] Environment variables secured
- [ ] Firewall rules configured
- [ ] Monitoring tools setup

---

## 🔧 Backend Deployment

### 1. Prepare Production Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Clone & Setup Backend

```bash
# Clone repository
cd /var/www
git clone <your-repo-url> merit-misconduct
cd merit-misconduct/backend

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
nano .env
```

Edit `.env` for production:
```env
DATABASE_URL="file:./production.db"
JWT_SECRET="use-strong-random-secret-here"
JWT_EXPIRES_IN="7d"
PORT=3001
CORS_ORIGIN="https://yourdomain.com"
NODE_ENV="production"
```

### 3. Database Migration

```bash
npm run prisma:generate
npm run prisma:migrate deploy
```

### 4. Seed Initial Data

```bash
npx tsx prisma/seed.ts
```

### 5. Build Backend

```bash
npm run build
```

### 6. Start with PM2

```bash
pm2 start dist/index.js --name merit-backend
pm2 save
pm2 startup
```

---

## 🎨 Frontend Deployment

### 1. Build Frontend

```bash
cd /var/www/merit-misconduct/frontend

# Install dependencies
npm install

# Create production .env
cp .env.example .env
nano .env
```

Edit `.env`:
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
```

```bash
# Build for production
npm run build
```

### 2. Copy Build to Nginx

```bash
sudo cp -r dist/* /var/www/html/merit-misconduct/
```

---

## 🌐 Nginx Configuration

### Backend Proxy

```bash
sudo nano /etc/nginx/sites-available/merit-backend
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Socket.IO support
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Frontend Configuration

```bash
sudo nano /etc/nginx/sites-available/merit-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/html/merit-misconduct;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Enable sites:
```bash
sudo ln -s /etc/nginx/sites-available/merit-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/merit-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate

```bash
# Backend
sudo certbot --nginx -d api.yourdomain.com

# Frontend
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 💾 Database Backup

### Automated Backup Script

```bash
sudo nano /usr/local/bin/backup-merit-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/merit-system"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="/var/www/merit-misconduct/backend/production.db"

mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/db_backup_$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.db" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
sudo chmod +x /usr/local/bin/backup-merit-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-merit-db.sh
```

---

## 📊 Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs merit-backend

# Monitor processes
pm2 monit

# View status
pm2 status

# Restart
pm2 restart merit-backend
```

### Nginx Access Logs

```bash
# View access logs
tail -f /var/log/nginx/access.log

# View error logs
tail -f /var/log/nginx/error.log
```

---

## 🔄 Update Deployment

```bash
cd /var/www/merit-misconduct

# Pull latest code
git pull origin main

# Backend update
cd backend
npm install --production
npm run build
pm2 restart merit-backend

# Frontend update
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/html/merit-misconduct/

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🐳 Docker Deployment (Alternative)

### Dockerfile (Backend)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run prisma:generate
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=file:./production.db
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
    volumes:
      - ./backend/production.db:/app/production.db
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always
```

Deploy with Docker:
```bash
docker-compose up -d
```

---

## 🔐 Security Hardening

1. **Firewall**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **Fail2Ban**
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

3. **Regular Updates**
```bash
sudo apt update && sudo apt upgrade -y
```

---

## 📞 Support & Maintenance

- Monitor PM2 dashboard daily
- Check disk space weekly
- Review logs for errors
- Test backup restoration monthly
- Update dependencies quarterly
- Review SSL certificate expiry

---

**Deployment Completed! 🎉**

Access:
- Frontend: https://yourdomain.com
- Backend API: https://api.yourdomain.com/api
- Health Check: https://api.yourdomain.com/health
