# JHCIS Summary Centralization API Backend

Node.js/Express API Server สำหรับรับข้อมูล Summary จาก 80 หน่วย JHCIS

## 📋 สารบัญ

- [ภาพรวม](#ภาพรวม)
- [การติดตั้ง](#การติดตั้ง)
- [การตั้งค่า](#การตั้งค่า)
- [API Endpoints](#api-endpoints)
- [Data Dictionary](#data-dictionary)
- [Error Handling](#error-handling)
- [Security](#security)
- [Database Schema](#database-schema)

---

## ภาพรวม

API Server นี้ทำหน้าที่เป็นศูนย์กลางในการรับข้อมูล Summary จากหน่วยงาน JHCIS ทั้ง 80 หน่วย โดยมีคุณสมบัติ:

- ✅ **API Key Authentication** - ยืนยันตัวตนด้วย API Key
- ✅ **Data Validation** - ตรวจสอบความถูกต้องของข้อมูล
- ✅ **UPSERT Operation** - Insert/Update อัตโนมัติตาม hcode + report_date
- ✅ **Transaction Support** - รองรับ Batch Insert แบบ Transaction
- ✅ **Error Handling** - จัดการ Error อย่างสมบูรณ์
- ✅ **Security** - Helmet, CORS, Rate Limiting

---

## การติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
cd api-backend
npm install
```

### 2. ตั้งค่า Environment Variables

```bash
cp .env.example .env
# แก้ไขค่าใน .env ให้เหมาะสม
```

### 3. เตรียมฐานข้อมูล

สร้างตารางในฐานข้อมูล (ดู [Database Schema](#database-schema))

### 4. รัน Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

---

## การตั้งค่า

### Environment Variables (.env)

| Variable | คำอธิบาย | Default |
|----------|----------|---------|
| `PORT` | Port ของ Server | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `DB_HOST` | Database Host | localhost |
| `DB_PORT` | Database Port | 5432 |
| `DB_NAME` | Database Name | jhcis_central |
| `DB_USER` | Database User | postgres |
| `DB_PASSWORD` | Database Password | - |
| `CORS_ORIGIN` | CORS Allowed Origin | * |

---

## API Endpoints

### 1. POST /api/v1/sync/:summaryType

ส่งข้อมูล Summary ประเภทเดียว

**Parameters:**
- `summaryType` (path): `op`, `ip`, `er`, `pp`, `pharmacy`, `lab`, `radiology`, `financial`, `resource`

**Headers:**
```
Content-Type: application/json
X-API-Key: your-api-key-here
```

**Request Body (ตัวอย่าง - OP):**
```json
{
  "hcode": "10001000100",
  "report_date": "2026-03-21",
  "report_period": "2026-03",
  "total_visits": 150
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Summary data synced successfully",
  "data": {
    "hcode": "10001000100",
    "report_date": "2026-03-21",
    "summary_type": "op",
    "updated_at": "2026-03-21T23:00:00.000Z"
  },
  "statusCode": 200
}
```

---

### 2. POST /api/v1/sync/batch

ส่งข้อมูล Summary หลายประเภทในครั้งเดียว

**Headers:**
```
Content-Type: application/json
X-API-Key: your-api-key-here
```

**Request Body:**
```json
[
  {
    "summaryType": "op",
    "data": {
      "hcode": "10001000100",
      "report_date": "2026-03-21",
      "report_period": "2026-03",
      "total_visits": 150
    }
  },
  {
    "summaryType": "ip",
    "data": {
      "hcode": "10001000100",
      "report_date": "2026-03-21",
      "report_period": "2026-03",
      "total_admissions": 25,
      "total_bed_days": 120
    }
  }
]
```

**Response:**
```json
{
  "success": true,
  "message": "Batch sync completed",
  "summary": {
    "total": 2,
    "success": 2,
    "failed": 0
  },
  "results": [
    {
      "summaryType": "op",
      "hcode": "10001000100",
      "report_date": "2026-03-21",
      "status": "success"
    },
    {
      "summaryType": "ip",
      "hcode": "10001000100",
      "report_date": "2026-03-21",
      "status": "success"
    }
  ],
  "statusCode": 200
}
```

---

### 3. GET /api/v1/sync/types

ดึงรายการ Summary Types ที่รองรับ

**Response:**
```json
{
  "success": true,
  "data": {
    "supportedTypes": ["op", "ip", "er", "pp", "pharmacy", "lab", "radiology", "financial", "resource"],
    "descriptions": {
      "op": "Outpatient",
      "ip": "Inpatient",
      "er": "Emergency",
      "pp": "Preventive & Promotive",
      "pharmacy": "Pharmacy",
      "lab": "Laboratory",
      "radiology": "Radiology",
      "financial": "Financial",
      "resource": "Resource"
    }
  },
  "statusCode": 200
}
```

---

### 4. GET /api/v1/health

ตรวจสอบสถานะ API

**Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-03-21T23:00:00.000Z",
  "statusCode": 200
}
```

---

## Data Dictionary

### Common Fields (ทุกประเภท)

| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `hcode` | String(11) | ✅ | รหัสหน่วยงานสุขภาพ (11 หลัก) |
| `report_date` | Date (ISO) | ✅ | วันที่รายงาน (YYYY-MM-DD) |
| `report_period` | String | ✅ | รอบรายงาน (เช่น 2026-03) |

### Summary Type-Specific Fields

#### OP (Outpatient)
| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `total_visits` | Integer | ✅ | จำนวนผู้ป่วยนอกทั้งหมด |

#### IP (Inpatient)
| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `total_admissions` | Integer | ✅ | จำนวนผู้ป่วยในทั้งหมด |
| `total_bed_days` | Integer | ✅ | จำนวนวันนอนทั้งหมด |

#### ER (Emergency)
| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `total_erp` | Integer | ✅ | จำนวนผู้ป่วยฉุกเฉินทั้งหมด |
| `triage_1` | Integer | - | Triage ระดับ 1 |
| `triage_2` | Integer | - | Triage ระดับ 2 |
| `triage_3` | Integer | - | Triage ระดับ 3 |
| `triage_4` | Integer | - | Triage ระดับ 4 |
| `triage_5` | Integer | - | Triage ระดับ 5 |

#### PP (Preventive & Promotive)
| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `service_type` | String | ✅ | ประเภทบริการ PP |
| `total_services` | Integer | ✅ | จำนวนบริการ PP ทั้งหมด |

#### Pharmacy
| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `total_prescriptions` | Integer | ✅ | จำนวนใบสั่งยาทั้งหมด |
| `drug_categories` | Object | - | จำแนกตามหมวดหมู่ยา |

#### Laboratory
| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `total_tests` | Integer | ✅ | จำนวนการตรวจ lab ทั้งหมด |
| `test_categories` | Object | - | จำแนกตามหมวดหมู่การตรวจ |

#### Radiology
| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `total_exams` | Integer | ✅ | จำนวนการตรวจ radiology ทั้งหมด |
| `exam_types` | Object | - | จำแนกตามประเภทการตรวจ |

#### Financial
| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `total_revenue` | Number | ✅ | รายได้ทั้งหมด |
| `total_expense` | Number | ✅ | ค่าใช้จ่ายทั้งหมด |
| `revenue_categories` | Object | - | จำแนกตามหมวดหมู่รายได้ |

#### Resource
| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `staff_count` | Integer | ✅ | จำนวนบุคลากรทั้งหมด |
| `bed_capacity` | Integer | ✅ | จำนวนเตียง |
| `equipment_count` | Integer | ✅ | จำนวนอุปกรณ์ |

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "details": [...], // Optional validation details
  "statusCode": 400
}
```

### Error Codes

| Status Code | Error Code | คำอธิบาย |
|-------------|------------|----------|
| 400 | `BAD_REQUEST` | Request ไม่ถูกต้อง / Validation failed |
| 401 | `UNAUTHORIZED` | ไม่มี API Key |
| 403 | `FORBIDDEN` | API Key ไม่ถูกต้อง / ไม่ตรง hcode |
| 409 | `CONFLICT` | Duplicate entry |
| 429 | `TOO_MANY_REQUESTS` | เกิน Rate Limit |
| 500 | `INTERNAL_ERROR` | Server error |

### Validation Error Example

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "field": "hcode",
      "message": "hcode must be 11 characters long",
      "type": "string.length"
    },
    {
      "field": "total_visits",
      "message": "total_visits must be a number",
      "type": "number.base"
    }
  ],
  "statusCode": 400
}
```

---

## Security

### 1. API Key Authentication

- ส่ง API Key ผ่าน Header: `X-API-Key`
- ตรวจสอบกับตาราง `health_facilities`
- Reject ถ้า API Key ไม่ถูกต้องหรือ status != 'active'

### 2. Helmet

ตั้งค่า Security HTTP Headers:
- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- X-Frame-Options
- ฯลฯ

### 3. CORS

กำหนด Cross-Origin Resource Sharing Policy

### 4. Rate Limiting

- 100 requests ต่อ 15 นาที ต่อ IP
- ป้องกัน Brute Force attacks

---

## Database Schema

### ตาราง health_facilities

```sql
CREATE TABLE health_facilities (
  hcode VARCHAR(11) PRIMARY KEY,
  facility_name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ตาราง summary_* (ตัวอย่าง: summary_op)

```sql
CREATE TABLE summary_op (
  id SERIAL PRIMARY KEY,
  hcode VARCHAR(11) NOT NULL,
  report_date DATE NOT NULL,
  report_period VARCHAR(20) NOT NULL,
  summary_type VARCHAR(20) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_hcode_report_date UNIQUE (hcode, report_date)
);

-- สร้าง Index สำหรับ Performance
CREATE INDEX idx_summary_op_hcode ON summary_op(hcode);
CREATE INDEX idx_summary_op_report_date ON summary_op(report_date);
CREATE INDEX idx_summary_op_type ON summary_op(summary_type);
```

### ตารางอื่นๆ

สร้างตารางเดียวกันสำหรับแต่ละ summary type:
- `summary_ip`
- `summary_er`
- `summary_pp`
- `summary_pharmacy`
- `summary_lab`
- `summary_radiology`
- `summary_financial`
- `summary_resource`

---

## การใช้งาน

### ตัวอย่าง cURL

```bash
# ส่งข้อมูล OP
curl -X POST http://localhost:3000/api/v1/sync/op \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "hcode": "10001000100",
    "report_date": "2026-03-21",
    "report_period": "2026-03",
    "total_visits": 150
  }'

# ส่งข้อมูล Batch
curl -X POST http://localhost:3000/api/v1/sync/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '[
    {
      "summaryType": "op",
      "data": {
        "hcode": "10001000100",
        "report_date": "2026-03-21",
        "report_period": "2026-03",
        "total_visits": 150
      }
    },
    {
      "summaryType": "ip",
      "data": {
        "hcode": "10001000100",
        "report_date": "2026-03-21",
        "report_period": "2026-03",
        "total_admissions": 25,
        "total_bed_days": 120
      }
    }
  ]'
```

---

## License

MIT License - JHCIS Team
