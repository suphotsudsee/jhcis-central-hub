# JHCIS Summary Data Collection System - Architecture Design

## System Overview

ระบบรวบรวมข้อมูล Summary จาก 80 หน่วย JHCIS เข้าสู่ระบบฐานข้อมูลส่วนกลาง (Central Hub)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        80 JHCIS Units (Source)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         ┌──────────┐         │
│  │ Unit 1   │  │ Unit 2   │  │ Unit 3   │  ...    │ Unit 80  │         │
│  │ MySQL    │  │ MySQL    │  │ MySQL    │         │ MySQL    │         │
│  │ Node.js  │  │ Node.js  │  │ Node.js  │         │ Node.js  │         │
│  │ Script   │  │ Script   │  │ Script   │         │ Script   │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘         └────┬─────┘         │
│       │             │             │                    │                │
└───────┼─────────────┼─────────────┼────────────────────┼────────────────┘
        │             │             │                    │
        └─────────────┴─────────────┴────────────────────┘
                              │
                    HTTPS POST (JSON)
                    With API Key Auth
                    Retry Logic (3 attempts)
                              │
        ┌─────────────────────▼─────────────────────┐
        │         Central Hub (API Server)          │
        │  ┌─────────────────────────────────────┐  │
        │  │  Node.js Express / FastAPI          │  │
        │  │  - Rate Limiting                    │  │
        │  │  - Request Validation               │  │
        │  │  - API Key Authentication           │  │
        │  │  - Concurrency Handling (80 units)  │  │
        │  └─────────────────────────────────────┘  │
        │                    │                      │
        │  ┌────────────────▼─────────────────┐    │
        │  │  Central Database               │    │
        │  │  PostgreSQL / MariaDB            │    │
        │  │  - Summary Tables                │    │
        │  │  - Sync Log Tables               │    │
        │  │  - Unit Status Tables            │    │
        │  └─────────────────────────────────┘    │
        └─────────────────────────────────────────┘
                              │
        ┌─────────────────────▼─────────────────────┐
        │         Monitoring Dashboard              │
        │  - Real-time Sync Status (80 units)      │
        │  - Last Sync Time per Unit               │
        │  - Failed Sync Alerts                    │
        │  - Data Volume Reports                   │
        └─────────────────────────────────────────┘
```

## Component Details

### 1. Unit-Level Component (80 Units)

**Location:** แต่ละหน่วย JHCIS (Windows Server / Workstation)

**Technology Stack:**
- Node.js Script (Runner)
- Windows Task Scheduler
- MySQL/MariaDB (JHCIS Database)

**Functions:**
- Query Summary data จาก JHCIS Database
- Transform data เป็น JSON format
- Send data ไปยัง Central Hub ผ่าน HTTPS POST
- Handle retry logic (3 attempts with exponential backoff)
- Log sync status locally

**Execution:**
- รันผ่าน Windows Task Scheduler
- ความถี่: ทุก 1 ชั่วโมง (หรือตาม requirement)
- Runtime: < 5 นาที ต่อหน่วย

### 2. Central Hub API Server

**Technology Stack:**
- Node.js with Express หรือ Python with FastAPI
- PostgreSQL หรือ MariaDB
- API Key Authentication (per unit)
- Rate Limiting & Concurrency Control

**Endpoints:**
```
POST /api/v1/summary/sync
  - Accept: JSON payload
  - Auth: API Key (per unit hcode)
  - Response: { status, message, sync_id }

GET /api/v1/summary/status/:hcode
  - Get sync status for specific unit

GET /api/v1/dashboard/overview
  - Get overview of all 80 units sync status
