# JHCIS Summary Data Dictionary

## ข้อมูล Summary ที่จะดึงจากแต่ละหน่วย JHCIS

### 1. ข้อมูลพื้นฐาน (Core Summary Fields)

| Field Name | Type | Description | Source Table | Mandatory |
|------------|------|-------------|--------------|-----------|
| `hcode` | VARCHAR(10) | รหัสหน่วยงาน (Hospital Code) | ORG_MAIN | ✅ |
| `sync_date` | DATETIME | วันที่และเวลาที่ดึงข้อมูล | System Generated | ✅ |
| `report_date` | DATE | วันที่ของรายงาน (วันสิ้นสุด period) | System Generated | ✅ |
| `period_type` | VARCHAR(20) | ประเภท period (daily/weekly/monthly) | Parameter | ✅ |

### 2. ข้อมูลบริการผู้ป่วยนอก (OP Summary)

| Field Name | Type | Description | Source Table | Mandatory |
|------------|------|-------------|--------------|-----------|
| `op_total_visits` | INT | จำนวนผู้ป่วยนอกทั้งหมด | OP_MAIN | ✅ |
| `op_new_patients` | INT | ผู้ป่วยใหม่ | OP_MAIN | ✅ |
| `op_old_patients` | INT | ผู้ป่วยเก่า | OP_MAIN | ✅ |
| `op_emergency_cases` | INT | กรณีฉุกเฉิน | OP_MAIN | ✅ |
| `op_referral_in` | INT | Refer เข้า | OP_MAIN | ✅ |
| `op_referral_out` | INT | Refer ออก | OP_MAIN | ✅ |
| `op_top_diag_codes` | JSON | 5 ICD-10 codes ที่พบบ่อยที่สุด | OP_DIAG | ✅ |
| `op_avg_wait_time` | DECIMAL(5,2) | เวลารอเฉลี่ย (นาที) | OP_SERVICE | ⭕ |

### 3. ข้อมูลบริการผู้ป่วยใน (IP Summary)

| Field Name | Type | Description | Source Table | Mandatory |
|------------|------|-------------|--------------|-----------|
| `ip_total_admissions` | INT | จำนวนผู้ป่วยในรับใหม่ | IP_MAIN | ✅ |
| `ip_total_discharges` | INT | จำนวนผู้ป่วยในจำหน่าย | IP_MAIN | ✅ |
| `ip_current_census` | INT | จำนวนผู้ป่วยในปัจจุบัน | IP_MAIN | ✅ |
| `ip_los_avg` | DECIMAL(5,2) | Length of Stay เฉลี่ย (วัน) | IP_MAIN | ✅ |
| `ip_top_diag_codes` | JSON | 5 ICD-10 codes ที่พบบ่อยที่สุด | IP_DIAG | ✅ |
| `ip_surgery_count` | INT | จำนวนผ่าตัด | IP_PROC | ✅ |
| `ip_death_count` | INT | จำนวนเสียชีวิต | IP_OUTCOME | ✅ |
| `ip_referral_in` | INT | Refer เข้า | IP_MAIN | ✅ |
| `ip_referral_out` | INT | Refer ออก | IP_MAIN | ✅ |

### 4. ข้อมูลบริการห้องฉุกเฉิน (ER Summary)

| Field Name | Type | Description | Source Table | Mandatory |
|------------|------|-------------|--------------|-----------|
| `er_total_visits` | INT | จำนวนผู้ป่วย ER ทั้งหมด | ER_MAIN | ✅ |
| `er_triage_level_1` | INT | ระดับความรุนแรง 1 (ฉุกเฉินที่สุด) | ER_TRIAGE | ✅ |
| `er_triage_level_2` | INT | ระดับความรุนแรง 2 | ER_TRIAGE | ✅ |
| `er_triage_level_3` | INT | ระดับความรุนแรง 3 | ER_TRIAGE | ✅ |
| `er_triage_level_4` | INT | ระดับความรุนแรง 4 | ER_TRIAGE | ✅ |
| `er_triage_level_5` | INT | ระดับความรุนแรง 5 | ER_TRIAGE | ✅ |
| `er_admission_rate` | DECIMAL(5,2) | อัตรา admit (%) | ER_OUTCOME | ✅ |
| `er_discharge_rate` | DECIMAL(5,2) | อัตราจำหน่าย (%) | ER_OUTCOME | ✅ |
| `er_death_count` | INT | จำนวนเสียชีวิต | ER_OUTCOME | ✅ |

