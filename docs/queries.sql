-- ============================================================
-- JHCIS Summary Centralization - SQL Queries
-- สำหรับ รพ.สต./สถานบริการ
-- 
-- ออกแบบโดย: ทีม DBA
-- วันที่: 2024-03-21
-- 
-- หมายเหตุ: {date} จะถูกแทนที่ด้วยวันที่จาก sync_agent.py
-- ============================================================

-- ============================================================
-- 1. OP (Outpatient) - ผู้ป่วยนอก
-- ============================================================
-- QUERY: OP
SELECT 
    v.visit_date AS visit_date,
    v.visit_id AS visit_id,
    v.patient_id AS patient_id,
    v.hn AS hn,
    p.prefix AS prefix,
    p.first_name AS first_name,
    p.last_name AS last_name,
    p.birth_date AS birth_date,
    p.gender AS gender,
    v.diagnosis_primary AS diagnosis_primary,
    v.diagnosis_secondary AS diagnosis_secondary,
    v.icd10_code AS icd10_code,
    v.treatment_code AS treatment_code,
    v.doctor_id AS doctor_id,
    v.clinic_code AS clinic_code,
    v.visit_type AS visit_type,
    v.amount AS amount,
    v.copay AS copay,
    v.insurance_type AS insurance_type,
    v.right_code AS right_code,
    v.status AS status,
    v.created_at AS created_at,
    v.updated_at AS updated_at
FROM op_visits v
LEFT JOIN patients p ON v.patient_id = p.patient_id
WHERE DATE(v.visit_date) = '{date}'
  AND v.status IN ('completed', 'closed')
ORDER BY v.visit_date ASC;

-- ============================================================
-- 2. IP (Inpatient) - ผู้ป่วยใน
-- ============================================================
-- QUERY: IP
SELECT 
    a.admission_id AS admission_id,
    a.admission_date AS admission_date,
    a.discharge_date AS discharge_date,
    a.patient_id AS patient_id,
    a.hn AS hn,
    p.prefix AS prefix,
    p.first_name AS first_name,
    p.last_name AS last_name,
    p.birth_date AS birth_date,
    p.gender AS gender,
    a.ward_code AS ward_code,
    a.ward_name AS ward_name,
    a.bed_number AS bed_number,
    a.diagnosis_primary AS diagnosis_primary,
    a.diagnosis_secondary AS diagnosis_secondary,
    a.icd10_admission AS icd10_admission,
    a.icd10_discharge AS icd10_discharge,
    a.procedure_codes AS procedure_codes,
    a.surgery_date AS surgery_date,
    a.anesthesia_type AS anesthesia_type,
    a.doctor_attending AS doctor_attending,
    a.doctor_surgeon AS doctor_surgeon,
    a.total_amount AS total_amount,
    a.insurance_type AS insurance_type,
    a.right_code AS right_code,
    a.discharge_status AS discharge_status,
    a.discharge_type AS discharge_type,
    a.length_of_stay AS length_of_stay,
    a.status AS status,
    a.created_at AS created_at,
    a.updated_at AS updated_at
FROM ip_admissions a
LEFT JOIN patients p ON a.patient_id = p.patient_id
WHERE DATE(a.admission_date) = '{date}'
  AND a.status IN ('completed', 'discharged')
ORDER BY a.admission_date ASC;

-- ============================================================
-- 3. ER (Emergency) - ฉุกเฉิน
-- ============================================================
-- QUERY: ER
SELECT 
    e.er_id AS er_id,
    e.arrival_time AS arrival_time,
    e.departure_time AS departure_time,
    e.patient_id AS patient_id,
    e.hn AS hn,
    p.prefix AS prefix,
    p.first_name AS first_name,
    p.last_name AS last_name,
    p.birth_date AS birth_date,
    p.gender AS gender,
    e.triage_level AS triage_level,
    e.triage_color AS triage_color,
    e.chief_complaint AS chief_complaint,
    e.diagnosis_primary AS diagnosis_primary,
    e.icd10_code AS icd10_code,
    e.treatment_provided AS treatment_provided,
    e.procedure_codes AS procedure_codes,
    e.doctor_id AS doctor_id,
    e.nurse_id AS nurse_id,
    e.ambulance_flag AS ambulance_flag,
    e.ambulance_number AS ambulance_number,
    e.referral_flag AS referral_flag,
    e.referral_hospital AS referral_hospital,
    e.total_amount AS total_amount,
    e.insurance_type AS insurance_type,
    e.right_code AS right_code,
    e.disposition AS disposition,
    e.status AS status,
    e.created_at AS created_at,
    e.updated_at AS updated_at
FROM er_visits e
LEFT JOIN patients p ON e.patient_id = p.patient_id
WHERE DATE(e.arrival_time) = '{date}'
  AND e.status IN ('completed', 'discharged', 'transferred')
