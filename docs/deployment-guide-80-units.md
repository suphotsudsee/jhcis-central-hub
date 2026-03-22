# คู่มือติดตั้ง Script สำหรับ 80 หน่วยโรงพยาบาล
# Deployment Guide for 80 Hospital Units

## สารบัญ (Table of Contents)

1. [ข้อกำหนดระบบ (System Requirements)](#1-ข้อกำหนดระบบ-system-requirements)
2. [การเตรียมความพร้อม (Prerequisites)](#2-การเตรียมความพร้อม-prerequisites)
3. [ดาวน์โหลดและติดตั้งไฟล์ (Download and Installation)](#3-ดาวน์โหลดและติดตั้งไฟล์-download-and-installation)
4. [การตั้งค่า Configuration](#4-การตั้งค่า-configuration)
5. [ทดสอบการรัน Manual (Testing)](#5-ทดสอบการรัน-manual-testing)
6. [ตั้งค่า Windows Task Scheduler](#6-ตั้งค่า-windows-task-scheduler)
7. [ตรวจสอบ Log (Log Monitoring)](#7-ตรวจสอบ-log-log-monitoring)
8. [แก้ปัญหา (Troubleshooting)](#8-แก้ปัญหา-troubleshooting)

---

## 1. ข้อกำหนดระบบ (System Requirements)

### ฮาร์ดแวร์ (Hardware)

| องค์ประกอบ | ข้อกำหนดขั้นต่ำ | ข้อกำหนดแนะนำ |
|-----------|----------------|--------------|
| CPU | Dual Core 2.0 GHz | Quad Core 2.5 GHz+ |
| RAM | 4 GB | 8 GB+ |
| Storage | 50 GB Free Space | 100 GB SSD |
| Network | 10 Mbps | 100 Mbps+ |

### ซอฟต์แวร์ (Software)

| องค์ประกอบ | เวอร์ชัน | หมายเหตุ |
|-----------|---------|----------|
| Windows | 10/11 หรือ Server 2016+ | ต้องมีสิทธิ์ Administrator |
| Python | 3.8 หรือสูงกว่า | 64-bit |
| MySQL Client | 5.7 หรือ 8.0 | สำหรับเชื่อมต่อฐานข้อมูล |
| PowerShell | 5.1 หรือสูงกว่า | มาพร้อม Windows |

### เครือข่าย (Network Requirements)

- **Outbound Connection:** หน่วยต้องสามารถเชื่อมต่อไปยังเซิร์ฟเวอร์ส่วนกลางได้
- **Port:** HTTPS (Port 443)
- **Firewall:** ต้องอนุญาต Outbound Traffic ไปยัง Central Server
- **Proxy:** หากใช้ Proxy ต้องตั้งค่าใน `.env`

---

## 2. การเตรียมความพร้อม (Prerequisites)

### 2.1 ตรวจสอบ Python Installation

```powershell
# เปิด PowerShell เป็น Administrator
python --version
```

**ผลลัพธ์ที่คาดหวัง:**
```
Python 3.x.x
```

**หากยังไม่ติดตั้ง Python:**

1. ดาวน์โหลดจาก https://www.python.org/downloads/
2. เลือกเวอร์ชัน 3.8 หรือสูงกว่า
3. ติดตั้งพร้อมติ๊กเลือก "Add Python to PATH"
4. รีสตาร์ทคอมพิวเตอร์

### 2.2 ติดตั้ง Python Packages

```powershell
# สร้าง Virtual Environment (แนะนำ)
cd C:\JHCIS
python -m venv venv

# Activate Virtual Environment
.\venv\Scripts\Activate.ps1

# ติดตั้ง Packages
pip install --upgrade pip
pip install requests mysql-connector-python python-dotenv schedule
```

### 2.3 ตรวจสอบการเชื่อมต่อเครือข่าย

```powershell
# ทดสอบ Ping ไปยัง Central Server
ping central-jhcis.moph.go.th

# ทดสอบ Port Connection
Test-NetConnection -ComputerName central-jhcis.moph.go.th -Port 443
```

---

## 3. ดาวน์โหลดและติดตั้งไฟล์ (Download and Installation)

### 3.1 สร้างโฟลเดอร์ติดตั้ง

```powershell
# สร้างโฟลเดอร์หลัก
New-Item -ItemType Directory -Force -Path "C:\JHCIS"

# สร้างโฟลเดอร์ย่อย
New-Item -ItemType Directory -Force -Path "C:\JHCIS\logs"
New-Item -ItemType Directory -Force -Path "C:\JHCIS\backup"
```

### 3.2 ดาวน์โหลดไฟล์ Script

**วิธีที่ 1: ดาวน์โหลดจาก Repository**

```powershell
# ใช้ Invoke-WebRequest
$url = "https://github.com/jhcis/summary-centralization/archive/main.zip"
$output = "C:\JHCIS\jhcis-script.zip"

Invoke-WebRequest -Uri $url -OutFile $output

# แตกไฟล์
Expand-Archive -Path $output -DestinationPath "C:\JHCIS" -Force
```

**วิธีที่ 2: คัดลอกไฟล์จาก USB/Network Share**

```powershell
# คัดลอกไฟล์จาก Network Share
Copy-Item "\\fileserver\jhcis\script\*" -Destination "C:\JHCIS" -Recurse
```

### 3.3 โครงสร้างโฟลเดอร์

```
C:\JHCIS\
├── jhcis_sync.py          # Main Script
├── config.json            # Configuration File
├── .env                   # Environment Variables
├── requirements.txt       # Python Dependencies
├── logs\                  # Log Files
├── backup\                # Backup Files
└── venv\                  # Virtual Environment (optional)
```

---

## 4. การตั้งค่า Configuration

### 4.1 แก้ไขไฟล์ config.json

เปิดไฟล์ `C:\JHCIS\config.json` ด้วย Text Editor (Notepad++, VS Code)

```json
{
  "unit_info": {
    "unit_code": "HOSP001",
    "unit_name": "โรงพยาบาล XXX",
    "region": "ภาคเหนือ"
  },
  "database": {
    "host": "localhost",
    "port": 3306,
    "database": "jhcis_local",
    "username": "jhcis_user",
    "password": "your_password",
    "charset": "utf8mb4"
  },
  "central_server": {
    "base_url": "https://central-jhcis.moph.go.th",
    "api_endpoint": "/api/v1/summary",
    "api_key": "your_api_key",
    "timeout": 30,
    "retry_attempts": 3
  },
  "schedule": {
    "enabled": true,
    "frequency": "daily",
    "time": "02:00",
    "timezone": "Asia/Bangkok"
  },
  "logging": {
    "level": "INFO",
    "file": "C:\\JHCIS\\logs\\jhcis_sync.log",
    "max_size_mb": 10,
    "backup_count": 5
  }
}
```

**ฟิลด์ที่ต้องแก้ไข:**

| ฟิลด์ | คำอธิบาย | ค่าที่ต้องเปลี่ยน |
|-------|----------|------------------|
| `unit_code` | รหัสหน่วยโรงพยาบาล | ตามรหัสที่ได้รับ |
| `unit_name` | ชื่อโรงพยาบาล | ชื่อหน่วยของคุณ |
| `database.password` | รหัสผ่าน MySQL | ตามฐานข้อมูลท้องถิ่น |
| `central_server.api_key` | API Key | ได้รับจากทีมส่วนกลาง |

### 4.2 แก้ไขไฟล์ .env

สร้างหรือแก้ไขไฟล์ `C:\JHCIS\.env`

```bash
# Environment Configuration
JHCIS_UNIT_CODE=HOSP001
JHCIS_UNIT_NAME=โรงพยาบาล XXX

# Database Connection
DB_HOST=localhost
DB_PORT=3306
DB_NAME=jhcis_local
DB_USER=jhcis_user
DB_PASSWORD=your_password

# Central Server
CENTRAL_API_URL=https://central-jhcis.moph.go.th
CENTRAL_API_KEY=your_api_key
CENTRAL_TIMEOUT=30

# Proxy Settings (ถ้ามี)
# HTTP_PROXY=http://proxy.moph.go.th:8080
# HTTPS_PROXY=https://proxy.moph.go.th:8080

# Logging
LOG_LEVEL=INFO
LOG_FILE=C:\\JHCIS\\logs\\jhcis_sync.log

# Email Alert (Optional)
ALERT_EMAIL=it@hospital.go.th
SMTP_SERVER=smtp.moph.go.th
SMTP_PORT=587
```

### 4.3 ตั้งค่า Permissions

```powershell
# ตั้งค่าสิทธิ์โฟลเดอร์
icacls "C:\JHCIS" /grant "NT AUTHORITY\NETWORK SERVICE:(OI)(CI)M" /T
icacls "C:\JHCIS\logs" /grant "NT AUTHORITY\NETWORK SERVICE:(OI)(CI)F" /T
```

---

## 5. ทดสอบการรัน Manual (Testing)

### 5.1 รัน Script ด้วยมือ

```powershell
# เปลี่ยนไปยังโฟลเดอร์ติดตั้ง
cd C:\JHCIS

# Activate Virtual Environment (ถ้ามี)
.\venv\Scripts\Activate.ps1

# รัน Script
python jhcis_sync.py --test
```

### 5.2 ตรวจสอบผลลัพธ์

**ผลลัพธ์ที่คาดหวัง:**

```
[INFO] 2026-03-21 23:00:00 - Starting JHCIS Sync...
[INFO] 2026-03-21 23:00:01 - Connected to local database
[INFO] 2026-03-21 23:00:05 - Extracted 150 records
[INFO] 2026-03-21 23:00:06 - Processing data...
[INFO] 2026-03-21 23:00:08 - Connecting to central server
[INFO] 2026-03-21 23:00:10 - Data sent successfully (Status: 200)
[INFO] 2026-03-21 23:00:10 - Sync completed
```

### 5.3 ตรวจสอบ Log File

```powershell
# ดู Log ล่าสุด
Get-Content "C:\JHCIS\logs\jhcis_sync.log" -Tail 50

# ดู Log แบบ Real-time
Get-Content "C:\JHCIS\logs\jhcis_sync.log" -Wait
```

### 5.4 Validation Checklist

- [ ] Script รันโดยไม่เกิด Error
- [ ] สามารถเชื่อมต่อฐานข้อมูลท้องถิ่นได้
- [ ] ข้อมูลถูกดึงและประมวลผลถูกต้อง
- [ ] สามารถเชื่อมต่อ Central Server ได้
- [ ] ข้อมูลถูกส่งสำเร็จ (HTTP 200)
- [ ] Log file ถูกสร้างและบันทึก

---

## 6. ตั้งค่า Windows Task Scheduler

### 6.1 สร้าง Task ด้วย PowerShell Script

สร้างไฟล์ `C:\JHCIS\register-task.ps1`:

```powershell
# Register JHCIS Sync Task
$taskName = "JHCIS_Summary_Sync"
$scriptPath = "C:\JHCIS\jhcis_sync.py"
$pythonPath = "C:\JHCIS\venv\Scripts\python.exe"
$logPath = "C:\JHCIS\logs\task_scheduler.log"

# ตรวจสอบว่า Task มีอยู่แล้วหรือไม่
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "Task already exists. Unregistering..."
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# สร้าง Action
$action = New-ScheduledTaskAction -Execute $pythonPath `
    -Argument "$scriptPath" `
    -WorkingDirectory "C:\JHCIS"

# สร้าง Trigger (รันทุกวันเวลา 02:00)
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM

# สร้าง Settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -WakeToRun

# สร้าง Principal (รันด้วย SYSTEM account)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Register Task
Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "JHCIS Summary Centralization - Daily Sync"

Write-Host "Task registered successfully!"
```

### 6.2 รัน Script Register Task

```powershell
# เปิด PowerShell เป็น Administrator
cd C:\JHCIS
.\register-task.ps1
```

### 6.3 ตรวจสอบ Task

```powershell
# ดูรายการ Task
Get-ScheduledTask -TaskName "JHCIS_Summary_Sync"

# ดูสถานะ Task
Get-ScheduledTaskInfo -TaskName "JHCIS_Summary_Sync"

# เปิด Task Scheduler GUI
taskschd.msc
```

### 6.4 ทดสอบรัน Task

```powershell
# รัน Task ด้วยมือ
Start-ScheduledTask -TaskName "JHCIS_Summary_Sync"

# รอ 1 นาที แล้วตรวจสอบ Log
Start-Sleep -Seconds 60
Get-Content "C:\JHCIS\logs\jhcis_sync.log" -Tail 20
```

---

## 7. ตรวจสอบ Log (Log Monitoring)

### 7.1 ตำแหน่ง Log Files

| Log File | ตำแหน่ง | คำอธิบาย |
|----------|---------|----------|
| Application Log | `C:\JHCIS\logs\jhcis_sync.log` | Log จาก Script |
| Task Scheduler Log | `C:\JHCIS\logs\task_scheduler.log` | Log จาก Task Scheduler |
| Error Log | `C:\JHCIS\logs\error.log` | Error เฉพาะ |

### 7.2 คำสั่งตรวจสอบ Log

```powershell
# ดู Log 50 บรรทัดล่าสุด
Get-Content "C:\JHCIS\logs\jhcis_sync.log" -Tail 50

# ค้นหา Error
Select-String -Path "C:\JHCIS\logs\*.log" -Pattern "ERROR"

# ดู Log ของวันนี้
Get-Content "C:\JHCIS\logs\jhcis_sync.log" | Where-Object { $_ -match "2026-03-21" }

# Export Log เป็น CSV
Get-Content "C:\JHCIS\logs\jhcis_sync.log" | Out-File "C:\JHCIS\logs\export.csv"
```

### 7.3 Log Levels

| Level | คำอธิบาย | เมื่อไหร่ใช้ |
|-------|----------|-------------|
| DEBUG | ข้อมูลละเอียด | สำหรับ Debug |
| INFO | ข้อมูลปกติ | Operation สำเร็จ |
| WARNING | คำเตือน | มีปัญหาแต่ไม่กระทบ |
| ERROR | ข้อผิดพลาด | Operation ล้มเหลว |
| CRITICAL | ข้อผิดพลาดร้ายแรง | ระบบหยุดทำงาน |

---

## 8. แก้ปัญหา (Troubleshooting)

### 8.1 ปัญหาที่พบบ่อย

#### ปัญหา: Script ไม่รัน

**อาการ:** Task Scheduler แสดงสถานะ "Ready" แต่ไม่รัน

**แนวทางแก้:**

1. ตรวจสอบสิทธิ์ผู้ใช้
```powershell
Get-ScheduledTaskInfo -TaskName "JHCIS_Summary_Sync"
```

2. ตรวจสอบ Path
```powershell
# ตรวจสอบว่าไฟล์มีอยู่จริง
Test-Path "C:\JHCIS\jhcis_sync.py"
Test-Path "C:\JHCIS\venv\Scripts\python.exe"
```

3. รัน Manual เพื่อทดสอบ
```powershell
cd C:\JHCIS
.\venv\Scripts\python.exe jhcis_sync.py
```

#### ปัญหา: Connection Timeout

**อาการ:** Log แสดง "Connection Timeout"

**แนวทางแก้:**

1. ตรวจสอบการเชื่อมต่อเครือข่าย
```powershell
Test-NetConnection -ComputerName central-jhcis.moph.go.th -Port 443
```

2. ตรวจสอบ Firewall
```powershell
Get-NetFirewallRule | Where-Object { $_.Enabled -eq True }
```

3. ตรวจสอบ Proxy (ถ้ามี)
```powershell
# ตรวจสอบ Environment Variables
Get-ChildItem Env: | Where-Object { $_.Name -like "*PROXY*" }
```

#### ปัญหา: Database Connection Failed

**อาการ:** Log แสดง "Cannot connect to database"

**แนวทางแก้:**

1. ตรวจสอบ MySQL Service
```powershell
Get-Service -Name MySQL*
```

2. ตรวจสอบ Credentials
```powershell
# ทดสอบเชื่อมต่อด้วยมือ
python -c "import mysql.connector; mysql.connector.connect(host='localhost', user='jhcis_user', password='your_password', database='jhcis_local')"
```

3. ตรวจสอบ Firewall ของ MySQL
```powershell
netstat -an | findstr "3306"
```

### 8.2 Decision Tree

```
Script ไม่รัน
    │
    ├─> ตรวจสอบ Task Scheduler Status
    │   ├─ Ready > รัน Manual Test
    │   └─ Not Ready > Register Task ใหม่
    │
    ├─> ตรวจสอบ Python Path
    │   ├─ มีไฟล์ > ตรวจสอบ Permissions
    │   └─ ไม่มีไฟล์ > ติดตั้ง Python ใหม่
    │
    └─> ตรวจสอบ Log
        ├─ มี Error > แก้ตาม Error Message
        └─ ไม่มี Log > ตรวจสอบ Working Directory
```

### 8.3 ติดต่อทีมสนับสนุน

หากแก้ปัญหาไม่ได้ ติดต่อ:

- **Email:** jhcis-support@moph.go.th
- **โทรศัพท์:** 02-XXX-XXXX (ทีม IT ส่วนกลาง)
- **Line Group:** JHCIS Support

---

## แนบท้าย (Appendix)

### A. คำสั่ง PowerShell ที่พบบ่อย

```powershell
# ดู Service ทั้งหมด
Get-Service

# รีสตาร์ท Service
Restart-Service -Name "JHCIS_Sync"

# ดู Process ที่รันอยู่
Get-Process | Where-Object { $_.ProcessName -like "python*" }

# ดู Disk Space
Get-PSDrive -PSProvider FileSystem

# ดู Network Connections
Get-NetTCPConnection -LocalPort 3306
```

### B. Template config.json สำหรับแต่ละหน่วย

```json
{
  "unit_info": {
    "unit_code": "[รหัสหน่วย]",
    "unit_name": "[ชื่อโรงพยาบาล]",
    "region": "[ภาค]"
  },
  "database": {
    "host": "localhost",
    "port": 3306,
    "database": "jhcis_local",
    "username": "jhcis_user",
    "password": "[รหัสผ่าน]"
  },
  "central_server": {
    "base_url": "https://central-jhcis.moph.go.th",
    "api_endpoint": "/api/v1/summary",
    "api_key": "[API Key]"
  }
}
```

---

**เอกสารเวอร์ชัน:** 1.0  
**อัปเดตล่าสุด:** 21 มีนาคม 2026  
**ผู้รับผิดชอบ:** ทีมพัฒนา JHCIS