```

**Concurrency Handling:**
- รองรับ 80 units ส่งข้อมูลพร้อมกัน
- Connection Pool: 100 connections
- Request Queue: LIFO with timeout
- Max Request Time: 30 seconds

### 3. Central Database Schema

**Database:** PostgreSQL หรือ MariaDB

**Core Tables:**
- `summary_records` - เก็บข้อมูล Summary จากทุกหน่วย
- `sync_logs` - บันทึกการ sync แต่ละครั้ง
- `unit_status` - สถานะของแต่ละหน่วย
- `api_keys` - API Key สำหรับแต่ละหน่วย

### 4. Security Layer

**Authentication:**
- API Key per unit (hcode-based)
- Key rotation every 90 days
- Encrypted storage (bcrypt)

**Authorization:**
- Each unit can only submit their own data
- Admin role for dashboard access

**Data Protection:**
- HTTPS/TLS 1.3
- Data encryption at rest
- Audit logging

### 5. Retry Logic (Unit Side)

```
┌─────────────────────────────────────────┐
│         Retry Logic Flow                │
├─────────────────────────────────────────┤
│ 1st Attempt → Success → Complete        │
│               ↓ Fail                    │
│ 2nd Attempt (wait 30s) → Success        │
│               ↓ Fail                    │
│ 3rd Attempt (wait 60s) → Success        │
│               ↓ Fail                    │
│ Log Error → Alert Admin → Complete      │
└─────────────────────────────────────────┘
```

### 6. Monitoring Dashboard

**Features:**
- Real-time status of all 80 units
- Last sync time per unit
- Failed sync count (24h)
- Data volume trends
- Alert system for failures

**Technology:**
- React.js / Vue.js frontend
- WebSocket for real-time updates
- Chart.js / D3.js for visualization

## Data Flow

```
1. Unit Script Start (Task Scheduler)
2. Connect to Local JHCIS MySQL
3. Query Summary Data (with hcode filter)
4. Transform to JSON Format
5. Sign Request with API Key
6. POST to Central Hub HTTPS
7. Central Hub Validates API Key
8. Central Hub Validates Data Schema
9. Insert to Central Database
10. Return Success Response
11. Unit Log Sync Status
12. Complete
```

## Error Handling

**Unit Side:**
- Network timeout → Retry (3 attempts)
- API Key invalid → Alert admin, skip sync
- Data validation error → Log error, retry next cycle

**Central Hub:**
- Invalid API Key → 401 Unauthorized
- Invalid Data Schema → 400 Bad Request
- Database error → 500 Internal Server Error
- Rate limit exceeded → 429 Too Many Requests

## Scalability Considerations

**Current:** 80 units
**Future:** สามารถขยายถึง 200+ units

**Scaling Strategy:**
- Horizontal scaling: Add more API server instances
- Load balancer: Distribute requests
- Database read replicas: For dashboard queries
- Message queue: For high-volume periods

## Deployment Architecture

```
Production Environment:
┌─────────────────────────────────────────┐
│  Load Balancer (Nginx / HAProxy)        │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐  ┌───▼───┐  ┌───▼───┐
│ API   │  │ API   │  │ API   │
│ Server│  │ Server│  │ Server│
│  1    │  │  2    │  │  3    │
└───┬───┘  └───┬───┘  └───┬───┘
    │          │          │
    └──────────┼──────────┘
               │
    ┌──────────▼──────────┐
    │   Central Database  │
    │   (PostgreSQL)      │
    └─────────────────────┘
```

## Performance Targets

- **Sync Time:** < 5 นาที per unit per cycle
- **API Response:** < 500ms per request
- **Concurrent Requests:** 80 units simultaneously
- **Uptime:** 99.9%
- **Data Accuracy:** 100% (validated before insert)

## Next Steps

1. สร้าง Data Dictionary (data-dictionary-summary.md)
2. พัฒนา Central Database Schema
3. พัฒนา API Backend
4. พัฒนา Unit-side Node.js Script
5. สร้าง Monitoring Dashboard
6. ทดสอบระบบกับ 5 หน่วยแรก
7. Deploy ทั้ง 80 หน่วย
