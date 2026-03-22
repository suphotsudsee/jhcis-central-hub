# คู่มือติดตั้งและดูแลเซิร์ฟเวอร์ส่วนกลาง
# Central Server Deployment Guide

## สารบัญ (Table of Contents)

1. [ข้อกำหนดระบบ (System Requirements)](#1-ข้อกำหนดระบบ-system-requirements)
2. [ติดตั้ง API Backend (Node.js)](#2-ติดตั้ง-api-backend-nodejs)
3. [ติดตั้ง Database (PostgreSQL/MariaDB)](#3-ติดตั้ง-database)
4. [ติดตั้ง Dashboard](#4-ติดตั้ง-dashboard)
5. [ตั้งค่า HTTPS/SSL Certificate](#5-ตั้งค่า-httpsssl-certificate)
6. [ตั้งค่า Firewall Rules](#6-ตั้งค่า-firewall-rules)
7. [Monitoring และ Alerting](#7-monitoring-และ-alerting)
8. [Backup และ Restore](#8-backup-และ-restore)
9. [Performance Tuning](#9-performance-tuning)
10. [Security Hardening](#10-security-hardening)

---

## 1. ข้อกำหนดระบบ (System Requirements)

### ฮาร์ดแวร์ (Hardware) - สำหรับ 80 หน่วย

| องค์ประกอบ | ข้อกำหนดขั้นต่ำ | ข้อกำหนดแนะนำ | Production |
|-----------|----------------|--------------|------------|
| CPU | 8 Cores | 16 Cores | 32 Cores+ |
| RAM | 16 GB | 32 GB | 64 GB+ |
| Storage | 500 GB SSD | 1 TB NVMe SSD | 2 TB+ RAID 10 |
| Network | 1 Gbps | 10 Gbps | 10 Gbps+ |
| Backup Storage | 1 TB | 2 TB | 4 TB+ |

### ซอฟต์แวร์ (Software)

| องค์ประกอบ | เวอร์ชัน | หมายเหตุ |
|-----------|---------|----------|
| OS | Ubuntu 22.04 LTS / CentOS 9 | หรือ Windows Server 2022 |
| Node.js | 18.x หรือสูงกว่า | LTS Version |
| Database | PostgreSQL 14+ / MariaDB 10.6+ | เลือกตามความเหมาะสม |
| Web Server | Nginx 1.20+ | Reverse Proxy |
| Process Manager | PM2 5.x | สำหรับ Node.js |

### เครือข่าย (Network)

- **Public IP:** อย่างน้อย 1 IP Address
- **Domain:** central-jhcis.moph.go.th (หรือโดเมนที่ได้รับ)
- **SSL Certificate:** Let's Encrypt หรือ Commercial SSL
- **Bandwidth:** อย่างน้อย 100 Mbps (แนะนำ 1 Gbps)

---

## 2. ติดตั้ง API Backend (Node.js)

### 2.1 ติดตั้ง Node.js

```bash
# สำหรับ Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# ตรวจสอบเวอร์ชัน
node --version
npm --version
```

```powershell
# สำหรับ Windows Server
# ดาวน์โหลดจาก https://nodejs.org/dist/v18.x.x/node-v18.x.x-x64.msi
# ติดตั้งด้วย MSI Installer
```

### 2.2 ติดตั้ง Dependencies

```bash
# สร้างโฟลเดอร์โปรเจค
sudo mkdir -p /opt/jhcis/api
cd /opt/jhcis/api

# คัดลอกไฟล์โปรเจค
# (จาก Git Repository หรือ SCP)
git clone https://github.com/jhcis/summary-centralization-api.git .

# ติดตั้ง NPM Packages
npm install --production
```

### 2.3 ตั้งค่า Environment Variables

สร้างไฟล์ `/opt/jhcis/api/.env`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jhcis_central
DB_USER=jhcis_admin
DB_PASSWORD=secure_password_here
DB_POOL_MIN=2
DB_POOL_MAX=20

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRY=24h

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/jhcis/api.log

# CORS
CORS_ORIGIN=*

# File Upload
UPLOAD_DIR=/opt/jhcis/uploads
MAX_FILE_SIZE=10485760
```

### 2.4 สร้าง Systemd Service (Linux)

สร้างไฟล์ `/etc/systemd/system/jhcis-api.service`:

```ini
[Unit]
Description=JHCIS Central API Server
After=network.target postgresql.service

[Service]
Type=notify
User=jhcis
Group=jhcis
WorkingDirectory=/opt/jhcis/api
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/jhcis/api/.env

# Security Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/jhcis/uploads /var/log/jhcis

[Install]
WantedBy=multi-user.target
```

```bash
# Reload Systemd
sudo systemctl daemon-reload

# Enable และ Start Service
sudo systemctl enable jhcis-api
sudo systemctl start jhcis-api

# ตรวจสอบสถานะ
sudo systemctl status jhcis-api
```

### 2.5 ติดตั้งด้วย PM2 (ทางเลือก)

```bash
# ติดตั้ง PM2
sudo npm install -g pm2

# สร้าง Ecosystem Config
cat > /opt/jhcis/api/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'jhcis-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/jhcis/api-error.log',
    out_file: '/var/log/jhcis/api-out.log',
    log_file: '/var/log/jhcis/api-combined.log',
    time: true
  }]
};
EOF

# Start ด้วย PM2
cd /opt/jhcis/api
pm2 start ecosystem.config.js

# Setup Startup Script
pm2 startup
pm2 save
```

---

## 3. ติดตั้ง Database

### 3.1 ติดตั้ง PostgreSQL (แนะนำ)

```bash
# สำหรับ Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib postgresql-server-dev-all

# ตรวจสอบสถานะ
sudo systemctl status postgresql

# เข้าใช้งาน PostgreSQL
sudo -u postgres psql
```

### 3.2 สร้าง Database และ User

```sql
-- สร้าง Database
CREATE DATABASE jhcis_central
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'th_TH.UTF-8'
    LC_CTYPE = 'th_TH.UTF-8';

-- สร้าง User
CREATE USER jhcis_admin WITH
    ENCRYPTED PASSWORD 'secure_password_here'
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    INHERIT
    LOGIN;

-- ให้สิทธิ์
GRANT ALL PRIVILEGES ON DATABASE jhcis_central TO jhcis_admin;

-- ออกจาก Database
\c jhcis_central

-- ให้สิทธิ์บน Schema
GRANT ALL ON SCHEMA public TO jhcis_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO jhcis_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO jhcis_admin;

-- ตั้งค่า Default Permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO jhcis_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON SEQUENCES TO jhcis_admin;
```

### 3.3 สร้าง Schema

```sql
-- ตารางหน่วยโรงพยาบาล
CREATE TABLE hospital_units (
    id SERIAL PRIMARY KEY,
    unit_code VARCHAR(20) UNIQUE NOT NULL,
    unit_name VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ตารางข้อมูลสรุป
CREATE TABLE summary_data (
    id BIGSERIAL PRIMARY KEY,
    unit_id INTEGER REFERENCES hospital_units(id),
    report_date DATE NOT NULL,
    data_json JSONB NOT NULL,
    checksum VARCHAR(64),
    sync_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_id, report_date)
);

-- ตาราง API Logs
CREATE TABLE api_logs (
    id BIGSERIAL PRIMARY KEY,
    unit_code VARCHAR(20),
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง Audit Log
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(50),
    table_name VARCHAR(50),
    record_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง Index สำหรับ Performance
CREATE INDEX idx_summary_unit_date ON summary_data(unit_id, report_date);
CREATE INDEX idx_summary_status ON summary_data(sync_status);
CREATE INDEX idx_api_logs_created ON api_logs(created_at DESC);
CREATE INDEX idx_api_logs_unit ON api_logs(unit_code);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
```

### 3.4 ติดตั้ง MariaDB (ทางเลือก)

```bash
# สำหรับ Ubuntu/Debian
sudo apt-get install -y mariadb-server mariadb-client

# Secure Installation
sudo mysql_secure_installation

# เข้าใช้งาน
sudo mysql -u root -p
```

```sql
-- สร้าง Database
CREATE DATABASE jhcis_central 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- สร้าง User
CREATE USER 'jhcis_admin'@'localhost' 
    IDENTIFIED BY 'secure_password_here';

-- ให้สิทธิ์
GRANT ALL PRIVILEGES ON jhcis_central.* TO 'jhcis_admin'@'localhost';
FLUSH PRIVILEGES;
```

### 3.5 ตั้งค่า PostgreSQL Performance

แก้ไขไฟล์ `/etc/postgresql/14/main/postgresql.conf`:

```ini
# Memory Settings
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 64MB
maintenance_work_mem = 512MB

# Connection Settings
max_connections = 200
superuser_reserved_connections = 3

# WAL Settings
wal_buffers = 16MB
checkpoint_completion_target = 0.9
min_wal_size = 1GB
max_wal_size = 4GB

# Logging
log_destination = 'csvlog'
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
```

```bash
# รีสตาร์ท PostgreSQL
sudo systemctl restart postgresql
```

---

## 4. ติดตั้ง Dashboard

### 4.1 ติดตั้ง Web Frontend

```bash
# สร้างโฟลเดอร์
sudo mkdir -p /opt/jhcis/dashboard
cd /opt/jhcis/dashboard

# คัดลอกไฟล์ (จาก React/Vue Build)
# ตัวอย่าง: คัดลอกจาก Build Folder
scp -r build/* user@server:/opt/jhcis/dashboard/
```

### 4.2 ติดตั้ง Nginx

```bash
sudo apt-get install -y nginx

# สร้าง Server Block
sudo nano /etc/nginx/sites-available/jhcis-central
```

### 4.3 Nginx Configuration

```nginx
server {
    listen 80;
    server_name central-jhcis.moph.go.th;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name central-jhcis.moph.go.th;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/central-jhcis.moph.go.th/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/central-jhcis.moph.go.th/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # Dashboard Static Files
    location / {
        root /opt/jhcis/dashboard;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
    }

    # Logging
    access_log /var/log/nginx/jhcis-access.log;
    error_log /var/log/nginx/jhcis-error.log;

    # File Size Limit
    client_max_body_size 10M;
}
```

```bash
# Enable Site
sudo ln -s /etc/nginx/sites-available/jhcis-central /etc/nginx/sites-enabled/

# Test Configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 5. ตั้งค่า HTTPS/SSL Certificate

### 5.1 ติดตั้ง Let's Encrypt (Certbot)

```bash
# ติดตั้ง Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# ขอ Certificate
sudo certbot --nginx -d central-jhcis.moph.go.th

# หรือขอเฉพาะ Certificate (ไม่ตั้งค่า Nginx อัตโนมัติ)
sudo certbot certonly --webroot -w /opt/jhcis/dashboard -d central-jhcis.moph.go.th
```

### 5.2 ตั้งค่า Auto Renewal

```bash
# ตรวจสอบการ Renew อัตโนมัติ
sudo systemctl status certbot.timer

# ทดสอบ Renew
sudo certbot renew --dry-run

# ตั้งค่า Cron Job (ถ้าไม่มี Timer)
echo "0 3 * * * /usr/bin/certbot renew --quiet" | sudo tee -a /etc/crontab
```

### 5.3 ตรวจสอบ SSL Configuration

```bash
# ตรวจสอบ Certificate
sudo certbot certificates

# ดู_expiry_date
openssl x509 -in /etc/letsencrypt/live/central-jhcis.moph.go.th/cert.pem -noout -dates
```

---

## 6. ตั้งค่า Firewall Rules

### 6.1 UFW (Ubuntu Firewall)

```bash
# ติดตั้ง UFW
sudo apt-get install -y ufw

# ตั้งค่า Default
sudo ufw default deny incoming
sudo ufw default allow outgoing

# อนุญาต SSH
sudo ufw allow 22/tcp

# อนุญาต HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# อนุญาตเฉพาะ IP สำหรับ Database (ถ้าต้องการ remote access)
# sudo ufw allow from 10.0.0.0/8 to any port 5432 proto tcp

# Enable Firewall
sudo ufw enable

# ตรวจสอบสถานะ
sudo ufw status verbose
```

### 6.2 Firewalld (CentOS/RHEL)

```bash
# ติดตั้ง Firewalld
sudo yum install -y firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld

# ตั้งค่า Zone
sudo firewall-cmd --permanent --zone=public --add-service=ssh
sudo firewall-cmd --permanent --zone=public --add-service=http
sudo firewall-cmd --permanent --zone=public --add-service=https

# Reload
sudo firewall-cmd --reload

# ตรวจสอบ
sudo firewall-cmd --list-all
```

### 6.3 Windows Firewall (Windows Server)

```powershell
# เปิด PowerShell เป็น Administrator

# อนุญาต HTTP
New-NetFirewallRule -DisplayName "JHCIS HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# อนุญาต HTTPS
New-NetFirewallRule -DisplayName "JHCIS HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# อนุญาต SSH (ถ้าใช้ OpenSSH)
New-NetFirewallRule -DisplayName "SSH" -Direction Inbound -Protocol TCP -LocalPort 22 -Action Allow

# ตรวจสอบ Rules
Get-NetFirewallRule | Where-Object { $_.Enabled -eq True }
```

---

## 7. Monitoring และ Alerting

### 7.1 ติดตั้ง Prometheus + Grafana

```bash
# สร้างโฟลเดอร์
sudo mkdir -p /opt/monitoring
cd /opt/monitoring

# ดาวน์โหลด Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar -xzf prometheus-2.40.0.linux-amd64.tar.gz
mv prometheus-2.40.0.linux-amd64 prometheus

# สร้าง Config
cat > prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'jhcis-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
EOF
```

### 7.2 ติดตั้ง Node Exporter

```bash
# ดาวน์โหลด Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.5.0/node_exporter-1.5.0.linux-amd64.tar.gz
tar -xzf node_exporter-1.5.0.linux-amd64.tar.gz
mv node_exporter-1.5.0.linux-amd64 node_exporter

# สร้าง Systemd Service
cat > /etc/systemd/system/node-exporter.service << EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
Type=notify
User=nobody
ExecStart=/opt/monitoring/node_exporter/node_exporter

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable node-exporter
sudo systemctl start node-exporter
```

### 7.3 ติดตั้ง Grafana

```bash
# สำหรับ Ubuntu/Debian
sudo apt-get install -y apt-transport-https software-properties-common
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
sudo apt-get update
sudo apt-get install -y grafana

sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

**เข้าถึง Grafana:** http://localhost:3000 (admin/admin)

### 7.4 ตั้งค่า Alerting

สร้างไฟล์ Alert Rules `/opt/monitoring/prometheus/alerts.yml`:

```yaml
groups:
  - name: jhcis_alerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ \$labels.instance }}"
          description: "CPU usage is above 80% for more than 10 minutes"

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ \$labels.instance }}"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 15
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space low on {{ \$labels.instance }}"

      - alert: APIDown
        expr: up{job="jhcis-api"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "JHCIS API is down"

      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate on JHCIS API"
```

### 7.5 ตั้งค่า Email Alert (SMTP)

แก้ไขไฟล์ `/etc/grafana/grafana.ini`:

```ini
[smtp]
enabled = true
host = smtp.moph.go.th:587
user = jhcis-alerts@moph.go.th
password = smtp_password
from_address = jhcis-alerts@moph.go.th
from_name = JHCIS Monitoring
```

---

## 8. Backup และ Restore

### 8.1 Database Backup Script

สร้างไฟล์ `/opt/jhcis/scripts/backup-db.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/opt/jhcis/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="jhcis_central"
DB_USER="jhcis_admin"
RETENTION_DAYS=30

# สร้างโฟลเดอร์
mkdir -p $BACKUP_DIR

# Backup Database
echo "Starting backup at $(date)"
pg_dump -U $DB_USER -h localhost -F c -f $BACKUP_DIR/jhcis_central_$DATE.dump $DB_NAME

if [ $? -eq 0 ]; then
    echo "Backup completed successfully"
    
    # ลบ Backup เก่า
    find $BACKUP_DIR -name "jhcis_central_*.dump" -mtime +$RETENTION_DAYS -delete
    echo "Old backups cleaned"
else
    echo "Backup failed!"
    exit 1
fi
```

```bash
# ให้สิทธิ์ Execute
chmod +x /opt/jhcis/scripts/backup-db.sh

# ตั้งค่า Cron Job (Backup ทุกวันเวลา 03:00)
echo "0 3 * * * /opt/jhcis/scripts/backup-db.sh >> /var/log/jhcis/backup.log 2>&1" | sudo tee -a /etc/crontab
```

### 8.2 Database Restore

```bash
# Restore จาก Backup
pg_restore -U jhcis_admin -h localhost -d jhcis_central -Fc /opt/jhcis/backups/jhcis_central_20260321_030000.dump

# หรือใช้ psql สำหรับ SQL Dump
psql -U jhcis_admin -d jhcis_central < backup.sql
```

### 8.3 Full System Backup

สร้างไฟล์ `/opt/jhcis/scripts/full-backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/jhcis/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup Database
pg_dump -U jhcis_admin -h localhost -F c -f $BACKUP_DIR/db_$DATE.dump jhcis_central

# Backup Application Code
tar -czf $BACKUP_DIR/api_$DATE.tar.gz -C /opt/jhcis api

# Backup Config Files
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /etc/nginx /etc/systemd/system/jhcis-api.service

# Backup Logs (Optional)
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz /var/log/jhcis

echo "Full backup completed: $DATE"
```

### 8.4 Disaster Recovery Plan

```
ขั้นตอนการ Restore:

1. ติดตั้ง OS ใหม่ (ถ้าจำเป็น)
2. ติดตั้ง Dependencies (Node.js, PostgreSQL)
3. Restore Database
   $ pg_restore -U jhcis_admin -d jhcis_central backup.dump
4. Restore Application Code
   $ tar -xzf api_YYYYMMDD.tar.gz -C /opt/jhcis
5. Restore Configuration
   $ tar -xzf config_YYYYMMDD.tar.gz -C /
6. รีสตาร์ท Services
   $ sudo systemctl restart jhcis-api nginx postgresql
7. ตรวจสอบระบบ
   - ตรวจสอบ API: curl https://central-jhcis.moph.go.th/api/health
   - ตรวจสอบ Database: psql -U jhcis_admin -d jhcis_central
8. แจ้งทีมที่เกี่ยวข้อง
```

---

## 9. Performance Tuning

### 9.1 Database Optimization

```sql
-- วิเคราะห์ตาราง
ANALYZE;

-- Update Statistics
VACUUM ANALYZE;

-- ตรวจสอบ Slow Queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- สร้าง Index เพิ่มเติม (ถ้าจำเป็น)
CREATE INDEX CONCURRENTLY idx_summary_created_at 
    ON summary_data(created_at DESC);
```

### 9.2 API Performance

**Caching Strategy:**

```javascript
// ใช้ Redis สำหรับ Caching
const redis = require('redis');
const client = redis.createClient();

// Cache ข้อมูลสรุป 1 ชั่วโมง
app.get('/api/summary/:unit_code', async (req, res) => {
    const cacheKey = `summary:${req.params.unit_code}`;
    
    // ตรวจสอบ Cache
    const cached = await client.get(cacheKey);
    if (cached) {
        return res.json(JSON.parse(cached));
    }
    
    // Query จาก Database
    const data = await db.query(...);
    
    // เก็บใน Cache
    await client.setEx(cacheKey, 3600, JSON.stringify(data));
    
    res.json(data);
});
```

### 9.3 Connection Pooling

```javascript
// PostgreSQL Connection Pool
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'jhcis_central',
    user: 'jhcis_admin',
    password: 'secure_password',
    max: 20,           // Max connections
    min: 2,            // Min connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
```

### 9.4 Load Balancing (สำหรับ Production)

```nginx
# Nginx Load Balancer Configuration
upstream jhcis_api {
    least_conn;
    server 127.0.0.1:3001 weight=3;
    server 127.0.0.1:3002 weight=2;
    server 127.0.0.1:3003 weight=1;
    keepalive 32;
}

server {
    location /api/ {
        proxy_pass http://jhcis_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

---

## 10. Security Hardening

### 10.1 System Security

```bash
# สร้าง User สำหรับรัน Service
sudo useradd -r -s /bin/false jhcis

# ตั้งค่า File Permissions
sudo chown -R jhcis:jhcis /opt/jhcis
sudo chmod 750 /opt/jhcis
sudo chmod 640 /opt/jhcis/api/.env

# Disable Root Login (SSH)
sudo nano /etc/ssh/sshd_config
# เปลี่ยน: PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd
```

### 10.2 Application Security

**Environment Variables:**

```bash
# .env ไฟล์ต้องมีความปลอดภัย
JWT_SECRET=ใช้รหัสที่ซับซ้อนอย่างน้อย 32 ตัวอักษร
DB_PASSWORD=ไม่ใช้รหัสเดียวกันกับระบบอื่น
API_KEY=สร้างด้วย crypto.randomBytes(32)
```

**Rate Limiting:**

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 100, // 100 requests ต่อ IP
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);
```

### 10.3 Audit Logging

```javascript
// Audit Log Middleware
app.use((req, res, next) => {
    const log = {
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        user: req.user?.id,
        timestamp: new Date(),
    };
    
    // บันทึก Log
    db.query('INSERT INTO audit_log (...) VALUES (...)', [log]);
    
    next();
});
```

### 10.4 Security Checklist

- [ ] เปลี่ยนรหัสผ่าน Default ทั้งหมด
- [ ] Enable HTTPS เท่านั้น (HTTP Redirect)
- [ ] ตั้งค่า Firewall Rules
- [ ] Enable Rate Limiting
- [ ] ตั้งค่า CORS อย่างเหมาะสม
- [ ] Enable Security Headers
- [ ] หมั่นอัปเดต Security Patches
- [ ] ตรวจสอบ Log อย่างสม่ำเสมอ
- [ ] ตั้งค่า Backup อัตโนมัติ
- [ ] ทดสอบ Penetration Testing

---

## แนบท้าย (Appendix)

### A. คำสั่งตรวจสอบระบบ

```bash
# ตรวจสอบ Service Status
systemctl status jhcis-api nginx postgresql

# ดู Log
journalctl -u jhcis-api -f
tail -f /var/log/nginx/jhcis-access.log

# ตรวจสอบ Disk Usage
df -h
du -sh /opt/jhcis/*

# ตรวจสอบ Memory
free -h
top

# ตรวจสอบ Network
netstat -tulpn
ss -tulpn

# ตรวจสอบ Database Connections
psql -U jhcis_admin -d jhcis_central -c "SELECT count(*) FROM pg_stat_activity;"
```

### B. Emergency Contacts

| บทบาท | ติดต่อ | โทรศัพท์ |
|-------|--------|----------|
| System Admin | admin@moph.go.th | 02-XXX-XXXX |
| Database Admin | dba@moph.go.th | 02-XXX-XXXX |
| Network Team | network@moph.go.th | 02-XXX-XXXX |
| JHCIS Support | jhcis-support@moph.go.th | 02-XXX-XXXX |

---

**เอกสารเวอร์ชัน:** 1.0  
**อัปเดตล่าสุด:** 21 มีนาคม 2026  
**ผู้รับผิดชอบ:** ทีมพัฒนา JHCIS
