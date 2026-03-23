-- ============================================================================
-- JHCIS Central Database Schema (MariaDB Version)
-- ============================================================================
-- Purpose: Aggregate summary data from 80 JHCIS units
-- Database: MariaDB 10.4+
-- Created: 2026-03-21
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MASTER TABLES
-- ----------------------------------------------------------------------------

-- Health facilities master table (80 units)
CREATE TABLE IF NOT EXISTS health_facilities (
    hcode           VARCHAR(11)     PRIMARY KEY,
    facility_name   VARCHAR(255)    NOT NULL,
    facility_type   VARCHAR(50),
    province        VARCHAR(100),
    district        VARCHAR(100),
    subdistrict     VARCHAR(100),
    postal_code     VARCHAR(10),
    region          VARCHAR(50),
    status          VARCHAR(20)     DEFAULT 'active',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Date dimension for reporting
CREATE TABLE IF NOT EXISTS dim_date (
    report_date     DATE            PRIMARY KEY,
    year            INT             NOT NULL,
    month           INT             NOT NULL,
    day             INT             NOT NULL,
    week            INT             NOT NULL,
    quarter         INT             NOT NULL,
    day_name        VARCHAR(20),
    month_name      VARCHAR(20),
    is_weekend      TINYINT(1)      DEFAULT 0,
    is_holiday      TINYINT(1)      DEFAULT 0
);

-- ----------------------------------------------------------------------------
-- SUMMARY TABLES - Daily Aggregates
-- ----------------------------------------------------------------------------

-- Outpatient (OP) Daily Summary
CREATE TABLE IF NOT EXISTS summary_op_daily (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    total_visits    INT             DEFAULT 0,
    new_patients    INT             DEFAULT 0,
    follow_up       INT             DEFAULT 0,
    
    clinic_med      INT             DEFAULT 0,
    clinic_surg     INT             DEFAULT 0,
    clinic_obg      INT             DEFAULT 0,
    clinic_ped      INT             DEFAULT 0,
    clinic_ortho    INT             DEFAULT 0,
    clinic_ent      INT             DEFAULT 0,
    clinic_opht     INT             DEFAULT 0,
    clinic_derm     INT             DEFAULT 0,
    clinic_psy      INT             DEFAULT 0,
    clinic_dental   INT             DEFAULT 0,
    clinic_other    INT             DEFAULT 0,
    
    age_0_5         INT             DEFAULT 0,
    age_6_15        INT             DEFAULT 0,
    age_16_60       INT             DEFAULT 0,
    age_60_plus     INT             DEFAULT 0,
    
    insured_social  INT             DEFAULT 0,
    insured_gov     INT             DEFAULT 0,
    insured_private INT             DEFAULT 0,
    self_pay        INT             DEFAULT 0,
    
    top_dx_1        VARCHAR(10),
    top_dx_2        VARCHAR(10),
    top_dx_3        VARCHAR(10),
    top_dx_4        VARCHAR(10),
    top_dx_5        VARCHAR(10),
    
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE KEY uk_hcode_date (hcode, report_date)
);

-- Inpatient (IP) Daily Summary
CREATE TABLE IF NOT EXISTS summary_ip_daily (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    opening_census  INT             DEFAULT 0,
    admissions      INT             DEFAULT 0,
    discharges      INT             DEFAULT 0,
    deaths          INT             DEFAULT 0,
    transfers_in    INT             DEFAULT 0,
    transfers_out   INT             DEFAULT 0,
    closing_census  INT             DEFAULT 0,
    
    ward_med        INT             DEFAULT 0,
    ward_surg       INT             DEFAULT 0,
    ward_obg        INT             DEFAULT 0,
    ward_ped        INT             DEFAULT 0,
    ward_icu        INT             DEFAULT 0,
    ward_ccu        INT             DEFAULT 0,
    ward_niccu      INT             DEFAULT 0,
    ward_psy        INT             DEFAULT 0,
    ward_rehab      INT             DEFAULT 0,
    ward_other      INT             DEFAULT 0,
    
    los_0_3_days    INT             DEFAULT 0,
    los_4_7_days    INT             DEFAULT 0,
    los_8_14_days   INT             DEFAULT 0,
    los_15_plus     INT             DEFAULT 0,
    avg_los         DECIMAL(5,2),
    
    total_beds      INT             DEFAULT 0,
    occupied_beds   INT             DEFAULT 0,
    occupancy_rate  DECIMAL(5,2),
    
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE KEY uk_hcode_date (hcode, report_date)
);

-- Emergency Room (ER) Daily Summary
CREATE TABLE IF NOT EXISTS summary_er_daily (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    total_visits    INT             DEFAULT 0,
    by_ambulance    INT             DEFAULT 0,
    walk_in         INT             DEFAULT 0,
    
    triage_1_red    INT             DEFAULT 0,
    triage_2_orange INT             DEFAULT 0,
    triage_3_yellow INT             DEFAULT 0,
    triage_4_green  INT             DEFAULT 0,
    triage_5_white  INT             DEFAULT 0,
    
    discharged      INT             DEFAULT 0,
    admitted        INT             DEFAULT 0,
    transferred     INT             DEFAULT 0,
    expired         INT             DEFAULT 0,
    lams            INT             DEFAULT 0,
    
    trauma          INT             DEFAULT 0,
    medical         INT             DEFAULT 0,
    surgical        INT             DEFAULT 0,
    obg             INT             DEFAULT 0,
    ped             INT             DEFAULT 0,
    psy             INT             DEFAULT 0,
    dental          INT             DEFAULT 0,
    other           INT             DEFAULT 0,
    
    avg_wait_time   DECIMAL(6,2),
    avg_los         DECIMAL(6,2),
    
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE KEY uk_hcode_date (hcode, report_date)
);

-- Health Promotion (PP) Daily Summary
CREATE TABLE IF NOT EXISTS summary_pp_daily (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    anc_new         INT             DEFAULT 0,
    anc_followup    INT             DEFAULT 0,
    anc_high_risk   INT             DEFAULT 0,
    
    fp_new          INT             DEFAULT 0,
    fp_followup     INT             DEFAULT 0,
    
    child_wellness  INT             DEFAULT 0,
    child_immun     INT             DEFAULT 0,
    child_dev       INT             DEFAULT 0,
    
    ncd_dm_screen   INT             DEFAULT 0,
    ncd_ht_screen   INT             DEFAULT 0,
    ncd_new_dm      INT             DEFAULT 0,
    ncd_new_ht      INT             DEFAULT 0,
    
    elderly_exam    INT             DEFAULT 0,
    elderly_mental  INT             DEFAULT 0,
    
    school_exam     INT             DEFAULT 0,
    school_immun    INT             DEFAULT 0,
    
    home_visit      INT             DEFAULT 0,
    palliative      INT             DEFAULT 0,
    
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE KEY uk_hcode_date (hcode, report_date)
);

-- Pharmacy Daily Summary
CREATE TABLE IF NOT EXISTS summary_pharmacy_daily (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    rx_op           INT             DEFAULT 0,
    rx_ip           INT             DEFAULT 0,
    rx_er           INT             DEFAULT 0,
    total_rx        INT             DEFAULT 0,
    
    antibiotic      INT             DEFAULT 0,
    analgesic       INT             DEFAULT 0,
    cv              INT             DEFAULT 0,
    endocrine       INT             DEFAULT 0,
    resp            INT             DEFAULT 0,
    psy             INT             DEFAULT 0,
    derm            INT             DEFAULT 0,
    other           INT             DEFAULT 0,
    
    generic_pct     DECIMAL(5,2),
    
    ddd_antibiotic  DECIMAL(10,2),
    
    stock_out_items INT             DEFAULT 0,
    expiry_near     INT             DEFAULT 0,
    
    drug_revenue    DECIMAL(15,2)   DEFAULT 0,
    markup_revenue  DECIMAL(15,2)   DEFAULT 0,
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE KEY uk_hcode_date (hcode, report_date)
);

-- Laboratory Daily Summary
CREATE TABLE IF NOT EXISTS summary_lab_daily (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    hematology      INT             DEFAULT 0,
    chemistry       INT             DEFAULT 0,
    immunology      INT             DEFAULT 0,
    microbiology    INT             DEFAULT 0,
    parasitology    INT             DEFAULT 0,
    blood_bank      INT             DEFAULT 0,
    urinalysis      INT             DEFAULT 0,
    stool           INT             DEFAULT 0,
    pcr             INT             DEFAULT 0,
    other           INT             DEFAULT 0,
    
    routine         INT             DEFAULT 0,
    stat            INT             DEFAULT 0,
    
    op              INT             DEFAULT 0,
    ip              INT             DEFAULT 0,
    er              INT             DEFAULT 0,
    external        INT             DEFAULT 0,
    
    tat_avg         DECIMAL(6,2),
    tat_stat_avg    DECIMAL(6,2),
    
    qc_passed       INT             DEFAULT 0,
    qc_failed       INT             DEFAULT 0,
    
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE KEY uk_hcode_date (hcode, report_date)
);

-- Radiology Daily Summary
CREATE TABLE IF NOT EXISTS summary_radiology_daily (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    xray            INT             DEFAULT 0,
    ct              INT             DEFAULT 0,
    mri             INT             DEFAULT 0,
    us              INT             DEFAULT 0,
    mammo           INT             DEFAULT 0,
    dexa            INT             DEFAULT 0,
    fluoro          INT             DEFAULT 0,
    nuc_med         INT             DEFAULT 0,
    other           INT             DEFAULT 0,
    
    head            INT             DEFAULT 0,
    chest           INT             DEFAULT 0,
    abdomen         INT             DEFAULT 0,
    spine           INT             DEFAULT 0,
    extremity       INT             DEFAULT 0,
    
    routine         INT             DEFAULT 0,
    urgent          INT             DEFAULT 0,
    stat            INT             DEFAULT 0,
    
    abnormal_pct    DECIMAL(5,2),
    critical_findings INT           DEFAULT 0,
    
    tat_avg         DECIMAL(6,2),
    
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE KEY uk_hcode_date (hcode, report_date)
);

-- Financial Daily Summary
CREATE TABLE IF NOT EXISTS summary_financial_daily (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    revenue_op      DECIMAL(15,2)   DEFAULT 0,
    revenue_ip      DECIMAL(15,2)   DEFAULT 0,
    revenue_er      DECIMAL(15,2)   DEFAULT 0,
    revenue_pp      DECIMAL(15,2)   DEFAULT 0,
    revenue_pharma  DECIMAL(15,2)   DEFAULT 0,
    revenue_lab     DECIMAL(15,2)   DEFAULT 0,
    revenue_rad     DECIMAL(15,2)   DEFAULT 0,
    revenue_other   DECIMAL(15,2)   DEFAULT 0,
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    revenue_social  DECIMAL(15,2)   DEFAULT 0,
    revenue_gov     DECIMAL(15,2)   DEFAULT 0,
    revenue_private DECIMAL(15,2)   DEFAULT 0,
    revenue_civil   DECIMAL(15,2)   DEFAULT 0,
    revenue_self    DECIMAL(15,2)   DEFAULT 0,
    
    ar_new          DECIMAL(15,2)   DEFAULT 0,
    ar_collected    DECIMAL(15,2)   DEFAULT 0,
    ar_adjusted     DECIMAL(15,2)   DEFAULT 0,
    
    claims_submitted INT            DEFAULT 0,
    claims_amount   DECIMAL(15,2)   DEFAULT 0,
    claims_rejected INT             DEFAULT 0,
    claims_pending  INT             DEFAULT 0,
    
    expense_staff   DECIMAL(15,2)   DEFAULT 0,
    expense_drugs   DECIMAL(15,2)   DEFAULT 0,
    expense_supplies DECIMAL(15,2)   DEFAULT 0,
    expense_overhead DECIMAL(15,2)   DEFAULT 0,
    total_expense   DECIMAL(15,2)   DEFAULT 0,
    
    net_revenue     DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE KEY uk_hcode_date (hcode, report_date)
);

-- Resource Daily Summary
CREATE TABLE IF NOT EXISTS summary_resource_daily (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    staff_md        DECIMAL(6,2)    DEFAULT 0,
    staff_nurse     DECIMAL(6,2)    DEFAULT 0,
    staff_pharm     DECIMAL(6,2)    DEFAULT 0,
    staff_tech      DECIMAL(6,2)    DEFAULT 0,
    staff_admin     DECIMAL(6,2)    DEFAULT 0,
    staff_other     DECIMAL(6,2)    DEFAULT 0,
    total_staff     DECIMAL(6,2)    DEFAULT 0,
    
    present_md      INT             DEFAULT 0,
    present_nurse   INT             DEFAULT 0,
    absent          INT             DEFAULT 0,
    
    beds_total      INT             DEFAULT 0,
    beds_available  INT             DEFAULT 0,
    beds_occupied   INT             DEFAULT 0,
    
    equip_vent      INT             DEFAULT 0,
    equip_monitor   INT             DEFAULT 0,
    equip_infusion  INT             DEFAULT 0,
    equip_dialysis  INT             DEFAULT 0,
    
    ambulance_avail INT             DEFAULT 0,
    ambulance_inuse INT             DEFAULT 0,
    
    water_usage     DECIMAL(10,2),
    electric_usage  DECIMAL(10,2),
    oxygen_usage    DECIMAL(10,2),
    
    waste_medical   DECIMAL(10,2),
    waste_general   DECIMAL(10,2),
    
    UNIQUE KEY uk_hcode_date (hcode, report_date)
);

-- API Keys table for authentication
CREATE TABLE IF NOT EXISTS api_keys (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    api_key         VARCHAR(64)     NOT NULL,
    description     VARCHAR(255),
    is_active       TINYINT(1)      DEFAULT 1,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMP       NULL,
    last_used       TIMESTAMP       NULL,
    
    UNIQUE KEY uk_hcode (hcode),
    UNIQUE KEY uk_api_key (api_key)
);

-- Sync log table
CREATE TABLE IF NOT EXISTS sync_log (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    summary_type    VARCHAR(50)     NOT NULL,
    report_date     DATE            NOT NULL,
    records_count   INT             DEFAULT 0,
    status          VARCHAR(20)     DEFAULT 'pending',
    error_message   TEXT,
    received_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    processed_at    TIMESTAMP       NULL,
    
    INDEX idx_hcode (hcode),
    INDEX idx_status (status),
    INDEX idx_received (received_at)
);

-- ----------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------

-- Health facilities
CREATE INDEX idx_facilities_status ON health_facilities(status);
CREATE INDEX idx_facilities_province ON health_facilities(province);
CREATE INDEX idx_facilities_region ON health_facilities(region);

-- Date dimension
CREATE INDEX idx_date_year ON dim_date(year);
CREATE INDEX idx_date_month ON dim_date(month);
CREATE INDEX idx_date_quarter ON dim_date(quarter);

-- OP Summary
CREATE INDEX idx_op_hcode ON summary_op_daily(hcode);
CREATE INDEX idx_op_date ON summary_op_daily(report_date);
CREATE INDEX idx_op_hcode_date ON summary_op_daily(hcode, report_date);
CREATE INDEX idx_op_sync ON summary_op_daily(sync_date);

-- IP Summary
CREATE INDEX idx_ip_hcode ON summary_ip_daily(hcode);
CREATE INDEX idx_ip_date ON summary_ip_daily(report_date);
CREATE INDEX idx_ip_hcode_date ON summary_ip_daily(hcode, report_date);
CREATE INDEX idx_ip_sync ON summary_ip_daily(sync_date);

-- ER Summary
CREATE INDEX idx_er_hcode ON summary_er_daily(hcode);
CREATE INDEX idx_er_date ON summary_er_daily(report_date);
CREATE INDEX idx_er_hcode_date ON summary_er_daily(hcode, report_date);
CREATE INDEX idx_er_sync ON summary_er_daily(sync_date);

-- PP Summary
CREATE INDEX idx_pp_hcode ON summary_pp_daily(hcode);
CREATE INDEX idx_pp_date ON summary_pp_daily(report_date);
CREATE INDEX idx_pp_hcode_date ON summary_pp_daily(hcode, report_date);
CREATE INDEX idx_pp_sync ON summary_pp_daily(sync_date);

-- Pharmacy Summary
CREATE INDEX idx_pharm_hcode ON summary_pharmacy_daily(hcode);
CREATE INDEX idx_pharm_date ON summary_pharmacy_daily(report_date);
CREATE INDEX idx_pharm_hcode_date ON summary_pharmacy_daily(hcode, report_date);
CREATE INDEX idx_pharm_sync ON summary_pharmacy_daily(sync_date);

-- Lab Summary
CREATE INDEX idx_lab_hcode ON summary_lab_daily(hcode);
CREATE INDEX idx_lab_date ON summary_lab_daily(report_date);
CREATE INDEX idx_lab_hcode_date ON summary_lab_daily(hcode, report_date);
CREATE INDEX idx_lab_sync ON summary_lab_daily(sync_date);

-- Radiology Summary
CREATE INDEX idx_rad_hcode ON summary_radiology_daily(hcode);
CREATE INDEX idx_rad_date ON summary_radiology_daily(report_date);
CREATE INDEX idx_rad_hcode_date ON summary_radiology_daily(hcode, report_date);
CREATE INDEX idx_rad_sync ON summary_radiology_daily(sync_date);

-- Financial Summary
CREATE INDEX idx_fin_hcode ON summary_financial_daily(hcode);
CREATE INDEX idx_fin_date ON summary_financial_daily(report_date);
CREATE INDEX idx_fin_hcode_date ON summary_financial_daily(hcode, report_date);
CREATE INDEX idx_fin_sync ON summary_financial_daily(sync_date);

-- Resource Summary
CREATE INDEX idx_res_hcode ON summary_resource_daily(hcode);
CREATE INDEX idx_res_date ON summary_resource_daily(report_date);
CREATE INDEX idx_res_hcode_date ON summary_resource_daily(hcode, report_date);
CREATE INDEX idx_res_sync ON summary_resource_daily(sync_date);

-- ----------------------------------------------------------------------------
-- VIEWS FOR COMMON QUERIES
-- ----------------------------------------------------------------------------

-- Daily summary across all units
CREATE OR REPLACE VIEW v_daily_summary AS
SELECT 
    d.report_date,
    COUNT(DISTINCT op.hcode) as units_reporting,
    SUM(op.total_visits) as total_op,
    SUM(ip.admissions) as total_ip_admissions,
    SUM(er.total_visits) as total_er,
    SUM(pharm.total_rx) as total_rx,
    SUM(lab.hematology + lab.chemistry + lab.microbiology) as total_lab,
    SUM(rad.xray + rad.ct + rad.us) as total_rad,
    SUM(fin.total_revenue) as total_revenue
FROM dim_date d
LEFT JOIN summary_op_daily op ON d.report_date = op.report_date
LEFT JOIN summary_ip_daily ip ON d.report_date = ip.report_date
LEFT JOIN summary_er_daily er ON d.report_date = er.report_date
LEFT JOIN summary_pharmacy_daily pharm ON d.report_date = pharm.report_date
LEFT JOIN summary_lab_daily lab ON d.report_date = lab.report_date
LEFT JOIN summary_radiology_daily rad ON d.report_date = rad.report_date
LEFT JOIN summary_financial_daily fin ON d.report_date = fin.report_date
GROUP BY d.report_date
ORDER BY d.report_date DESC;

-- Unit performance dashboard
CREATE OR REPLACE VIEW v_unit_performance AS
SELECT 
    hf.hcode,
    hf.facility_name,
    hf.province,
    AVG(op.total_visits) as avg_daily_op,
    AVG(ip.closing_census) as avg_census,
    AVG(er.total_visits) as avg_daily_er,
    AVG(fin.total_revenue) as avg_daily_revenue,
    AVG(ip.occupancy_rate) as avg_occupancy
FROM health_facilities hf
LEFT JOIN summary_op_daily op ON hf.hcode = op.hcode
LEFT JOIN summary_ip_daily ip ON hf.hcode = ip.hcode
LEFT JOIN summary_er_daily er ON hf.hcode = er.hcode
LEFT JOIN summary_financial_daily fin ON hf.hcode = fin.hcode
WHERE hf.status = 'active'
GROUP BY hf.hcode, hf.facility_name, hf.province
ORDER BY avg_daily_revenue DESC;

-- ----------------------------------------------------------------------------
-- CENTRAL QUERIES - SQL queries for jhcis-node-agent
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS central_queries (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    summary_type    VARCHAR(50)     NOT NULL,
    sql_text        TEXT            NOT NULL,
    is_active       TINYINT(1)      DEFAULT 1,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_summary_type (summary_type)
);

-- Insert default queries
INSERT IGNORE INTO central_queries (summary_type, sql_text, is_active) VALUES
('op', 'SELECT ''{hcode}'' AS hcode, ''{date}'' AS report_date, COUNT(*) AS total_visits FROM ovst WHERE vstdate = ''{date}''', 1),
('pp', 'SELECT ''{hcode}'' AS hcode, ''{date}'' AS report_date, COUNT(*) AS total_pp FROM pp WHERE vstdate = ''{date}''', 1),
('pharmacy', 'SELECT ''{hcode}'' AS hcode, ''{date}'' AS report_date, COUNT(*) AS total_rx FROM opitemnos WHERE vstdate = ''{date}'' AND rxdate = ''{date}''', 1),
('lab', 'SELECT ''{hcode}'' AS hcode, ''{date}'' AS report_date, COUNT(*) AS total_lab FROM lab_head WHERE order_date = ''{date}''', 1),
('financial', 'SELECT ''{hcode}'' AS hcode, ''{date}'' AS report_date, SUM(total_amount) AS total_revenue FROM finance WHERE date = ''{date}''', 1),
('resource', 'SELECT ''{hcode}'' AS hcode, ''{date}'' AS report_date, COUNT(*) AS total_staff FROM staff WHERE active = 1', 1),
('person', 'SELECT ''{hcode}'' AS hcode, ''{date}'' AS report_date, COUNT(*) AS total_person FROM person', 1),
('general', 'SELECT ''{hcode}'' AS hcode, ''{date}'' AS report_date, 1 AS dummy', 1);

-- ----------------------------------------------------------------------------
-- INSERT DEFAULT ADMIN DATA
-- ----------------------------------------------------------------------------

-- Insert sample facility (for testing)
INSERT IGNORE INTO health_facilities (hcode, facility_name, facility_type, province, region, status)
VALUES 
('TEST001', 'โรงพยาบาลทดสอบ', 'community', 'กรุงเทพมหานคร', 'ภาคกลาง', 'active'),
('TEST002', 'โรงพยาบาลสมุทรปราการ', 'general', 'สมุทรปราการ', 'ภาคกลาง', 'active'),
('TEST003', 'โรงพยาบาลนนทบุรี', 'general', 'นนทบุรี', 'ภาคกลาง', 'active');