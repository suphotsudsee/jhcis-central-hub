# Quick Start - Deploy to ubonlocal.phoubon.in.th

## Step 1: Package ไฟล์ (บนเครื่อง Development)

```powershell
cd C:\fullstack\jhcis-central-hub
deploy\package.bat
```

## Step 2: Upload ไปยัง Server

```powershell
# Using SCP (ต้องมี SSH access)
scp jhcis-central-hub-*.zip user@ubonlocal.phoubon.in.th:/tmp/

# หรือใช้ WinSCP/FileZilla อัพโหลดไฟล์ไปยัง /tmp/
```

## Step 3: SSH เข้า Server

```bash
ssh user@ubonlocal.phoubon.in.th
```

## Step 4: Extract และ Deploy

```bash
# Create directory
sudo mkdir -p /opt/jhcis-central-hub
cd /opt/jhcis-central-hub

# Extract
sudo unzip /tmp/jhcis-central-hub-*.zip

# Run deploy script
chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh
```

## Step 5: ตรวจสอบ

```bash
# ตรวจสอบ containers
docker-compose ps

# ตรวจสอบ logs
docker-compose logs -f api

# ตรวจสอบ health
curl http://localhost:9021/health
```

## Step 6: ตั้งค่า Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

## Step 7: เพิ่ม Health Facilities

```bash
# เพิ่ม facility ใหม่
curl -X POST http://localhost:9021/api/v1/admin/facilities \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{"hcode": "03633", "facility_name": "รพ.สต.ตบหู"}'

# ดู facilities ทั้งหมด
curl http://localhost:9021/api/v1/admin/facilities
```

## Environment Variables

สร้างไฟล์ `.env`:

```env
# Database
DB_ROOT_PASSWORD=your_secure_root_password
DB_USER=jhcis
DB_PASSWORD=your_secure_db_password

# API
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
API_KEY_SALT=your_api_key_salt

# SSL (ถ้าใช้ Let's Encrypt)
SSL_CERT_PATH=/etc/letsencrypt/live/ubonlocal.phoubon.in.th/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/ubonlocal.phoubon.in.th/privkey.pem
```

## การอัพเดท

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## การ Backup

```bash
# Backup database
docker-compose exec mysql mysqldump -u root -p jhcis_central > backup_$(date +%Y%m%d).sql

# Backup uploads
docker cp jhcis-api:/app/uploads ./uploads_backup_$(date +%Y%m%d)
```

## URLs

| Service | URL |
|---------|-----|
| API | http://ubonlocal.phoubon.in.th/api/v1 |
| Health | http://ubonlocal.phoubon.in.th/health |
| Dashboard | http://ubonlocal.phoubon.in.th/ |

## Troubleshooting

### API ไม่ทำงาน

```bash
# ตรวจสอบ logs
docker-compose logs -f api

# Restart
docker-compose restart api
```

### Database Connection Failed

```bash
# ตรวจสอบ MySQL
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"

# Restart MySQL
docker-compose restart mysql
```

### SSL Certificate Error

```bash
# Renew certificate
sudo certbot renew

# Copy new certificates
sudo cp /etc/letsencrypt/live/ubonlocal.phoubon.in.th/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/ubonlocal.phoubon.in.th/privkey.pem nginx/ssl/key.pem

# Restart nginx
docker-compose restart nginx
```