# JHCIS Central Hub - Deployment Guide

## โครงสร้างระบบ

```
jhcis-central-hub/
├── api-backend/          # Node.js API Server
├── dashboard/            # Frontend Dashboard
├── database/              # SQL Schema
├── nginx/                 # Nginx Configuration
├── docker-compose.yml     # Docker Compose
├── .env.example           # Environment Variables
└── deploy/                 # Deployment Scripts
```

## การ Deploy

### ขั้นตอนที่ 1: เตรียม Server

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create directory
sudo mkdir -p /opt/jhcis-central-hub
cd /opt/jhcis-central-hub
```

### ขั้นตอนที่ 2: Clone หรือ Copy โค้ด

```bash
# ถ้าใช้ git
git clone https://github.com/your-repo/jhcis-central-hub.git .

# หรือ copy files ด้วย scp
scp -r ./jhcis-central-hub/* user@server:/opt/jhcis-central-hub/
```

### ขั้นตอนที่ 3: ตั้งค่า Environment

```bash
# Copy .env.example เป็น .env
cp .env.example .env

# แก้ไข .env
nano .env
```

แก้ไขค่าเหล่านี้:
```env
DB_ROOT_PASSWORD=your_secure_password_here
DB_USER=jhcis
DB_PASSWORD=your_secure_db_password
JWT_SECRET=your_jwt_secret_here
API_KEY_SALT=your_api_key_salt_here
```

### ขั้นตอนที่ 4: SSL Certificate (HTTPS)

```bash
# สร้างโฟลเดอร์ ssl
mkdir -p nginx/ssl

# ถ้าใช้ Let's Encrypt (ฟรี)
sudo apt install certbot
sudo certbot certonly --standalone -d ubonlocal.phoubon.in.th

# Copy certificates
sudo cp /etc/letsencrypt/live/ubonlocal.phoubon.in.th/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/ubonlocal.phoubon.in.th/privkey.pem nginx/ssl/key.pem
```

### ขั้นตอนที่ 5: เริ่มระบบ

```bash
# Build and start
docker-compose up -d --build

# ตรวจสอบสถานะ
docker-compose ps

# ดู logs
docker-compose logs -f api
```

### ขั้นตอนที่ 6: ตรวจสอบ

```bash
# Health check
curl http://localhost:9021/health

# API check
curl http://localhost:9021/api/v1/queries/op
```

## การใช้งาน

### Endpoint หลัก

| Endpoint | รายละเอียด |
|----------|------------|
| `http://ubonlocal.phoubon.in.th/api/v1/sync` | Sync API |
| `http://ubonlocal.phoubon.in.th/api/v1/import/upload` | Import ZIP |
| `http://ubonlocal.phoubon.in.th/api/v1/dashboard` | Dashboard |
| `http://ubonlocal.phoubon.in.th/api/v1/queries` | Query Management |

### Health Facilities API Keys

```bash
# เพิ่ม facility ใหม่
curl -X POST http://localhost:9021/api/v1/admin/facilities \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your_admin_key" \
  -d '{"hcode": "03634", "facility_name": "รพ.สต.สมุย"}'
```

## การ Backup

```bash
# Backup database
docker-compose exec mysql mysqldump -u root -p jhcis_central > backup_$(date +%Y%m%d).sql

# Backup volumes
docker-compose exec mysql tar -czf /tmp/mysql_backup.tar.gz /var/lib/mysql
docker cp jhcis-mysql:/tmp/mysql_backup.tar.gz ./mysql_backup_$(date +%Y%m%d).tar.gz
```

## การ Restore

```bash
# Restore database
docker-compose exec -T mysql mysql -u root -p jhcis_central < backup.sql
```

## การอัพเดท

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

### API ไม่ทำงาน
```bash
# ตรวจสอบ logs
docker-compose logs api

# Restart
docker-compose restart api
```

### Database ไม่เชื่อมต่อ
```bash
# ตรวจสอบ MySQL status
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"

# ตรวจสอบ connection
docker-compose exec api ping mysql
```

### SSL ไม่ทำงาน
```bash
# ตรวจสอบ certificates
docker-compose exec nginx ls -la /etc/nginx/ssl/

# Test SSL
curl -k https://ubonlocal.phoubon.in.th/health
```

## Security Recommendations

1. **เปลี่ยน default passwords** ทั้งหมด
2. **ใช้ SSL/HTTPS** เสมอ
3. **Limit API access** ด้วย firewall
4. **Regular backups** ทุกวัน
5. **Monitor logs** ตลอดเวลา
6. **Update dependencies** เป็นประจำ