ORDER BY e.arrival_time ASC;

-- ============================================================
-- 4. PP (Preventive & Promotive) - ป้องกันและส่งเสริมสุขภาพ
-- ============================================================
-- QUERY: PP
SELECT 
    pp.pp_id AS pp_id,
    pp.service_date AS service_date,
    pp.patient_id AS patient_id,
    pp.hn AS hn,
    p.prefix AS prefix,
    p.first_name AS first_name,
    p.last_name AS last_name,
    p.birth_date AS birth_date,
    p.gender AS gender,
    pp.service_type AS service_type,
    pp.service_code AS service_code,
    pp.service_name AS service_name,
    pp.program_code AS program_code,
    pp.program_name AS program_name,
    pp.vaccine_code AS vaccine_code,
    pp.vaccine_name AS vaccine_name,
    pp.vaccine_dose AS vaccine_dose,
    pp.screening_type AS screening_type,
    pp.screening_result AS screening_result,
    pp.health_edu_flag AS health_edu_flag,
    pp.health_edu_topic AS health_edu_topic,
    pp.provider_id AS provider_id,
    pp.provider_type AS provider_type,
    pp.amount AS amount,
    pp.claim_flag AS claim_flag,
    pp.status AS status,
    pp.created_at AS created_at,
    pp.updated_at AS updated_at
FROM pp_services pp
LEFT JOIN patients p ON pp.patient_id = p.patient_id
WHERE DATE(pp.service_date) = '{date}'
  AND pp.status IN ('completed', 'done')
ORDER BY pp.service_date ASC;

-- ============================================================
-- 5. Pharmacy - เภสัชกรรม
-- ============================================================
-- QUERY: Pharmacy
SELECT 
    rx.rx_id AS rx_id,
    rx.dispense_date AS dispense_date,
    rx.prescription_id AS prescription_id,
    rx.patient_id AS patient_id,
    rx.hn AS hn,
    p.prefix AS prefix,
    p.first_name AS first_name,
    p.last_name AS last_name,
    p.birth_date AS birth_date,
    p.gender AS gender,
    rx.drug_code AS drug_code,
    rx.drug_name AS drug_name,
    rx.drug_category AS drug_category,
    rx.drug_form AS drug_form,
    rx.strength AS strength,
    rx.quantity AS quantity,
    rx.unit AS unit,
    rx.dosage AS dosage,
    rx.frequency AS frequency,
    rx.duration_days AS duration_days,
    rx.prescriber_id AS prescriber_id,
    rx.pharmacist_id AS pharmacist_id,
    rx.unit_price AS unit_price,
    rx.total_amount AS total_amount,
    rx.insurance_type AS insurance_type,
    rx.right_code AS right_code,
    rx.copay AS copay,
    rx.priority AS priority,
    rx.status AS status,
    rx.created_at AS created_at,
    rx.updated_at AS updated_at
FROM pharmacy_dispensing rx
LEFT JOIN patients p ON rx.patient_id = p.patient_id
WHERE DATE(rx.dispense_date) = '{date}'
  AND rx.status IN ('dispensed', 'completed')
ORDER BY rx.dispense_date ASC;

-- ============================================================
-- 6. Lab (Laboratory) - ห้องปฏิบัติการ
-- ============================================================
-- QUERY: Lab
SELECT 
    lab.lab_id AS lab_id,
    lab.order_date AS order_date,
    lab.result_date AS result_date,
    lab.patient_id AS patient_id,
    lab.hn AS hn,
    p.prefix AS prefix,
    p.first_name AS first_name,
    p.last_name AS last_name,
    p.birth_date AS birth_date,
    p.gender AS gender,
    lab.order_id AS order_id,
    lab.test_code AS test_code,
    lab.test_name AS test_name,
    lab.test_category AS test_category,
    lab.specimen_type AS specimen_type,
    lab.specimen_id AS specimen_id,
    lab.result_value AS result_value,
    lab.result_unit AS result_unit,
    lab.result_flag AS result_flag,
    lab.reference_range AS reference_range,
    lab.method AS method,
    lab.equipment_id AS equipment_id,
    lab.technologist_id AS technologist_id,
    lab.pathologist_id AS pathologist_id,
    lab.amount AS amount,
    lab.insurance_type AS insurance_type,
    lab.right_code AS right_code,
    lab.priority AS priority,
    lab.status AS status,
    lab.created_at AS created_at,
    lab.updated_at AS updated_at
FROM lab_orders lab
LEFT JOIN patients p ON lab.patient_id = p.patient_id
WHERE DATE(lab.order_date) = '{date}'
  AND lab.status IN ('completed', 'resulted', 'verified')
ORDER BY lab.order_date ASC;

