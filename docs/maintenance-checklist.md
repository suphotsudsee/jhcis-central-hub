# เช็คลิสต์การดูแลรักษา
# Maintenance Checklist - JHCIS Summary Centralization

## สารบัญ (Table of Contents)

1. [การดูแลรายวัน (Daily Checks)](#1-การดูแลรายวัน-daily-checks)
2. [การดูแลรายสัปดาห์ (Weekly Checks)](#2-การดูแลรายสัปดาห์-weekly-checks)
3. [การดูแลรายเดือน (Monthly Checks)](#3-การดูแลรายเดือน-monthly-checks)
4. [การดูแลรายไตรมาส (Quarterly Checks)](#4-การดูแลรายไตรมาส-quarterly-checks)
5. [การดูแลรายปี (Annual Checks)](#5-การดูแลรายปี-annual-checks)
6. [Incident Response Checklist](#6-incident-response-checklist)
7. [Change Management Checklist](#7-change-management-checklist)

---

## 1. การดูแลรายวัน (Daily Checks)

### 1.1 หน่วยย่อย (80 Units) - อัตโนมัติ

#### ตรวจสอบผ่าน Dashboard

- [ ] **Sync Status:** หน่วยทั้งหมดส่งข้อมูลสำเร็จ
- [ ] **Failed Units:** ไม่มีหน่วยที่ล้มเหลวเกิน 24 ชั่วโมง
- [ ] **Data Quality:** ข้อมูลสมบูรณ์ ไม่มี Missing Fields
- [ ] **Last Sync Time:** ทุกหน่วย Sync ภายใน 24 ชั่วโมง

#### ตรวจสอบ Log (สำหรับหน่วยที่มีปัญหา)

```powershell
# ตรวจสอบหน่วยที่ล้มเหลว
Get-Content "C:\JHCIS\logs\jhcis_sync.log" | Select-String "ERROR"

# ส่งอีเมลแจ้งเตือน (ถ้ามี)
# ดู Alert Email ที่ตั้งไว้
```

### 1.2 เซิร์ฟเวอร์ส่วนกลาง

#### System Health Check

```bash
# รัน Health Check Script
#!/bin/bash
echo "=== Daily Health Check ==="
echo "Date: $(date)"

# 1. Service Status
echo "\n=== Service Status ==="
systemctl is-active jhcis-api && echo "✓ API Running" || echo "✗ API Down"
systemctl is-active nginx && echo "✓ Nginx Running" || echo "✗ Nginx Down"
systemctl is-active postgresql && echo "✓ PostgreSQL Running" || echo "✗ PostgreSQL Down"

# 2. Disk Usage
echo "\n=== Disk Usage ==="
df -h / | awk 'NR==2 {print "Root: " $5 " used"}'
df -h /opt/jhcis | awk 'NR==2 {print "JHCIS: " $5 " used"}'

# 3. Memory Usage
echo "\n=== Memory Usage ==="
free -h | awk 'NR==2 {print "RAM: " $3 "/" $2 " used (" int($3/$2*100) "%)"}'

# 4. API Health
echo "\n=== API Health ==="
curl -s https://central-jhcis.moph.go.th/api/health | jq .

# 5. Database Connections
echo "\n=== DB Connections ==="
sudo -u postgres psql -d jhcis_central -c "SELECT count(*) as active_connections FROM pg_stat_activity;" -t

# 6. Error Count (Last 24h)
echo "\n=== Errors (24h) ==="
grep -c "ERROR" /var/log/jhcis/api.log
```

#### Checklist

- [ ] **API Service:** รันปกติ (systemctl active)
- [ ] **Nginx:** รันปกติ
- [ ] **Database:** รันปกติ
- [ ] **Disk Usage:** < 80%
- [ ] **Memory Usage:** < 85%
- [ ] **CPU Usage:** < 80% (เฉลี่ย)
- [ ] **API Health Endpoint:** Response 200 OK
- [ ] **Error Count:** < 10 errors/วัน
- [ ] **SSL Certificate:** ไม่หมดอายุใน 30 วัน

### 1.3 Backup Verification

- [ ] **Backup Script:** รันสำเร็จเมื่อคืน (03:00)
- [ ] **Backup File:** มีไฟล์ใหม่ใน `/opt/jhcis/backups/`
- [ ] **Backup Size:** ขนาดเหมาะสม (ไม่เล็กเกินไป)
- [ ] **Backup Log:** ไม่มี Error

```bash
# ตรวจสอบ Backup
ls -lth /opt/jhcis/backups/*.dump | head -1
cat /var/log/jhcis/backup.log | tail -20
```

---

## 2. การดูแลรายสัปดาห์ (Weekly Checks)

### 2.1 Performance Review

#### API Performance

```bash
# ตรวจสอบ Response Time (สัปดาห์นี้)
# จาก Prometheus/Grafana หรือ Log
grep "response_time" /var/log/jhcis/api.log | \
    awk '{sum+=$NF; count++} END {print "Avg Response Time: " sum/count " ms"}'

# ตรวจสอบ Error Rate
grep "ERROR" /var/log/jhcis/api.log | wc -l
```

**เป้าหมาย:**
- [ ] **Average Response Time:** < 500ms
- [ ] **P95 Response Time:** < 1000ms
- [ ] **Error Rate:** < 1%
- [ ] **Success Rate:** > 99%

#### Database Performance

```sql
-- ตรวจสอบ Slow Queries (สัปดาห์นี้)
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC
LIMIT 10;

-- ตรวจสอบ Table Bloat
SELECT schemaname, tablename, n_dead_tup, n_live_tup,
       n_dead_tup::float / (n_live_tup + n_dead_tup) AS dead_ratio
FROM pg_stat_user_tables
WHERE n_live_tup > 1000
ORDER BY dead_ratio DESC
LIMIT 10;
```

- [ ] **No Critical Slow Queries:** ไม่มี Query > 5 วินาที
- [ ] **Table Bloat:** < 20% dead tuples
- [ ] **Index Usage:** Index ถูกใช้ถูกต้อง

### 2.2 Security Review

#### Log Review

```bash
# ตรวจสอบ Failed Login Attempts
grep "401\|403" /var/log/nginx/access.log | \
    awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# ตรวจสอบ Suspicious Activity
grep "SQL injection\|XSS\|../" /var/log/nginx/access.log | wc -l
```

- [ ] **Failed Logins:** < 100 attempts/สัปดาห์ (จาก IP เดียวกัน)
- [ ] **Suspicious Patterns:** ไม่มี SQL Injection/XSS attempts
- [ ] **Rate Limiting:** ทำงานถูกต้อง
- [ ] **SSL/TLS:** ไม่มี Weak Cipher Usage

#### Vulnerability Scan

- [ ] **OS Security Updates:** ติดตั้งแล้ว
- [ ] **NPM Audit:** `npm audit` ไม่มี Critical vulnerabilities
- [ ] **Dependencies:** อัปเดตแล้ว

```bash
# ใน API Directory
cd /opt/jhcis/api
npm audit
npm audit fix
```

### 2.3 Data Quality Review

- [ ] **Completeness:** 80 หน่วยส่งข้อมูลครบ
- [ ] **Accuracy:** ข้อมูลถูกต้อง (ตรวจสอบ Sample)
- [ ] **Consistency:** Format เหมือนกันทุกหน่วย
- [ ] **Timeliness:** ข้อมูลส่งภายในเวลาที่กำหนด

```sql
-- ตรวจสอบหน่วยที่ไม่ส่งข้อมูล
SELECT u.unit_code, u.unit_name, MAX(s.report_date) as last_report
FROM hospital_units u
LEFT JOIN summary_data s ON u.id = s.unit_id
GROUP BY u.id, u.unit_code, u.unit_name
HAVING MAX(s.report_date) < CURRENT_DATE - INTERVAL '2 days'
ORDER BY last_report;
```

### 2.4 Cleanup Tasks

```bash
# ลบ Log เก่า (เก็บ 30 วัน)
find /var/log/jhcis -name "*.log" -mtime +30 -delete

# ลบ Temporary Files
rm -rf /tmp/jhcis_*

# Vacuum Database (สัปดาห์ละครั้ง)
psql -U jhcis_admin -d jhcis_central -c "VACUUM ANALYZE;"
```

- [ ] **Old Logs:** ลบแล้ว
- [ ] **Temp Files:** ลบแล้ว
- [ ] **Database:** VACUUM แล้ว

---

## 3. การดูแลรายเดือน (Monthly Checks)

### 3.1 System Audit

#### Full System Review

```bash
# สร้าง Monthly Report Script
#!/bin/bash
REPORT_DATE=$(date +%Y-%m)
REPORT_FILE="/opt/jhcis/reports/monthly_${REPORT_DATE}.txt"

echo "Monthly Report - ${REPORT_DATE}" > $REPORT_FILE
echo "Generated: $(date)" >> $REPORT_FILE

# 1. Uptime Statistics
echo "\n=== Uptime ===" >> $REPORT_FILE
uptime >> $REPORT_FILE

# 2. Disk Usage Trend
echo "\n=== Disk Usage ===" >> $REPORT_FILE
df -h >> $REPORT_FILE

# 3. Top Errors
echo "\n=== Top Errors ===" >> $REPORT_FILE
grep "ERROR" /var/log/jhcis/api.log | sort | uniq -c | sort -rn | head -20 >> $REPORT_FILE

# 4. API Statistics
echo "\n=== API Stats ===" >> $REPORT_FILE
# จาก Database หรือ Monitoring
```

- [ ] **System Report:** สร้างแล้ว
- [ ] **Performance Metrics:** รวบรวมแล้ว
- [ ] **Error Analysis:** วิเคราะห์แล้ว
- [ ] **Trend Analysis:** เปรียบเทียบกับเดือนก่อน

### 3.2 Security Audit

#### Access Review

- [ ] **User Accounts:** ตรวจสอบ User ที่มีสิทธิ์เข้าถึงระบบ
- [ ] **API Keys:** หมุน API Keys (ทุก 90 วัน)
- [ ] **SSH Keys:** ตรวจสอบ SSH Keys ที่อนุญาต
- [ ] **Service Accounts:** ตรวจสอบ Service Accounts

```bash
# ตรวจสอบ User Accounts
cat /etc/passwd | grep -E "jhcis|admin"

# ตรวจสอบ Authorized Keys
cat /home/*/authorized_keys 2>/dev/null

# ตรวจสอบ Sudoers
cat /etc/sudoers | grep -v "^#" | grep -v "^$"
```

#### Certificate Management

- [ ] **SSL Certificate:** ตรวจสอบวันหมดอายุ
- [ ] **Intermediate Certificates:** อัปเดตแล้ว
- [ ] **Certificate Transparency:** ตรวจสอบใน CT Log

```bash
# ตรวจสอบ SSL
openssl x509 -in /etc/letsencrypt/live/central-jhcis.moph.go.th/cert.pem \
    -noout -dates -subject
```

### 3.3 Backup & Recovery Test

#### Backup Verification

```bash
# ตรวจสอบ Backup Integrity
cd /opt/jhcis/backups
pg_verifybackup latest.dump 2>/dev/null || echo "Backup OK"

# ตรวจสอบ Backup Size
du -sh /opt/jhcis/backups/

# ตรวจสอบ Backup Age
ls -lt /opt/jhcis/backups/*.dump | head -1
```

- [ ] **Backup Integrity:** ไฟล์ไม่เสียหาย
- [ ] **Backup Completeness:** ข้อมูลครบ
- [ ] **Backup Age:** ไม่เกิน 30 วัน
- [ ] **Offsite Backup:** มีสำรองนอกสถานที่ (ถ้ามี)

#### Recovery Test (เดือนละ 1 ครั้ง)

```bash
# ทดสอบ Restore ใน Test Environment
# 1. สร้าง Test Database
createdb -U jhcis_admin jhcis_test_restore

# 2. Restore
pg_restore -U jhcis_admin -d jhcis_test_restore latest.dump

# 3. ตรวจสอบ
psql -U jhcis_admin -d jhcis_test_restore -c "SELECT count(*) FROM summary_data;"

# 4. ลบ Test Database
dropdb -U jhcis_admin jhcis_test_restore
```

- [ ] **Restore Test:** สำเร็จ
- [ ] **Data Integrity:** ข้อมูลถูกต้อง
- [ ] **Recovery Time:** < 1 ชั่วโมง

### 3.4 Capacity Planning

#### Resource Review

```sql
-- ตรวจสอบ Data Growth
SELECT 
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS records_count,
    pg_size_pretty(SUM(pg_total_relation_size('summary_data'))) AS total_size
FROM summary_data
GROUP BY month
ORDER BY month DESC
LIMIT 12;
```

- [ ] **Storage Growth:** วิเคราะห์แนวโน้ม
- [ ] **Connection Growth:** ตรวจสอบ Concurrent Connections
- [ ] **API Usage:** ตรวจสอบ Request Volume
- [ ] **Capacity Forecast:** คาดการณ์ 3-6 เดือนข้างหน้า

---

## 4. การดูแลรายไตรมาส (Quarterly Checks)

### 4.1 Performance Optimization

#### Database Optimization

```sql
-- Reindex (ถ้าจำเป็น)
REINDEX DATABASE jhcis_central;

-- Update Statistics
ANALYZE VERBOSE;

-- ตรวจสอบ Index Usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

- [ ] **Database:** REINDEX และ ANALYZE แล้ว
- [ ] **Query Optimization:** ปรับปรุง Slow Queries
- [ ] **Index Review:** ลบ Index ที่ไม่ใช้
- [ ] **Connection Pool:** ปรับขนาดตาม Usage

#### API Optimization

- [ ] **Code Review:** ตรวจสอบ Code Performance
- [ ] **Caching Strategy:** ปรับปรุง Cache Hit Rate
- [ ] **Rate Limiting:** ปรับตาม Usage Pattern
- [ ] **Load Testing:** ทดสอบ Load ใหม่

```bash
# Load Test ด้วย Apache Bench
ab -n 10000 -c 100 https://central-jhcis.moph.go.th/api/health
```

### 4.2 Security Assessment

#### Penetration Testing

- [ ] **External Pentest:** จัดทำโดยทีม Security
- [ ] **Vulnerability Scan:** สแกนช่องโหว่
- [ ] **Code Audit:** ตรวจสอบ Security ใน Code
- [ ] **Security Training:** อบรมทีม

#### Compliance Review

- [ ] **Data Privacy:** เป็นไปตาม PDPA
- [ ] **Audit Logs:** บันทึกครบถ้วน
- [ ] **Access Control:** ตรวจสอบสิทธิ์เหมาะสม
- [ ] **Encryption:** ข้อมูลเข้ารหัสถูกต้อง

### 4.3 Documentation Review

- [ ] **Technical Docs:** อัปเดตแล้ว
- [ ] **User Manuals:** อัปเดตแล้ว
- [ ] **API Documentation:** อัปเดตแล้ว
- [ ] **Incident Procedures:** อัปเดตแล้ว
- [ ] **Runbooks:** อัปเดตแล้ว

### 4.4 Training & Knowledge Transfer

- [ ] **Team Training:** อบรมทีมใหม่/ทีมเดิม
- [ ] **Knowledge Base:** อัปเดตบทความ
- [ ] **Lessons Learned:** บันทึกจาก Incident
- [ ] **Best Practices:** เผยแพร่แนวทาง

---

## 5. การดูแลรายปี (Annual Checks)

### 5.1 System Architecture Review

- [ ] **Architecture Assessment:** ประเมินสถาปัตยกรรม
- [ ] **Scalability Review:** ตรวจสอบการขยายระบบ
- [ ] **Technology Stack:** พิจารณาอัปเกรด
- [ ] **Technical Debt:** ลดหนี้ทางเทคนิค

### 5.2 Disaster Recovery Drill

#### Full DR Test

```
ขั้นตอนการทดสอบ:

1. ประกาศ DR Test (แจ้งผู้เกี่ยวข้อง)
2. Simulate Failure (ปิด Primary Server)
3. Activate DR Site (เริ่มระบบสำรอง)
4. Verify Operations (ตรวจสอบการทำงาน)
5. Measure RTO/RPO (วัดเวลาการกู้คืน)
6. Return to Normal (กลับระบบปกติ)
7. Document Lessons (บันทึกบทเรียน)
```

- [ ] **RTO (Recovery Time Objective):** < 4 ชั่วโมง
- [ ] **RPO (Recovery Point Objective):** < 1 ชั่วโมง
- [ ] **DR Documentation:** อัปเดตแล้ว
- [ ] **Team Readiness:** ทีมพร้อมปฏิบัติงาน

### 5.3 Vendor Review

- [ ] **Hosting Provider:** ประเมินบริการ
- [ ] **SSL Provider:** ต่ออายุ Certificate
- [ ] **Support Contracts:** ต่ออายุสัญญา
- [ ] **SLA Review:** ตรวจสอบ SLA

### 5.4 Budget & Resource Planning

- [ ] **Infrastructure Budget:** วางแผนงบประมาณ
- [ ] **Headcount Planning:** วางแผนทีมงาน
- [ ] **Tool Licensing:** ต่ออายุ License
- [ ] **Training Budget:** วางแผนการอบรม

---

## 6. Incident Response Checklist

### 6.1 P1 - Critical Incident

```
เมื่อเกิด P1 Incident:

1. [ ] ประกาศ Incident (แจ้งทีม War Room)
2. [ ] เริ่ม Incident Response Timer
3. [ ] ระบุ Root Cause (เบื้องต้น)
4. [ ] ดำเนินการ Mitigation
5. [ ] อัปเดตสถานะทุก 30 นาที
6. [ ] แจ้งผู้เกี่ยวข้อง (Stakeholders)
7. [ ] บันทึก Timeline
8. [ ] Post-Incident Review (ภายใน 48 ชม.)
9. [ ] สร้าง Action Items
10. [ ] อัปเดต Runbook
```

### 6.2 P2 - High Severity Incident

```
เมื่อเกิด P2 Incident:

1. [ ] สร้าง Ticket
2. [ ] แจ้งทีมพัฒนา
3. [ ] ระบุและบันทึกปัญหา
4. [ ] ดำเนินการแก้ไข
5. [ ] อัปเดตสถานะทุก 2 ชั่วโมง
6. [ ] ทดสอบแก้ไข
7. [ ] ปิด Ticket
8. [ ] บันทึกความรู้
```

---

## 7. Change Management Checklist

### 7.1 Production Deployment

```
ก่อน Deploy Production:

1. [ ] Code Review สำเร็จ
2. [ ] Unit Tests ผ่าน
3. [ ] Integration Tests ผ่าน
4. [ ] Security Scan ผ่าน
5. [ ] Performance Tests ผ่าน
6. [ ] Staging Deployment สำเร็จ
7. [ ] Rollback Plan มีแล้ว
8. [ ] Change Request อนุมัติแล้ว
9. [ ] Maintenance Window ประกาศแล้ว
10. [ ] Team On-call พร้อม
```

### 7.2 Configuration Change

```
ก่อนเปลี่ยน Configuration:

1. [ ] Backup Config เดิม
2. [ ] ทดสอบใน Staging
3. [ ] Document การเปลี่ยนแปลง
4. [ ] แจ้งทีมที่เกี่ยวข้อง
5. [ ] กำหนด Rollback Plan
6. [ ] ดำเนินการเปลี่ยน
7. [ ] ตรวจสอบผลลัพธ์
8. [ ] อัปเดต Documentation
```

---

## แนบท้าย (Appendix)

### A. Maintenance Schedule Summary

| กิจกรรม | ความถี่ | ผู้รับผิดชอบ | เวลาที่ใช้ |
|---------|---------|--------------|------------|
| Daily Health Check | รายวัน | On-call Engineer | 30 นาที |
| Weekly Review | รายสัปดาห์ | DevOps Team | 2 ชั่วโมง |
| Monthly Audit | รายเดือน | System Admin | 4 ชั่วโมง |
| Quarterly Optimization | รายไตรมาส | Dev Team + Ops | 1-2 วัน |
| Annual DR Drill | รายปี | All Teams | 1 สัปดาห์ |

### B. Contact Matrix

| บทบาท | ชื่อ | โทรศัพท์ | Email |
|-------|------|----------|-------|
| On-call Engineer | - | 08X-XXX-XXXX | oncall@jhcis.moph.go.th |
| System Admin | - | 08X-XXX-XXXX | admin@jhcis.moph.go.th |
| Database Admin | - | 08X-XXX-XXXX | dba@jhcis.moph.go.th |
| Security Team | - | 08X-XXX-XXXX | security@jhcis.moph.go.th |
| Manager | - | 08X-XXX-XXXX | manager@jhcis.moph.go.th |

### C. Tools & Scripts

#### Daily Check Script

```bash
#!/bin/bash
# /opt/jhcis/scripts/daily-check.sh

LOG_FILE="/var/log/jhcis/daily-check.log"
DATE=$(date +%Y-%m-%d)

echo "=== Daily Check ${DATE} ===" >> $LOG_FILE

# Services
systemctl is-active jhcis-api && echo "✓ API" >> $LOG_FILE || echo "✗ API" >> $LOG_FILE
systemctl is-active nginx && echo "✓ Nginx" >> $LOG_FILE || echo "✗ Nginx" >> $LOG_FILE
systemctl is-active postgresql && echo "✓ PostgreSQL" >> $LOG_FILE || echo "✗ PostgreSQL" >> $LOG_FILE

# Disk
df -h / | awk 'NR==2 {print "Disk: " $5}' >> $LOG_FILE

# Backup
ls -lt /opt/jhcis/backups/*.dump | head -1 | awk '{print "Backup: " $9}' >> $LOG_FILE

# ส่ง Email (ถ้ามี)
# mail -s "Daily Check ${DATE}" admin@jhcis.moph.go.th < $LOG_FILE
```

#### Weekly Report Script

```bash
#!/bin/bash
# /opt/jhcis/scripts/weekly-report.sh

REPORT_DATE=$(date +%Y-%m-%d)
REPORT_FILE="/opt/jhcis/reports/weekly_${REPORT_DATE}.html"

# สร้าง HTML Report
cat > $REPORT_FILE << EOF
<html>
<head><title>Weekly Report - ${REPORT_DATE}</title></head>
<body>
<h1>Weekly System Report</h1>
<p>Generated: ${REPORT_DATE}</p>
<h2>Uptime</h2>
<pre>$(uptime)</pre>
<h2>Disk Usage</h2>
<pre>$(df -h)</pre>
<h2>Top Errors</h2>
<pre>$(grep "ERROR" /var/log/jhcis/api.log | sort | uniq -c | sort -rn | head -10)</pre>
</body>
</html>
EOF

# ส่ง Email
# mail -s "Weekly Report ${REPORT_DATE}" -a $REPORT_FILE admin@jhcis.moph.go.th
```

---

### D. Maintenance Calendar Template

```
ปฏิทินการดูแลรักษา:

รายวัน:
  - 08:00: Daily Health Check
  - 09:00: Review Overnight Logs
  - 17:00: End-of-Day Summary

รายสัปดาห์:
  - จันทร์: Performance Review
  - พุธ: Security Log Review
  - ศุกร์: Cleanup & Backup Verification

รายเดือน:
  - สัปดาห์ 1: Monthly Audit
  - สัปดาห์ 2: Security Review
  - สัปดาห์ 3: Backup & Recovery Test
  - สัปดาห์ 4: Capacity Planning

รายไตรมาส:
  - Q1 (ม.ค.): Performance Optimization
  - Q2 (เม.ย.): Security Assessment
  - Q3 (ก.ค.): Documentation Review
  - Q4 (ต.ค.): DR Drill

รายปี:
  - มกราคม: Annual Planning
  - มิถุนายน: Mid-Year Review
  - ธันวาคม: Year-End Assessment
```

---

**เอกสารเวอร์ชัน:** 1.0  
**อัปเดตล่าสุด:** 21 มีนาคม 2026  
**ผู้รับผิดชอบ:** ทีมพัฒนา JHCIS