### 5. ข้อมูลบริการส่งเสริมสุขภาพ (PP Summary)

| Field Name | Type | Description | Source Table | Mandatory |
|------------|------|-------------|--------------|-----------|
| `pp_anc_total` | INT | จำนวน ANC ทั้งหมด | PP_MCH | ✅ |
| `pp_anc_first_tri` | INT | ANC ไตรมาสแรก | PP_MCH | ✅ |
| `pp_fp_new_acceptors` | INT | ผู้รับบริการ FP รายใหม่ | PP_FP | ✅ |
| `pp_immunization_dpt` | INT | วัคซีน DPT | PP_IMMUN | ✅ |
| `pp_immunization_mmr` | INT | วัคซีน MMR | PP_IMMUN | ✅ |
| `pp_immunization_opv` | INT | วัคซีน OPV | PP_IMMUN | ✅ |
| `pp_ncd_screening_ht` | INT | คัดกรองความดันโลหิตสูง | PP_NCD | ✅ |
| `pp_ncd_screening_dm` | INT | คัดกรองเบาหวาน | PP_NCD | ✅ |

### 6. ข้อมูลเภสัชกรรม (Pharmacy Summary)

| Field Name | Type | Description | Source Table | Mandatory |
|------------|------|-------------|--------------|-----------|
| `phx_total_prescriptions` | INT | จำนวน prescription ทั้งหมด | PHX_MAIN | ✅ |
| `phx_antibiotic_prescriptions` | INT | จำนวน prescription ยาต้านจุลชีพ | PHX_MEDS | ✅ |
| `phx_narcotic_prescriptions` | INT | จำนวน prescription ยาเสพติดให้โทษ | PHX_MEDS | ✅ |
| `phx_avg_cost_per_rx` | DECIMAL(10,2) | ค่าใช้จ่ายเฉลี่ยต่อ prescription | PHX_MAIN | ⭕ |
| `phx_top_medicine_codes` | JSON | 5 ยาที่พบบ่อยที่สุด (ATC code) | PHX_MEDS | ✅ |

### 7. ข้อมูลห้องปฏิบัติการ (Lab Summary)

| Field Name | Type | Description | Source Table | Mandatory |
|------------|------|-------------|--------------|-----------|
| `lab_total_orders` | INT | จำนวน order ทั้งหมด | LAB_MAIN | ✅ |
| `lab_hematology_orders` | INT | Hematology orders | LAB_DEPT | ✅ |
| `lab_chemistry_orders` | INT | Chemistry orders | LAB_DEPT | ✅ |
| `lab_microbiology_orders` | INT | Microbiology orders | LAB_DEPT | ✅ |
| `lab_blood_bank_orders` | INT | Blood bank orders | LAB_DEPT | ✅ |
| `lab_turnaround_avg` | DECIMAL(5,2) | TAT เฉลี่ย (ชั่วโมง) | LAB_RESULT | ⭕ |
| `lab_critical_results` | INT | Critical values | LAB_RESULT | ✅ |

### 8. ข้อมูลรังสีวินิจฉัย (Radiology Summary)

| Field Name | Type | Description | Source Table | Mandatory |
|------------|------|-------------|--------------|-----------|
| `rad_total_exams` | INT | จำนวน exam ทั้งหมด | RAD_MAIN | ✅ |
| `rad_xray_count` | INT | X-ray | RAD_EXAM | ✅ |
| `rad_ct_count` | INT | CT Scan | RAD_EXAM | ✅ |
| `rad_mri_count` | INT | MRI | RAD_EXAM | ✅ |
| `rad_us_count` | INT | Ultrasound | RAD_EXAM | ✅ |
| `rad_abnormal_rate` | DECIMAL(5,2) | อัตราพบความผิดปกติ (%) | RAD_RESULT | ✅ |

### 9. ข้อมูลการเงิน (Financial Summary)

| Field Name | Type | Description | Source Table | Mandatory |
|------------|------|-------------|--------------|-----------|
| `fin_total_revenue` | DECIMAL(12,2) | รายได้รวม | FIN_TRANSACTION | ✅ |
| `fin_op_revenue` | DECIMAL(12,2) | รายได้ OP | FIN_TRANSACTION | ✅ |
| `fin_ip_revenue` | DECIMAL(12,2) | รายได้ IP | FIN_TRANSACTION | ✅ |
| `fin_er_revenue` | DECIMAL(12,2) | รายได้ ER | FIN_TRANSACTION | ✅ |
| `fin_claim_total` | DECIMAL(12,2) | Claim รวม (ประกัน/กองทุน) | FIN_CLAIM | ✅ |
| `fin_claim_pending` | DECIMAL(12,2) | Claim รอจ่าย | FIN_CLAIM | ✅ |
| `fin_cash_collected` | DECIMAL(12,2) | เงินสดรับ | FIN_TRANSACTION | ✅ |

