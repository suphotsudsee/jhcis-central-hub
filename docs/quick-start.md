# คู่มือเริ่มต้นเร็ว (Quick Start Guide)
# JHCIS Summary Centralization - Quick Start

## สำหรับทีมทดสอบและ Pilot Deployment

เอกสารนี้สำหรับผู้ที่ต้องการเริ่มต้นระบบอย่างรวดเร็วเพื่อทดสอบการทำงาน ก่อนดำเนินการติดตั้งเต็มรูปแบบ

---

## สารบัญ (Table of Contents)

1. [ทดสอบหน่วยย่อย (Unit Testing)](#1-ทดสอบหน่วยย่อย-unit-testing)
2. [ทดสอบเซิร์ฟเวอร์ส่วนกลาง (Server Testing)](#2-ทดสอบเซิร์ฟเวอร์ส่วนกลาง-server-testing)
3. [ทดสอบการเชื่อมต่อ (Connection Testing)](#3-ทดสอบการเชื่อมต่อ-connection-testing)
4. [Go-Live Checklist](#4-go-live-checklist)

---

## 1. ทดสอบหน่วยย่อย (Unit Testing)

### 1.1 ติดตั้งอย่างรวดเร็ว (Windows)

```powershell
# เปิด PowerShell เป็น Administrator

# สร้างโฟลเดอร์
New-Item -ItemType Directory -Force -Path "C:\JHCIS-TEST"
Set-Location "C:\JHCIS-TEST"

# ตรวจสอบ Python
python --version
# หากไม่มี: ดาวน์โหลดจาก https://www.python.org/downloads/

# ติดตั้ง Packages
pip install requests mysql-connector-python python-dotenv

# ดาวน์โหลด Script (ตัวอย่าง)
Invoke-WebRequest `
    -Uri "https://github.com/jhcis/summary-centralization/raw/main/jhcis_sync.py" `
    -OutFile "jhcis_sync.py"
```

### 1.2 ตั้งค่า Configuration อย่างรวดเร็ว

สร้างไฟล์ `config.json`:

```json
{
  "unit_info": {
    "unit_code": "TEST001",
    "unit_name": "โรงพยาบาลทดสอบ",
    "region": "ภาคกลาง"
  },
  "database": {
    "host": "localhost",
    "port": 3306,
    "database": "jhcis_test",
    "username": "root",
    "password": "test_password"
  },
  "central_server": {
    "base_url": "https://central-test.jhcis.moph.go.th",
    "api_endpoint": "/api/v1/summary",
    "api_key": "test_api_key_12345",
    "timeout": 30
  }
}
```

### 1.3 รันทดสอบ

```powershell
# รัน Manual Test
python jhcis_sync.py --test

# ดูผลลัพธ์
Get-Content "C:\JHCIS-TEST\logs\jhcis_sync.log" -Tail 20
```

**ผลลัพธ์ที่คาดหวัง:**
```
[INFO] Starting JHCIS Sync (TEST MODE)...
[INFO] Connected to database
[INFO] Extracted 10 test records
[INFO] Data sent successfully (Status: 200)
[INFO] Test completed
```

---

## 2. ทดสอบเซิร์ฟเวอร์ส่วนกลาง (Server Testing)

### 2.1 ติดตั้งอย่างรวดเร็ว (Linux/Ubuntu)

```bash
# อัปเดตระบบ
sudo apt-get update && sudo apt-get upgrade -y

# ติดตั้ง Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# ติดตั้ง PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# ติดตั้ง Nginx
sudo apt-get install -y nginx
```

### 2.2 ตั้งค่า Database

```bash
# เข้า PostgreSQL
sudo -u postgres psql

-- สร้าง Database และ User
CREATE DATABASE jhcis_test;
CREATE USER jhcis_test WITH PASSWORD 'test123';
GRANT ALL PRIVILEGES ON DATABASE jhcis_test TO jhcis_test;
\q
```

### 2.3 ติดตั้ง API

```bash
# สร้างโฟลเดอร์
sudo mkdir -p /opt/jhcis-test
cd /opt/jhcis-test

# คัดลอกไฟล์ API
git clone https://github.com/jhcis/summary-centralization-api.git .
npm install --production

# ตั้งค่า .env
cat > .env << EOF
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_NAME=jhcis_test
DB_USER=jhcis_test
DB_PASSWORD=test123
JWT_SECRET=test_secret_key_for_development_only
EOF

# รัน API
node server.js &

# ทดสอบ API
curl http://localhost:3000/api/health
```

**ผลลัพธ์ที่คาดหวัง:**
```json
{"status":"ok","timestamp":"2026-03-21T23:00:00Z","version":"1.0.0"}
```

### 2.4 ติดตั้ง Dashboard (Optional)

```bash
# สร้างโฟลเดอร์ Dashboard
sudo mkdir -p /opt/jhcis-test/dashboard
cd /opt/jhcis-test/dashboard

# ดาวน์โหลด Build Files (ตัวอย่าง)
wget https://github.com/jhcis/dashboard/releases/download/v1.0.0/build.zip
unzip build.zip

# ตั้งค่า Nginx
sudo nano /etc/nginx/sites-available/jhcis-test

# เพิ่ม Configuration
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /opt/jhcis-test/dashboard;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
    }
}

# Enable และ Reload
sudo ln -s /etc/nginx/sites-available/jhcis-test /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**เข้าถึง Dashboard:** http://localhost

---

## 3. ทดสอบการเชื่อมต่อ (Connection Testing)

### 3.1 ทดสอบจากหน่วยไปยังเซิร์ฟเวอร์

```powershell
# จากหน่วยย่อย (Windows)
Test-NetConnection -ComputerName central-test.jhcis.moph.go.th -Port 443

# ทดสอบ API Endpoint
Invoke-RestMethod -Uri "https://central-test.jhcis.moph.go.th/api/health"
```

### 3.2 ทดสอบการส่งข้อมูล

```powershell
# สร้าง Test Data
$testData = @{
    unit_code = "TEST001"
    report_date = (Get-Date -Format "yyyy-MM-dd")
    data = @{
        total_patients = 100
        op_cases = 50
        er_cases = 30
    }
} | ConvertTo-Json

# ส่งข้อมูล
$headers = @{
    "Authorization" = "Bearer test_api_key_12345"
    "Content-Type" = "application/json"
}

Invoke-RestMethod `
    -Uri "https://central-test.jhcis.moph.go.th/api/v1/summary" `
    -Method POST `
    -Headers $headers `
    -Body $testData
```

**ผลลัพธ์ที่คาดหวัง:**
```json
{"status":"success","message":"Data received","id":12345}
```

### 3.3 ตรวจสอบข้อมูลใน Database

```bash
# จากเซิร์ฟเวอร์ส่วนกลาง
sudo -u postgres psql -d jhcis_test

-- ตรวจสอบข้อมูล
SELECT * FROM summary_data ORDER BY created_at DESC LIMIT 5;

-- ตรวจสอบหน่วย
SELECT * FROM hospital_units WHERE unit_code = 'TEST001';

\q
```

---

## 4. Go-Live Checklist

### 4.1 หน่วยย่อย (80 Units)

#### Prerequisites
- [ ] Python 3.8+ ติดตั้งแล้ว
- [ ] MySQL Connector ทำงานได้
- [ ] Network Connection ไปยัง Central Server
- [ ] Firewall อนุญาต Outbound HTTPS

#### Installation
- [ ] โฟลเดอร์ C:\JHCIS สร้างแล้ว
- [ ] Script ไฟล์ดาวน์โหลดแล้ว
- [ ] config.json ตั้งค่าถูกต้อง
- [ ] .env ตั้งค่าถูกต้อง
- [ ] Virtual Environment สร้างแล้ว (ถ้าใช้)

#### Testing
- [ ] รัน Manual Test สำเร็จ
- [ ] Log file ถูกสร้าง
- [ ] ข้อมูลส่งไปยัง Central Server สำเร็จ
- [ ] ได้รับ Response HTTP 200

#### Automation
- [ ] Windows Task Scheduler สร้างแล้ว
- [ ] Task รันอัตโนมัติได้
- [ ] Task รันเวลาที่กำหนดได้
- [ ] Log แสดงผลลัพธ์ถูกต้อง

#### Documentation
- [ ] ทีม IT ได้รับการอบรม
- [ ] เอกสารคู่มือแจกจ่ายแล้ว
- [ ] ช่องทางสนับสนุนสื่อสารแล้ว

---

### 4.2 เซิร์ฟเวอร์ส่วนกลาง (Central Server)

#### Infrastructure
- [ ] Server Hardware พร้อม
- [ ] OS ติดตั้งและอัปเดตแล้ว
- [ ] Network Configuration ตั้งค่าแล้ว
- [ ] Static IP / Domain ตั้งค่าแล้ว

#### Software Installation
- [ ] Node.js ติดตั้งแล้ว
- [ ] PostgreSQL/MariaDB ติดตั้งแล้ว
- [ ] Nginx ติดตั้งแล้ว
- [ ] SSL Certificate ติดตั้งแล้ว

#### Configuration
- [ ] Database Schema สร้างแล้ว
- [ ] API Environment Variables ตั้งค่าแล้ว
- [ ] Nginx Configuration ตั้งค่าแล้ว
- [ ] Firewall Rules ตั้งค่าแล้ว

#### Security
- [ ] HTTPS ทำงานได้
- [ ] HTTP Redirect to HTTPS
- [ ] Security Headers ตั้งค่าแล้ว
- [ ] Rate Limiting ตั้งค่าแล้ว
- [ ] CORS ตั้งค่าแล้ว

#### Monitoring
- [ ] Logging ทำงานได้
- [ ] Monitoring Tools ติดตั้งแล้ว
- [ ] Alerting ตั้งค่าแล้ว
- [ ] Dashboard เข้าถึงได้

#### Backup & Recovery
- [ ] Backup Script สร้างแล้ว
- [ ] Backup รันอัตโนมัติได้
- [ ] ทดสอบ Restore แล้ว
- [ ] Disaster Recovery Plan มีแล้ว

#### Performance
- [ ] Load Test ผ่านแล้ว
- [ ] Response Time < 500ms
- [ ] Concurrent Connections รองรับ 80 หน่วย
- [ ] Database Indexes ตั้งค่าแล้ว

---

### 4.3 การทดสอบรวม (Integration Testing)

#### Functional Testing
- [ ] ทุกหน่วยส่งข้อมูลได้
- [ ] ข้อมูลถูกต้องใน Database
- [ ] Dashboard แสดงผลถูกต้อง
- [ ] API Response เวลาเหมาะสม

#### Load Testing
- [ ] ทดสอบ 80 หน่วยพร้อมกัน
- [ ] ไม่มี Timeout
- [ ] ไม่มี Data Loss
- [ ] Performance ยังเหมาะสม

#### Security Testing
- [ ] Authentication ทำงานได้
- [ ] Authorization ทำงานได้
- [ ] SQL Injection ป้องกันแล้ว
- [ ] XSS ป้องกันแล้ว

#### Failover Testing
- [ ] ทดสอบ API Restart
- [ ] ทดสอบ Database Restart
- [ ] ทดสอบ Network Disruption
- [ ] Auto Recovery ทำงานได้

---

### 4.4 การฝึกอบรม (Training)

#### ทีม IT หน่วย
- [ ] อบรมการติดตั้ง Script
- [ ] อบรมการตรวจสอบ Log
- [ ] อบรมการแก้ปัญหาพื้นฐาน
- [ ] ทดสอบปฏิบัติแล้ว

#### ทีมส่วนกลาง
- [ ] อบรมการดูแล Server
- [ ] อบรมการตรวจสอบ Monitoring
- [ ] อบรมการ Backup/Restore
- [ ] อบรมการตอบสนอง Incident

---

### 4.5 การสื่อสาร (Communication)

- [ ] แจ้งโรงพยาบาลทั้ง 80 แห่ง
- [ ] กำหนด Timeline Go-Live
- [ ] ตั้งตั้งทีมสนับสนุน (Support Team)
- [ ] สร้างช่องทางติดต่อ (Hotline/Email/Line)
- [ ] เตรียม Escalation Matrix

---

## Timeline แนะนำ (Recommended Timeline)

```
สัปดาห์ 1-2:  Pilot Testing (5 หน่วย)
  - ติดตั้งและทดสอบ 5 หน่วยนำร่อง
  - ปรับปรุงปัญหาที่พบ
  - อัปเดตเอกสาร

สัปดาห์ 3-4:  Phase 1 (20 หน่วย)
  - ติดตั้ง 20 หน่วยแรก
  - ติดตามและสนับสนุน
  - รวบรวม Feedback

สัปดาห์ 5-6:  Phase 2 (30 หน่วย)
  - ติดตั้ง 30 หน่วยถัดไป
  - ขยายทีมสนับสนุน
  - ปรับ Performance

สัปดาห์ 7-8:  Phase 3 (25 หน่วย)
  - ติดตั้ง 25 หน่วยสุดท้าย
  - ทดสอบรวม 80 หน่วย
  - เตรียม Go-Live

สัปดาห์ 9:     Go-Live
  - เปิดใช้งานจริง
  - ทีมสนับสนุนพร้อม 24/7
  - Monitoring แบบ Real-time

สัปดาห์ 10+:   Maintenance
  - ดูแลรักษาตามแผน
  - ปรับปรุงต่อเนื่อง
  - รวบรวม Metrics
```

---

## สรุป (Summary)

### สิ่งที่ต้องมีก่อน Go-Live

1. **หน่วยย่อย 80 แห่ง** ติดตั้งครบและทดสอบแล้ว
2. **เซิร์ฟเวอร์ส่วนกลาง** พร้อมและมั่นคง
3. **ทีมสนับสนุน** พร้อมปฏิบัติงาน
4. **เอกสารคู่มือ** แจกจ่ายครบ
5. **ช่องทางสื่อสาร** เปิดใช้งาน
6. **Monitoring & Alerting** ทำงานได้
7. **Backup System** ตั้งค่าแล้ว
8. **Incident Response Plan** มีแล้ว

---

## ติดต่อทีมสนับสนุน (Support Contact)

| ช่องทาง | ข้อมูล |
|---------|--------|
| Email | jhcis-support@moph.go.th |
| โทรศัพท์ | 02-XXX-XXXX (24/7) |
| Line Group | JHCIS Support Team |
| Ticket System | https://support.jhcis.moph.go.th |

---

**เอกสารเวอร์ชัน:** 1.0  
**อัปเดตล่าสุด:** 21 มีนาคม 2026  
**ผู้รับผิดชอบ:** ทีมพัฒนา JHCIS
