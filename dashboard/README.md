# JHCIS Summary Centralization Dashboard

Dashboard สำหรับตรวจสอบสถานะการส่งข้อมูลจาก 80 หน่วย JHCIS

## 📋 คุณสมบัติ

### 1. แสดงสถานะการส่งข้อมูล
- **Status Green (ส่งแล้ว)** / **Red (ยังไม่ส่ง)**
- แสดงชื่อหน่วยงาน, hcode, เวลา sync ล่าสุด
- แสดงจำนวนข้อมูลที่ส่ง (9 ประเภท: OP, IP, ER, ADT, DC, REF, LAB, XRY, DRG)

### 2. กราฟสรุปข้อมูล
- **กราฟเส้น**: ยอดผู้ป่วยนอก (OP) รายวัน (รวม 80 หน่วย)
- **กราฟแท่ง**: จำนวนหน่วยงานที่ส่งข้อมูลแต่ละวัน (7 วันล่าสุด)
- **Pie chart**: สถานะการส่งข้อมูล (Sent vs Not Sent)

### 3. ฟีเจอร์เพิ่มเติม
- ✅ Filter ตามวันที่
- ✅ Search ตามชื่อหน่วยงาน หรือ hcode
- ✅ Export to CSV
- ✅ Auto-refresh ทุก 1 นาที
- ✅ Responsive design (Desktop และ Mobile)

## 🚀 การติดตั้งและใช้งาน

### วิธีที่ 1: เปิดไฟล์ HTML โดยตรง
```bash
# เปิดไฟล์ index.html ในเบราว์เซอร์
start dashboard\index.html
```

### วิธีที่ 2: ใช้ HTTP Server (แนะนำ)
```bash
cd dashboard
npm install
npm start
```
จากนั้นเปิดเบราว์เซอร์ไปที่: `http://localhost:8080`

### วิธีที่ 3: ใช้ Live Server (พัฒนา)
```bash
cd dashboard
npm install
npm run dev
```

## 📁 โครงสร้างไฟล์

```
dashboard/
├── index.html          # หน้าหลักของ dashboard
├── styles.css          # CSS styling
├── app.js              # Frontend logic และ chart rendering
├── api.js              # API calls to backend
├── package.json        # Node.js dependencies
└── README.md           # คู่มือนี้
```

## 🔌 การเชื่อมต่อ API

Dashboard เรียกข้อมูลจาก Central API ผ่าน endpoint ต่อไปนี้:

### 1. Dashboard Summary
```
GET /api/jhcis/dashboard/summary?date=YYYY-MM-DD
```

**Response:**
```json
{
  "facilities": [...],
  "summary": {
    "total": 80,
    "sent": 65,
    "not_sent": 15,
    "total_op": 12500
  },
  "op_stats": [...],
  "facilities_stats": [...]
}
```

### 2. Facilities List
```
GET /api/jhcis/dashboard/facilities?date=YYYY-MM-DD&search=xxx&status=sent
```

**Response:**
```json
[
  {
    "hcode": "H00001",
    "facility_name": "โรงพยาบาลนครปฐม",
    "status": "sent",
    "last_sync_time": "2026-03-21T10:30:00Z",
    "total_records": 850,
    "data_counts": {
      "op": 450,
      "ip": 80,
      "er": 30,
      "admit": 70,
      "discharge": 70,
      "refer": 20,
      "lab": 150,
      "xray": 80,
      "drug": 200
    }
  }
]
```

### 3. OP Statistics
```
GET /api/jhcis/dashboard/op-stats?days=30
```

**Response:**
```json
[
  {
    "date": "2026-03-21",
    "op_count": 4500,
    "facility_count": 65
  }
]
```

### 4. Facilities Statistics
```
GET /api/jhcis/dashboard/facilities-stats
```

**Response:**
```json
[
  {
    "date": "2026-03-21",
    "sent_count": 65,
    "not_sent_count": 15
  }
]
```

## 🎨 การปรับแต่ง

### เปลี่ยนสีธีม
แก้ไขไฟล์ `styles.css` ส่วน `:root`:
```css
:root {
    --primary-color: #0d6efd;
    --success-color: #198754;
    --danger-color: #dc3545;
    --info-color: #0dcaf0;
}
```

### เปลี่ยน Auto-refresh interval
แก้ไขไฟล์ `app.js` ฟังก์ชัน `startAutoRefresh()`:
```javascript
refreshInterval = setInterval(() => {
    refreshData();
}, 60000); // เปลี่ยนเป็น milliseconds ที่ต้องการ
```

## 🧪 Development Mode

Dashboard มี mock data สำหรับการพัฒนา หาก API ยังไม่พร้อม:

1. เปิด `app.js`
2. ในฟังก์ชัน `initializeDashboard()` จะมีการ fallback ไปยัง `loadMockData()`
3. ข้อมูลจำลองจะแสดง 80 หน่วย พร้อมกราฟและสถิติ

## 📱 Responsive Design

Dashboard ออกแบบให้ใช้งานได้ทั้ง:
- **Desktop**: แสดงครบทุกฟีเจอร์
- **Tablet**: ปรับขนาดกราฟและตาราง
- **Mobile**: แสดงแบบ scrollable, ซ่อนบางคอลัมน์

## 🔧 Troubleshooting

### Dashboard ไม่โหลดข้อมูล
1. ตรวจสอบว่า API endpoint พร้อมใช้งาน
2. เปิด Developer Console (F12) ดู error
3. ตรวจสอบ CORS policy หากเรียก API จากต่างโดเมน

### กราฟไม่แสดง
1. ตรวจสอบว่า Chart.js โหลดสำเร็จ
2. ตรวจสอบ canvas element มี id ถูกต้อง
3. ดู console error

### Auto-refresh ไม่ทำงาน
1. ตรวจสอบ checkbox "Auto-refresh" ถูกเลือก
2. ดู console มี error หรือไม่
3. ตรวจสอบ network request

## 📊 การ Export ข้อมูล

กดปุ่ม "Export CSV" จะดาวน์โหลดไฟล์ CSV พร้อมข้อมูล:
- hcode
- facility_name
- status
- last_sync_time
- total_records
- data_counts (9 ประเภท)

## 📝 หมายเหตุ

- Dashboard ใช้ **Bootstrap 5.3** สำหรับ layout
- ใช้ **Chart.js** สำหรับกราฟ
- ใช้ **Vanilla JavaScript** (ไม่ต้องการ build tool)
- รองรับ **Thai locale** สำหรับวันที่และเวลา

## 📞 ติดต่อ

สำหรับคำถามหรือปัญหาทางเทคนิค กรุณาติดต่อทีม JHCIS

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-21  
**License:** MIT