### 10. ข้อมูลทรัพยากร (Resource Summary)

| Field Name | Type | Description | Source Table | Mandatory |
|------------|------|-------------|--------------|-----------|
| `res_bed_total` | INT | จำนวนเตียงทั้งหมด | RES_BED | ✅ |
| `res_bed_occupied` | INT | เตียงใช้ | RES_BED | ✅ |
| `res_bed_icu_total` | INT | เตียง ICU ทั้งหมด | RES_BED | ✅ |
| `res_bed_icu_occupied` | INT | เตียง ICU ใช้ | RES_BED | ✅ |
| `res_doctor_count` | INT | จำนวนแพทย์ | RES_STAFF | ✅ |
| `res_nurse_count` | INT | จำนวนพยาบาล | RES_STAFF | ✅ |
| `res_ventilator_total` | INT | เครื่องช่วยหายใจทั้งหมด | RES_EQUIP | ✅ |
| `res_ventilator_in_use` | INT | เครื่องช่วยหายใจใช้ | RES_EQUIP | ✅ |

## JSON Payload Structure

```json
{
  "header": {
    "hcode": "10301",
    "sync_date": "2026-03-21T22:00:00+07:00",
    "report_date": "2026-03-21",
    "period_type": "daily",
    "data_version": "1.0"
  },
  "summary": {
    "op": {
      "op_total_visits": 250,
      "op_new_patients": 85,
      "op_old_patients": 165,
      "op_emergency_cases": 12,
      "op_referral_in": 8,
      "op_referral_out": 15,
      "op_top_diag_codes": ["J06.9", "E11.9", "I10", "K29.7", "M54.5"]
    },
    "ip": {
      "ip_total_admissions": 45,
      "ip_total_discharges": 42,
      "ip_current_census": 180,
      "ip_los_avg": 5.2,
      "ip_top_diag_codes": ["J18.9", "I63.9", "S06.9", "K35.80", "N18.9"],
      "ip_surgery_count": 18,
      "ip_death_count": 2,
      "ip_referral_in": 5,
      "ip_referral_out": 3
    },
    "er": {
      "er_total_visits": 85,
      "er_triage_level_1": 3,
      "er_triage_level_2": 12,
      "er_triage_level_3": 35,
      "er_triage_level_4": 25,
      "er_triage_level_5": 10,
      "er_admission_rate": 35.5,
      "er_discharge_rate": 62.1,
      "er_death_count": 1
    },
    "pp": {
      "pp_anc_total": 120,
      "pp_anc_first_tri": 45,
      "pp_fp_new_acceptors": 28,
      "pp_immunization_dpt": 65,
      "pp_immunization_mmr": 58,
      "pp_immunization_opv": 62,
      "pp_ncd_screening_ht": 250,
      "pp_ncd_screening_dm": 235
    },
    "phx": {
      "phx_total_prescriptions": 450,
      "phx_antibiotic_prescriptions": 125,
      "phx_narcotic_prescriptions": 35,
      "phx_top_medicine_codes": ["J01CR02", "C09AA05", "A10BA02", "N02BE01", "C08CA05"]
    },
    "lab": {
      "lab_total_orders": 380,
      "lab_hematology_orders": 150,
      "lab_chemistry_orders": 180,
      "lab_microbiology_orders": 35,
      "lab_blood_bank_orders": 15,
      "lab_critical_results": 8
    },
    "rad": {
      "rad_total_exams": 120,
      "rad_xray_count": 85,
      "rad_ct_count": 18,
      "rad_mri_count": 5,
      "rad_us_count": 12,
      "rad_abnormal_rate": 28.5
    },
    "fin": {
      "fin_total_revenue": 2850000.00,
      "fin_op_revenue": 1250000.00,
      "fin_ip_revenue": 1350000.00,
      "fin_er_revenue": 250000.00,
      "fin_claim_total": 2100000.00,
      "fin_claim_pending": 450000.00,
      "fin_cash_collected": 350000.00
    },
    "res": {
      "res_bed_total": 250,
      "res_bed_occupied": 180,
      "res_bed_icu_total": 20,
      "res_bed_icu_occupied": 15,
      "res_doctor_count": 45,
      "res_nurse_count": 180,
      "res_ventilator_total": 25,
      "res_ventilator_in_use": 12
    }
  },
  "metadata": {
    "record_count": 10,
    "generated_at": "2026-03-21T22:00:00+07:00",
    "script_version": "1.0.0"
  }
}
```