-- ============================================================
-- 7. Radiology - รังสีวิทยา
-- ============================================================
-- QUERY: Radiology
SELECT 
    rad.rad_id AS rad_id,
    rad.order_date AS order_date,
    rad.result_date AS result_date,
    rad.patient_id AS patient_id,
    rad.hn AS hn,
    p.prefix AS prefix,
    p.first_name AS first_name,
    p.last_name AS last_name,
    p.birth_date AS birth_date,
    p.gender AS gender,
    rad.order_id AS order_id,
    rad.modality_code AS modality_code,
    rad.modality_name AS modality_name,
    rad.exam_code AS exam_code,
    rad.exam_name AS exam_name,
    rad.body_part AS body_part,
    rad.view_count AS view_count,
    rad.contrast_flag AS contrast_flag,
    rad.contrast_type AS contrast_type,
    rad.result_text AS result_text,
    rad.result_impression AS result_impression,
    rad.radiologist_id AS radiologist_id,
    rad.technologist_id AS technologist_id,
    rad.equipment_id AS equipment_id,
    rad.dose_report AS dose_report,
    rad.amount AS amount,
    rad.insurance_type AS insurance_type,
    rad.right_code AS right_code,
    rad.priority AS priority,
    rad.urgent_flag AS urgent_flag,
    rad.status AS status,
    rad.created_at AS created_at,
    rad.updated_at AS updated_at
FROM radiology_orders rad
LEFT JOIN patients p ON rad.patient_id = p.patient_id
WHERE DATE(rad.order_date) = '{date}'
  AND rad.status IN ('completed', 'resulted', 'verified')
ORDER BY rad.order_date ASC;

-- ============================================================
-- 8. Financial - การเงิน
-- ============================================================
-- QUERY: Financial
SELECT 
    fin.transaction_id AS transaction_id,
    fin.transaction_date AS transaction_date,
    fin.transaction_type AS transaction_type,
    fin.patient_id AS patient_id,
    fin.hn AS hn,
    p.prefix AS prefix,
    p.first_name AS first_name,
    p.last_name AS last_name,
    fin.invoice_number AS invoice_number,
    fin.receipt_number AS receipt_number,
    fin.service_type AS service_type,
    fin.service_code AS service_code,
    fin.service_date AS service_date,
    fin.charge_code AS charge_code,
    fin.charge_description AS charge_description,
    fin.charge_amount AS charge_amount,
    fin.discount_amount AS discount_amount,
    fin.net_amount AS net_amount,
    fin.paid_amount AS paid_amount,
    fin.balance AS balance,
    fin.payment_method AS payment_method,
    fin.payment_ref AS payment_ref,
    fin.insurance_type AS insurance_type,
    fin.insurance_amount AS insurance_amount,
    fin.right_code AS right_code,
    fin.right_amount AS right_amount,
    fin.copay AS copay,
    fin.cash_amount AS cash_amount,
    fin.credit_card_amount AS credit_card_amount,
    fin.transfer_amount AS transfer_amount,
    fin.cashier_id AS cashier_id,
    fin.fiscal_year AS fiscal_year,
    fin.fiscal_period AS fiscal_period,
    fin.status AS status,
    fin.created_at AS created_at,
    fin.updated_at AS updated_at
FROM financial_transactions fin
LEFT JOIN patients p ON fin.patient_id = p.patient_id
WHERE DATE(fin.transaction_date) = '{date}'
  AND fin.status IN ('completed', 'paid', 'posted')
ORDER BY fin.transaction_date ASC;

-- ============================================================
-- 9. Resource (HR/Staff) - ทรัพยากร/บุคลากร
-- ============================================================
-- QUERY: Resource
SELECT 
    res.resource_id AS resource_id,
    res.service_date AS service_date,
    res.staff_id AS staff_id,
    res.staff_code AS staff_code,
    res.prefix AS prefix,
    res.first_name AS first_name,
    res.last_name AS last_name,
    res.position_code AS position_code,
    res.position_name AS position_name,
    res.department_code AS department_code,
    res.department_name AS department_name,
    res.profession_type AS profession_type,
    res.license_number AS license_number,
    res.shift_code AS shift_code,
    res.shift_name AS shift_name,
    res.work_hours AS work_hours,
    res.ot_hours AS ot_hours,
    res.on_call_flag AS on_call_flag,
    res.patient_count AS patient_count,
    res.procedure_count AS procedure_count,
    res.service_count AS service_count,
    res.performance_score AS performance_score,
    res.attendance_status AS attendance_status,
    res.leave_type AS leave_type,
    res.salary_amount AS salary_amount,
    res.allowance_amount AS allowance_amount,
    res.status AS status,
    res.created_at AS created_at,
    res.updated_at AS updated_at
FROM resource_daily res
WHERE DATE(res.service_date) = '{date}'
  AND res.status IN ('active', 'worked')
ORDER BY res.staff_id ASC, res.service_date ASC;

-- ============================================================
-- END OF QUERIES
-- ============================================================
