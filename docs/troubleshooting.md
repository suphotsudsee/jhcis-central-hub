# คู่มือแก้ปัญหาที่พบบ่อย
# Troubleshooting Guide - JHCIS Summary Centralization

## สารบัญ (Table of Contents)

1. [ปัญหาหน่วยย่อย (Unit Issues)](#1-ปัญหาหน่วยย่อย-unit-issues)
2. [ปัญหาเซิร์ฟเวอร์ส่วนกลาง (Server Issues)](#2-ปัญหาเซิร์ฟเวอร์ส่วนกลาง-server-issues)
3. [ปัญหาเครือข่าย (Network Issues)](#3-ปัญหาเครือข่าย-network-issues)
4. [ปัญหาฐานข้อมูล (Database Issues)](#4-ปัญหาฐานข้อมูล-database-issues)
5. [Decision Trees](#5-decision-trees)
6. [Escalation Matrix](#6-escalation-matrix)

---

## 1. ปัญหาหน่วยย่อย (Unit Issues)

### 1.1 Script ไม่รัน (Script Not Running)

**อาการ:**
- Windows Task Scheduler แสดงสถานะ "Ready" แต่ไม่รัน
- ไม่มี Log file เกิดขึ้น
- Manual run ก็ไม่ทำงาน

**สาเหตุที่เป็นไปได้:**
1. Python Path ไม่ถูกต้อง
2. File Permissions ไม่ถูกต้อง
3. Virtual Environment ไม่ Activate
4. Working Directory ไม่ถูกต้อง

**แนวทางแก้:**

```powershell
# 1. ตรวจสอบ Python Path
Test-Path "C:\JHCIS\venv\Scripts\python.exe"
# หากเป็น False > ติดตั้ง Python ใหม่ หรือ แก้ไข Path ใน Task

# 2. ตรวจสอบ File Permissions
icacls "C:\JHCIS\jhcis_sync.py"
# ต้องมีสิทธิ์ Read/Execute สำหรับผู้ใช้ที่รัน Task

# 3. รัน Manual เพื่อทดสอบ
cd C:\JHCIS
.\venv\Scripts\Activate.ps1
python jhcis_sync.py --verbose

# 4. ตรวจสอบ Task Scheduler Configuration
Get-ScheduledTask -TaskName "JHCIS_Summary_Sync" | Format-List *
```

**การป้องกัน:**
- ใช้ Absolute Path ทั้งหมด
- ทดสอบ Manual ก่อน Register Task
- ตรวจสอบ Log หลังรันครั้งแรก

---

### 1.2 Database Connection Failed

**อาการ:**
```
ERROR: Cannot connect to database
mysql.connector.errors.OperationalError: 2003: Can't connect to MySQL server
```

**สาเหตุที่เป็นไปได้:**
1. MySQL Service ไม่รัน
2. Credentials ไม่ถูกต้อง
3. Host/Port ไม่ถูกต้อง
4. Firewall บล็อก Connection

**แนวทางแก้:**

```powershell
# 1. ตรวจสอบ MySQL Service
Get-Service -Name MySQL*
# หากไม่รัน > Start-Service -Name MySQL

# 2. ตรวจสอบ Credentials
# เปิด config.json และตรวจสอบ username/password

# 3. ทดสอบเชื่อมต่อด้วยมือ
python -c "import mysql.connector; conn = mysql.connector.connect(host='localhost', port=3306, user='jhcis_user', password='your_password', database='jhcis_local'); print('Connected!'); conn.close()"

# 4. ตรวจสอบ Firewall
netstat -an | findstr "3306"
# หากไม่มี > MySQL ไม่ Listen หรือ Firewall บล็อก
```

**การป้องกัน:**
- ทดสอบ Connection ก่อน Deploy
- ใช้ Connection Pooling
- ตั้งค่า Timeout ที่เหมาะสม

---

### 1.3 API Timeout/Connection Refused

**อาการ:**
```
ERROR: Connection timeout to central server
requests.exceptions.ConnectTimeout: HTTPSConnectionPool(...)
```

**สาเหตุที่เป็นไปได้:**
1. Central Server Down
2. Network Problem
3. Firewall บล็อก Outbound
4. Proxy ต้องตั้งค่า
5. DNS Resolution ล้มเหลว

**แนวทางแก้:**

```powershell
# 1. ทดสอบ Connectivity
Test-NetConnection -ComputerName central-jhcis.moph.go.th -Port 443

# 2. ทดสอบ DNS Resolution
Resolve-DnsName central-jhcis.moph.go.th

# 3. ตรวจสอบ Firewall Rules
Get-NetFirewallRule | Where-Object { $_.Enabled -eq True } | Format-Table DisplayName, Direction, Action

# 4. ตรวจสอบ Proxy Settings
Get-ChildItem Env: | Where-Object { $_.Name -like "*PROXY*" }

# 5. ทดสอบด้วย curl (หากติดตั้ง)
curl -v https://central-jhcis.moph.go.th/api/health
```

**การป้องกัน:**
- ตั้งค่า Retry Logic ใน Script
- ใช้ Circuit Breaker Pattern
- Monitor Central Server Status

---

### 1.4 Authentication Failed (401/403)

**อาการ:**
```
ERROR: HTTP 401 Unauthorized
ERROR: Invalid API Key
```

**สาเหตุที่เป็นไปได้:**
1. API Key ไม่ถูกต้อง
2. API Key หมดอายุ
3. Unit Code ไม่ถูกต้อง
4. Token Expired

**แนวทางแก้:**

```powershell
# 1. ตรวจสอบ API Key ใน config.json
# เปรียบเทียบกับที่ได้รับจากทีมส่วนกลาง

# 2. ทดสอบ API Key
$headers = @{
    "Authorization" = "Bearer YOUR_API_KEY"
}
Invoke-RestMethod -Uri "https://central-jhcis.moph.go.th/api/health" -Headers $headers

# 3. ขอ API Key ใหม่จากทีมส่วนกลาง
# Email: jhcis-support@moph.go.th
```

**การป้องกัน:**
- หมั่นหมุน API Key (ทุก 90 วัน)
- ใช้ Secure Storage สำหรับ Keys
- Implement Token Refresh

---

### 1.5 Data Validation Error

**อาการ:**
```
ERROR: Data validation failed
Missing required field: unit_code
Invalid date format
```

**สาเหตุที่เป็นไปได้:**
1. Data Format ไม่ถูกต้อง
2. Required Fields หาย
3. Data Type ไม่ถูกต้อง
4. Schema เปลี่ยน

**แนวทางแก้:**

```python
# เพิ่ม Logging สำหรับ Debug
import json
import logging

logging.basicConfig(level=logging.DEBUG)

# ใน Script
data = extract_data()
logging.debug(f"Extracted data: {json.dumps(data, indent=2)}")

# Validate ก่อนส่ง
required_fields = ['unit_code', 'report_date', 'data']
for field in required_fields:
    if field not in data:
        logging.error(f"Missing required field: {field}")
        raise ValueError(f"Missing field: {field}")
```

**การป้องกัน:**
- ใช้ JSON Schema Validation
- มี Unit Tests สำหรับ Data Format
- Log Data ก่อนส่ง

---

## 2. ปัญหาเซิร์ฟเวอร์ส่วนกลาง (Server Issues)

### 2.1 API Service Down

**อาการ:**
- API Response 502/503
- Dashboard ไม่โหลด
- หน่วยส่งข้อมูลไม่ได้

**สาเหตุที่เป็นไปได้:**
1. Node.js Process Crash
2. Out of Memory
3. Port Conflict
4. Configuration Error

**แนวทางแก้:**

```bash
# 1. ตรวจสอบ Service Status
sudo systemctl status jhcis-api
# หรือ
pm2 status

# 2. ดู Log
sudo journalctl -u jhcis-api -f
# หรือ
pm2 logs jhcis-api

# 3. ตรวจสอบ Resource Usage
top
free -h
df -h

# 4. รีสตาร์ท Service
sudo systemctl restart jhcis-api
# หรือ
pm2 restart jhcis-api

# 5. ตรวจสอบ Port
sudo netstat -tulpn | grep 3000
```

**การป้องกัน:**
- ใช้ PM2 สำหรับ Auto Restart
- ตั้งค่า Health Checks
- Monitor Memory Usage
- ตั้งค่า Resource Limits

---

### 2.2 Database Connection Pool Exhausted

**อาการ:**
```
ERROR: Too many connections
ERROR: Connection pool exhausted
FATAL: sorry, too many clients already
```

**สาเหตุที่เป็นไปได้:**
1. Connection Leak
2. Pool Size น้อยเกินไป
3. Long-running Queries
4. Connection ไม่ถูก Close

**แนวทางแก้:**

```sql
-- 1. ตรวจสอบ Active Connections
SELECT count(*) FROM pg_stat_activity;

-- 2. ดู Connections ตาม User
SELECT usename, count(*) FROM pg_stat_activity GROUP BY usename;

-- 3. ตรวจสอบ Long-running Queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
ORDER BY duration DESC;

-- 4. Kill Long-running Query (ถ้าจำเป็น)
SELECT pg_terminate_backend(pid);
```

```javascript
// 5. ปรับ Connection Pool ใน Code
const pool = new Pool({
    max: 50,           // เพิ่มจาก 20
    min: 5,            // เพิ่มจาก 2
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
```

**การป้องกัน:**
- ใช้ Connection Pooling
- ตั้งค่า Timeout ที่เหมาะสม
- Monitor Active Connections
- Implement Query Timeout

---

### 2.3 Disk Space Full

**อาการ:**
```
ERROR: No space left on device
FATAL: could not write to file: No space left
```

**สาเหตุที่เป็นไปได้:**
1. Log files เต็ม
2. Backup files ไม่ถูกลบ
3. Database Growth เร็วเกินไป
4. Temporary files ไม่ถูกทำความสะอาด

**แนวทางแก้:**

```bash
# 1. ตรวจสอบ Disk Usage
df -h
du -sh /var/log/*
du -sh /opt/jhcis/*

# 2. ลบ Log files เก่า
find /var/log -name "*.log" -mtime +30 -delete

# 3. ลบ Backup เก่า
find /opt/jhcis/backups -name "*.dump" -mtime +30 -delete

# 4. Vacuum Database
psql -U jhcis_admin -d jhcis_central -c "VACUUM FULL;"

# 5. ตรวจสอบและขยาย Disk (ถ้าจำเป็น)
# สำหรับ Cloud: ขยาย Volume
# สำหรับ Physical: เพิ่ม Disk
```

**การป้องกัน:**
- ตั้งค่า Log Rotation
- อัตโนมัติลบ Backup เก่า
- Monitor Disk Usage
- ตั้งค่า Alert ที่ 80% Usage

---

### 2.4 SSL Certificate Expired

**อาการ:**
```
ERROR: SSL Certificate expired
Browser แสดง SSL Warning
curl: (60) SSL certificate problem: certificate has expired
```

**แนวทางแก้:**

```bash
# 1. ตรวจสอบ Certificate Expiry
sudo certbot certificates
# หรือ
openssl x509 -in /etc/letsencrypt/live/central-jhcis.moph.go.th/cert.pem -noout -dates

# 2. Renew Certificate
sudo certbot renew --force-renewal

# 3. Reload Nginx
sudo systemctl reload nginx

# 4. ตรวจสอบอีกครั้ง
curl -vI https://central-jhcis.moph.go.th
```

**การป้องกัน:**
- ตั้งค่า Auto Renewal (Certbot Timer)
- Monitor Certificate Expiry
- ตั้ง Alert 30 วันก่อนหมดอายุ
- ใช้ Certificate Management Tool

---

## 3. ปัญหาเครือข่าย (Network Issues)

### 3.1 DNS Resolution Failed

**อาการ:**
```
ERROR: getaddrinfo ENOTFOUND central-jhcis.moph.go.th
nslookup: can't resolve 'central-jhcis.moph.go.th'
```

**แนวทางแก้:**

```powershell
# Windows - ตรวจสอบ DNS
ipconfig /all
nslookup central-jhcis.moph.go.th

# เปลี่ยน DNS Server
# Control Panel > Network > DNS Settings
# ใช้ 8.8.8.8 หรือ 1.1.1.1

# Linux
cat /etc/resolv.conf
dig central-jhcis.moph.go.th

# แก้ไข /etc/resolv.conf
nameserver 8.8.8.8
nameserver 1.1.1.1
```

---

### 3.2 Firewall Blocking

**อาการ:**
```
ERROR: Connection refused
ERROR: Connection timed out
telnet: Unable to connect to remote host
```

**แนวทางแก้:**

```bash
# Linux - ตรวจสอบ UFW
sudo ufw status verbose
sudo ufw allow 443/tcp
sudo ufw reload

# Linux - ตรวจสอบ iptables
sudo iptables -L -n -v

# Windows - ตรวจสอบ Firewall
Get-NetFirewallRule | Where-Object { $_.Enabled -eq True }
New-NetFirewallRule -DisplayName "JHCIS HTTPS" -Direction Outbound -Protocol TCP -RemotePort 443 -Action Allow
```

---

### 3.3 Proxy Issues

**อาการ:**
```
ERROR: Proxy authentication required
ERROR: Unable to tunnel through proxy
```

**แนวทางแก้:**

```powershell
# ตรวจสอบ Proxy Settings
Get-ChildItem Env: | Where-Object { $_.Name -like "*PROXY*" }

# ตั้งค่า Proxy ใน Script
# เพิ่มใน .env
HTTP_PROXY=http://proxy.moph.go.th:8080
HTTPS_PROXY=https://proxy.moph.go.th:8080
PROXY_USER=your_username
PROXY_PASS=your_password

# ใน Python Script
import requests
proxies = {
    'http': 'http://proxy.moph.go.th:8080',
    'https': 'https://proxy.moph.go.th:8080',
}
requests.get(url, proxies=proxies)
```

---

## 4. ปัญหาฐานข้อมูล (Database Issues)

### 4.1 Slow Queries

**อาการ:**
- API Response ช้า
- Dashboard โหลดช้า
- Timeout บ่อย

**แนวทางแก้:**

```sql
-- 1. เปิด Query Logging
-- ใน postgresql.conf
log_min_duration_statement = 1000

-- 2. ตรวจสอบ Slow Queries
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 3. Analyze Query Plan
EXPLAIN ANALYZE
SELECT * FROM summary_data WHERE unit_id = 1 AND report_date > '2026-01-01';

-- 4. สร้าง Index (ถ้าจำเป็น)
CREATE INDEX CONCURRENTLY idx_summary_unit_date 
    ON summary_data(unit_id, report_date);

-- 5. Update Statistics
ANALYZE;
VACUUM ANALYZE;
```

---

### 4.2 Replication Lag (ถ้าใช้ Replication)

**อาการ:**
```
Replication lag: 300 seconds
Slave behind master
```

**แนวทางแก้:**

```sql
-- ตรวจสอบ Replication Status
SELECT * FROM pg_stat_replication;

-- ตรวจสอบ Lag
SELECT client_addr, 
       (pg_current_wal_lsn() - replay_lsn) AS lag_bytes,
       replay_lsn,
       last_msg_send_time
FROM pg_stat_replication;

-- หาก Lag มาก > ตรวจสอบ
-- 1. Network ระหว่าง Master/Slave
-- 2. Disk I/O บน Slave
-- 3. Long-running Queries บน Slave
```

---

### 4.3 Lock Contention

**อาการ:**
```
ERROR: could not obtain lock on row in relation
Process blocked waiting for lock
```

**แนวทางแก้:**

```sql
-- 1. ตรวจสอบ Locks
SELECT blocked_locks.pid     AS blocked_pid,
       blocked_activity.usename  AS blocked_user,
       blocking_locks.pid     AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query    AS blocked_statement,
       blocking_activity.query   AS blocking_statement
FROM  pg_catalog.pg_locks         blocked_locks
JOIN  pg_catalog.pg_stat_activity blocked_activity  ON blocked_activity.pid = blocked_locks.pid
JOIN  pg_catalog.pg_locks         blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN  pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.GRANTED;

-- 2. Kill Blocking Process (ถ้าจำเป็น)
SELECT pg_terminate_backend(blocking_pid);
```

---

## 5. Decision Trees

### 5.1 Script ไม่รัน

```
Script ไม่รัน
    │
    ▼
ตรวจสอบ Task Scheduler Status
    │
    ├─> Status = "Ready"
    │   │
    │   ▼
    │   รัน Manual Test
    │   │
    │   ├─> สำเร็จ > ปัญหาที่ Task Scheduler Configuration
    │   │   └─> แก้ไข: ตรวจสอบ User, Working Directory, Trigger
    │   │
    │   └─> ล้มเหลว > ปัญหาที่ Script/Environment
    │       └─> แก้ไข: ดู Decision Tree ด้านล่าง
    │
    └─> Status = "Not Ready"/"Disabled"
        └─> แก้ไข: Enable Task หรือ Register ใหม่
```

### 5.2 Database Connection Failed

```
Database Connection Failed
    │
    ▼
ตรวจสอบ MySQL Service
    │
    ├─> Service รัน > ตรวจสอบ Credentials
    │   │
    │   ▼
    │   ทดสอบเชื่อมต่อด้วยมือ
    │   │
    │   ├─> สำเร็จ > ปัญหาที่ Script Configuration
    │   │   └─> แก้ไข: ตรวจสอบ config.json
    │   │
    │   └─> ล้มเหลว > ปัญหาที่ Credentials/Permissions
    │       └─> แก้ไข: รีเซ็ตรหัสผ่าน หรือ ให้สิทธิ์ใหม่
    │
    └─> Service ไม่รัน > Start Service
        └─> หาก Start ไม่ได้ > ตรวจสอบ Error Log
            └─> แก้ไขตาม Error Message
```

### 5.3 API Timeout

```
API Timeout
    │
    ▼
ทดสอบ Connectivity (Ping/Port)
    │
    ├─> Connection สำเร็จ > ปัญหาที่ Application Layer
    │   │
    │   ▼
    │   ตรวจสอบ API Status
    │   │
    │   ├─> API Down > รีสตาร์ท API Service
    │   │   └─> หากยังไม่ได้ > ดู Log
    │   │
    │   └─> API Up > ปัญหาที่ Request/Response
    │       └─> แก้ไข: ตรวจสอบ Payload, Timeout, Retry
    │
    └─> Connection ล้มเหลว > ปัญหาที่ Network
        │
        ▼
        ตรวจสอบ Firewall/Proxy/DNS
        │
        ├─> Firewall บล็อก > เปิด Rule
        ├─> Proxy ต้องตั้งค่า > ตั้งค่า Proxy
        └─> DNS ไม่resolve > แก้ไข DNS
```

### 5.4 Dashboard ไม่โหลด

```
Dashboard ไม่โหลด
    │
    ▼
ตรวจสอบ Browser Console (F12)
    │
    ├─> SSL Error > Certificate Problem
    │   └─> แก้ไข: Renew Certificate
    │
    ├─> 502/503 Error > Backend Down
    │   └─> แก้ไข: รีสตาร์ท API Service
    │
    ├─> 404 Error > File Not Found
    │   └─> แก้ไข: ตรวจสอบ Nginx Root Path
    │
    └─> CORS Error > CORS Configuration
        └─> แก้ไข: ตั้งค่า CORS ใน API
```

---

## 6. Escalation Matrix

### ระดับปัญหา (Issue Severity)

| ระดับ | คำอธิบาย | Response Time | Escalation |
|-------|----------|---------------|------------|
| **P1 - Critical** | ระบบหยุดทำงานทั้งหมด, Data Loss | 15 นาที | ทีมพัฒนา + ผู้จัดการ |
| **P2 - High** | ระบบบางส่วนหยุด, Performance ต่ำมาก | 1 ชั่วโมง | ทีมพัฒนา |
| **P3 - Medium** | มีปัญหาแต่ทำงานได้, Performance ต่ำ | 4 ชั่วโมง | ทีมสนับสนุน |
| **P4 - Low** | ปัญหาเล็กน้อย, Cosmetic | 24 ชั่วโมง | Ticket System |

### ขั้นตอน Escalation

```
P1 - Critical:
  1. แจ้งทีมพัฒนาทันที (โทรศัพท์)
  2. สร้าง War Room (Line Group/Conference Call)
  3. เริ่ม Incident Response
  4. อัปเดตสถานะทุก 30 นาที
  5. Post-Incident Review

P2 - High:
  1. แจ้งทีมพัฒนา (Email + โทรศัพท์)
  2. สร้าง Ticket
  3. อัปเดตสถานะทุก 2 ชั่วโมง
  4. Root Cause Analysis

P3 - Medium:
  1. สร้าง Ticket
  2. ทีมสนับสนุนตรวจสอบ
  3. แก้ไขภายใน SLA
  4. บันทึกความรู้

P4 - Low:
  1. สร้าง Ticket
  2. จัดลำดับความสำคัญ
  3. แก้ไขเมื่อมีทรัพยากร
  4. บันทึกใน Knowledge Base
```

### ติดต่อทีมสนับสนุน (Support Contacts)

| ระดับ | ช่องทาง | ติดต่อ |
|-------|---------|--------|
| **P1** | โทรศัพท์ | 02-XXX-XXXX (24/7 Hotline) |
| **P1-P2** | Email | jhcis-critical@moph.go.th |
| **P3-P4** | Ticket | https://support.jhcis.moph.go.th |
| **ทั่วไป** | Line Group | JHCIS Support Team |

---

## แนบท้าย (Appendix)

### A. คำสั่งตรวจสอบระบบอย่างรวดเร็ว

```bash
# Linux - Quick Health Check
echo "=== System Status ==="
uptime
df -h
free -h
systemctl status jhcis-api nginx postgresql --no-pager
tail -20 /var/log/jhcis/api.log
```

```powershell
# Windows - Quick Health Check
Write-Host "=== System Status ==="
Get-Service | Where-Object { $_.Name -like "*JHCIS*" -or $_.Name -like "*MySQL*" }
Get-ScheduledTask -TaskName "JHCIS_Summary_Sync"
Get-Content "C:\JHCIS\logs\jhcis_sync.log" -Tail 20
Test-NetConnection -ComputerName central-jhcis.moph.go.th -Port 443
```

### B. Log File Locations

| Component | Log Path | Command to View |
|-----------|----------|-----------------|
| Unit Script | `C:\JHCIS\logs\jhcis_sync.log` | `Get-Content -Tail 50` |
| Task Scheduler | `C:\JHCIS\logs\task_scheduler.log` | `Get-Content -Tail 50` |
| API (Linux) | `/var/log/jhcis/api.log` | `tail -f` |
| API (PM2) | `~/.pm2/logs/*.log` | `pm2 logs` |
| Nginx Access | `/var/log/nginx/access.log` | `tail -f` |
| Nginx Error | `/var/log/nginx/error.log` | `tail -f` |
| PostgreSQL | `/var/log/postgresql/*.log` | `tail -f` |

### C. Useful One-Liners

```bash
# ตรวจสอบ API Response Time
curl -w "@curl-format.txt" -o /dev/null -s https://central-jhcis.moph.go.th/api/health

# ดู Top 10 Slow Queries
psql -U jhcis_admin -d jhcis_central -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# ตรวจสอบ SSL Expiry
openssl x509 -enddate -noout -in /etc/letsencrypt/live/central-jhcis.moph.go.th/cert.pem

# ดู Active Connections
ss -tulpn | grep -E ':(3000|5432|80|443)'
```

---

**เอกสารเวอร์ชัน:** 1.0  
**อัปเดตล่าสุด:** 21 มีนาคม 2026  
**ผู้รับผิดชอบ:** ทีมพัฒนา JHCIS