## Validation Rules

### Required Fields (Mandatory)
- `hcode` - ต้องมีทุกครั้ง
- `sync_date` - ต้องเป็น ISO 8601 format
- `report_date` - ต้องเป็น DATE format
- `period_type` - ต้องเป็น daily/weekly/monthly
- ทุก field ที่ marked ✅ ในตารางด้านบน

### Data Type Validation
- INT: ต้องเป็นจำนวนเต็ม >= 0
- DECIMAL: ต้องเป็นตัวเลขทศนิยม
- DATETIME: ต้องเป็น ISO 8601 format
- VARCHAR: ต้องไม่เกินความยาวที่กำหนด
- JSON: ต้องเป็น valid JSON array

### Business Rules
1. `op_new_patients + op_old_patients` ต้อง <= `op_total_visits`
2. `er_triage_level_1` ถึง `level_5` รวมกันต้อง <= `er_total_visits`
3. `res_bed_occupied` ต้อง <= `res_bed_total`
4. `res_bed_icu_occupied` ต้อง <= `res_bed_icu_total`
5. `res_ventilator_in_use` ต้อง <= `res_ventilator_total`
6. `fin_op_revenue + fin_ip_revenue + fin_er_revenue` ต้อง <= `fin_total_revenue`

## API Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Summary data received successfully",
  "sync_id": "SYNC-20260321-10301-001",
  "hcode": "10301",
  "received_at": "2026-03-21T22:05:30+07:00",
  "record_count": 10,
  "validation": {
    "passed": true,
    "errors": []
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Validation failed",
  "hcode": "10301",
  "received_at": "2026-03-21T22:05:30+07:00",
  "validation": {
    "passed": false,
    "errors": [
      {
        "field": "op_total_visits",
        "message": "Field is required",
        "code": "REQUIRED_FIELD"
      },
      {
        "field": "er_triage_level_1",
        "message": "Must be non-negative integer",
        "code": "INVALID_TYPE"
      }
    ]
  }
}
```

## SQL Query Examples (สำหรับ Unit-side Script)

### OP Summary Query
```sql
SELECT 
  COUNT(*) AS op_total_visits,
  SUM(CASE WHEN new_patient = 1 THEN 1 ELSE 0 END) AS op_new_patients,
  SUM(CASE WHEN new_patient = 0 THEN 1 ELSE 0 END) AS op_old_patients,
  SUM(CASE WHEN emergency = 1 THEN 1 ELSE 0 END) AS op_emergency_cases,
  SUM(CASE WHEN referral_type = 'IN' THEN 1 ELSE 0 END) AS op_referral_in,
  SUM(CASE WHEN referral_type = 'OUT' THEN 1 ELSE 0 END) AS op_referral_out
FROM op_main
WHERE visit_date BETWEEN :start_date AND :end_date
  AND hcode = :hcode;
```

### IP Summary Query
```sql
SELECT 
  COUNT(DISTINCT CASE WHEN admit_date BETWEEN :start_date AND :end_date THEN ip_id END) AS ip_total_admissions,
  COUNT(DISTINCT CASE WHEN discharge_date BETWEEN :start_date AND :end_date THEN ip_id END) AS ip_total_discharges,
  (SELECT COUNT(*) FROM ip_main WHERE discharge_date IS NULL AND hcode = :hcode) AS ip_current_census,
  AVG(DATEDIFF(discharge_date, admit_date)) AS ip_los_avg
FROM ip_main
WHERE hcode = :hcode;
```

## Notes

1. **Field marked ⭕** เป็น optional fields สามารถดึงได้ถ้ามีข้อมูลในระบบ
2. **ICD-10 codes** ควรดึง 5 อันดับแรกจาก period นั้นๆ
3. **ATC codes** สำหรับยา ควรดึง 5 อันดับแรกจาก period นั้นๆ
4. **hcode** ต้องส่งทุกครั้งเพื่อระบุหน่วยงาน
5. **period_type** กำหนดโดย parameter เมื่อรัน script

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-21 | Initial version |
