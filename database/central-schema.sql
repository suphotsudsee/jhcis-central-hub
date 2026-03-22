-- ============================================================================
-- JHCIS Central Database Schema
-- ============================================================================
-- Purpose: Aggregate summary data from 80 JHCIS units
-- Database: MariaDB / PostgreSQL compatible
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
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- Date dimension for reporting
CREATE TABLE IF NOT EXISTS dim_date (
    report_date     DATE            PRIMARY KEY,
    year            INTEGER         NOT NULL,
    month           INTEGER         NOT NULL,
    day             INTEGER         NOT NULL,
    week            INTEGER         NOT NULL,
    quarter         INTEGER         NOT NULL,
    day_name        VARCHAR(20),
    month_name      VARCHAR(20),
    is_weekend      BOOLEAN         DEFAULT FALSE,
    is_holiday      BOOLEAN         DEFAULT FALSE
);

-- ----------------------------------------------------------------------------
-- SUMMARY TABLES - Daily Aggregates
-- ----------------------------------------------------------------------------

-- Outpatient (OP) Daily Summary
CREATE TABLE IF NOT EXISTS summary_op_daily (
    id              BIGSERIAL       PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    -- Patient counts
    total_visits    INTEGER         DEFAULT 0,
    new_patients    INTEGER         DEFAULT 0,
    follow_up       INTEGER         DEFAULT 0,
    
    -- By clinic type
    clinic_med      INTEGER         DEFAULT 0,
    clinic_surg     INTEGER         DEFAULT 0,
    clinic_obg      INTEGER         DEFAULT 0,
    clinic_ped      INTEGER         DEFAULT 0,
    clinic_ortho    INTEGER         DEFAULT 0,
    clinic_ent      INTEGER         DEFAULT 0,
    clinic_opht     INTEGER         DEFAULT 0,
    clinic_derm     INTEGER         DEFAULT 0,
    clinic_psy      INTEGER         DEFAULT 0,
    clinic_dental   INTEGER         DEFAULT 0,
    clinic_other    INTEGER         DEFAULT 0,
    
    -- By age group
    age_0_5         INTEGER         DEFAULT 0,
    age_6_15        INTEGER         DEFAULT 0,
    age_16_60       INTEGER         DEFAULT 0,
    age_60_plus     INTEGER         DEFAULT 0,
    
    -- By insurance
    insured_social  INTEGER         DEFAULT 0,
    insured_gov     INTEGER         DEFAULT 0,
    insured_private INTEGER         DEFAULT 0,
    self_pay        INTEGER         DEFAULT 0,
    
    -- Top diagnoses (ICD-10 codes)
    top_dx_1        VARCHAR(10),
    top_dx_2        VARCHAR(10),
    top_dx_3        VARCHAR(10),
    top_dx_4        VARCHAR(10),
    top_dx_5        VARCHAR(10),
    
    -- Revenue
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE(hcode, report_date)
);

-- Inpatient (IP) Daily Summary
CREATE TABLE IF NOT EXISTS summary_ip_daily (
    id              BIGSERIAL       PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    -- Census
    opening_census  INTEGER         DEFAULT 0,
    admissions      INTEGER         DEFAULT 0,
    discharges      INTEGER         DEFAULT 0,
    deaths          INTEGER         DEFAULT 0,
    transfers_in    INTEGER         DEFAULT 0,
    transfers_out   INTEGER         DEFAULT 0,
    closing_census  INTEGER         DEFAULT 0,
    
    -- By ward type
    ward_med        INTEGER         DEFAULT 0,
    ward_surg       INTEGER         DEFAULT 0,
    ward_obg        INTEGER         DEFAULT 0,
    ward_ped        INTEGER         DEFAULT 0,
    ward_icu        INTEGER         DEFAULT 0,
    ward_ccu        INTEGER         DEFAULT 0,
    ward_niccu      INTEGER         DEFAULT 0,
    ward_psy        INTEGER         DEFAULT 0,
    ward_rehab      INTEGER         DEFAULT 0,
    ward_other      INTEGER         DEFAULT 0,
    
    -- Length of stay
    los_0_3_days    INTEGER         DEFAULT 0,
    los_4_7_days    INTEGER         DEFAULT 0,
    los_8_14_days   INTEGER         DEFAULT 0,
    los_15_plus     INTEGER         DEFAULT 0,
    avg_los         DECIMAL(5,2),
    
    -- Bed occupancy
    total_beds      INTEGER         DEFAULT 0,
    occupied_beds   INTEGER         DEFAULT 0,
    occupancy_rate  DECIMAL(5,2),
    
    -- Revenue
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE(hcode, report_date)
);

-- Emergency Room (ER) Daily Summary
CREATE TABLE IF NOT EXISTS summary_er_daily (
    id              BIGSERIAL       PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    -- Visit counts
    total_visits    INTEGER         DEFAULT 0,
    by_ambulance    INTEGER         DEFAULT 0,
    walk_in         INTEGER         DEFAULT 0,
    
    -- By triage level
    triage_1_red    INTEGER         DEFAULT 0,
    triage_2_orange INTEGER         DEFAULT 0,
    triage_3_yellow INTEGER         DEFAULT 0,
    triage_4_green  INTEGER         DEFAULT 0,
    triage_5_white  INTEGER         DEFAULT 0,
    
    -- By outcome
    discharged      INTEGER         DEFAULT 0,
    admitted        INTEGER         DEFAULT 0,
    transferred     INTEGER         DEFAULT 0,
    expired         INTEGER         DEFAULT 0,
    lams            INTEGER         DEFAULT 0,  -- Left Against Medical Advice
    
    -- By condition type
    trauma          INTEGER         DEFAULT 0,
    medical         INTEGER         DEFAULT 0,
    surgical        INTEGER         DEFAULT 0,
    obg             INTEGER         DEFAULT 0,
    ped             INTEGER         DEFAULT 0,
    psy             INTEGER         DEFAULT 0,
    dental          INTEGER         DEFAULT 0,
    other           INTEGER         DEFAULT 0,
    
    -- Wait times (minutes)
    avg_wait_time   DECIMAL(6,2),
    avg_los         DECIMAL(6,2),
    
    -- Revenue
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE(hcode, report_date)
);

-- Health Promotion (PP) Daily Summary
CREATE TABLE IF NOT EXISTS summary_pp_daily (
    id              BIGSERIAL       PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    -- ANC (Antenatal Care)
    anc_new         INTEGER         DEFAULT 0,
    anc_followup    INTEGER         DEFAULT 0,
    anc_high_risk   INTEGER         DEFAULT 0,
    
    -- FP (Family Planning)
    fp_new          INTEGER         DEFAULT 0,
    fp_followup     INTEGER         DEFAULT 0,
    
    -- Child health
    child_wellness  INTEGER         DEFAULT 0,
    child_immun     INTEGER         DEFAULT 0,
    child_dev       INTEGER         DEFAULT 0,
    
    -- NCD screening
    ncd_dm_screen   INTEGER         DEFAULT 0,
    ncd_ht_screen   INTEGER         DEFAULT 0,
    ncd_new_dm      INTEGER         DEFAULT 0,
    ncd_new_ht      INTEGER         DEFAULT 0,
    
    -- Elderly care
    elderly_exam    INTEGER         DEFAULT 0,
    elderly_mental  INTEGER         DEFAULT 0,
    
    -- School health
    school_exam     INTEGER         DEFAULT 0,
    school_immun    INTEGER         DEFAULT 0,
    
    -- Home visits
    home_visit      INTEGER         DEFAULT 0,
    palliative      INTEGER         DEFAULT 0,
    
    -- Revenue
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE(hcode, report_date)
);

-- Pharmacy Daily Summary
CREATE TABLE IF NOT EXISTS summary_pharmacy_daily (
    id              BIGSERIAL       PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    -- Prescription counts
    rx_op           INTEGER         DEFAULT 0,
    rx_ip           INTEGER         DEFAULT 0,
    rx_er           INTEGER         DEFAULT 0,
    total_rx        INTEGER         DEFAULT 0,
    
    -- By drug category
    antibiotic      INTEGER         DEFAULT 0,
    analgesic       INTEGER         DEFAULT 0,
    cv              INTEGER         DEFAULT 0,
    endocrine       INTEGER         DEFAULT 0,
    resp            INTEGER         DEFAULT 0,
    psy             INTEGER         DEFAULT 0,
    derm            INTEGER         DEFAULT 0,
    other           INTEGER         DEFAULT 0,
    
    -- Generic vs Brand
    generic_pct     DECIMAL(5,2),
    
    -- DDD (Defined Daily Dose)
    ddd_antibiotic  DECIMAL(10,2),
    
    -- Inventory
    stock_out_items INTEGER         DEFAULT 0,
    expiry_near     INTEGER         DEFAULT 0,
    
    -- Revenue
    drug_revenue    DECIMAL(15,2)   DEFAULT 0,
    markup_revenue  DECIMAL(15,2)   DEFAULT 0,
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE(hcode, report_date)
);

-- Laboratory Daily Summary
CREATE TABLE IF NOT EXISTS summary_lab_daily (
    id              BIGSERIAL       PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    -- By section
    hematology      INTEGER         DEFAULT 0,
    chemistry       INTEGER         DEFAULT 0,
    immunology      INTEGER         DEFAULT 0,
    microbiology    INTEGER         DEFAULT 0,
    parasitology    INTEGER         DEFAULT 0,
    blood_bank      INTEGER         DEFAULT 0,
    urinalysis      INTEGER         DEFAULT 0,
    stool           INTEGER         DEFAULT 0,
    pcr             INTEGER         DEFAULT 0,
    other           INTEGER         DEFAULT 0,
    
    -- By priority
    routine         INTEGER         DEFAULT 0,
    stat            INTEGER         DEFAULT 0,
    
    -- By source
    op              INTEGER         DEFAULT 0,
    ip              INTEGER         DEFAULT 0,
    er              INTEGER         DEFAULT 0,
    external        INTEGER         DEFAULT 0,
    
    -- Turnaround time (hours)
    tat_avg         DECIMAL(6,2),
    tat_stat_avg    DECIMAL(6,2),
    
    -- QC
    qc_passed       INTEGER         DEFAULT 0,
    qc_failed       INTEGER         DEFAULT 0,
    
    -- Revenue
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE(hcode, report_date)
);

-- Radiology Daily Summary
CREATE TABLE IF NOT EXISTS summary_radiology_daily (
    id              BIGSERIAL       PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    -- By modality
    xray            INTEGER         DEFAULT 0,
    ct              INTEGER         DEFAULT 0,
    mri             INTEGER         DEFAULT 0,
    us              INTEGER         DEFAULT 0,
    mammo           INTEGER         DEFAULT 0,
    dexa            INTEGER         DEFAULT 0,
    fluoro          INTEGER         DEFAULT 0,
    nuc_med         INTEGER         DEFAULT 0,
    other           INTEGER         DEFAULT 0,
    
    -- By body part
    head            INTEGER         DEFAULT 0,
    chest           INTEGER         DEFAULT 0,
    abdomen         INTEGER         DEFAULT 0,
    spine           INTEGER         DEFAULT 0,
    extremity       INTEGER         DEFAULT 0,
    other           INTEGER         DEFAULT 0,
    
    -- By priority
    routine         INTEGER         DEFAULT 0,
    urgent          INTEGER         DEFAULT 0,
    stat            INTEGER         DEFAULT 0,
    
    -- Findings
    abnormal_pct    DECIMAL(5,2),
    critical_findings INTEGER       DEFAULT 0,
    
    -- Turnaround time (hours)
    tat_avg         DECIMAL(6,2),
    
    -- Revenue
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE(hcode, report_date)
);

-- Financial Daily Summary
CREATE TABLE IF NOT EXISTS summary_financial_daily (
    id              BIGSERIAL       PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    -- Revenue by source
    revenue_op      DECIMAL(15,2)   DEFAULT 0,
    revenue_ip      DECIMAL(15,2)   DEFAULT 0,
    revenue_er      DECIMAL(15,2)   DEFAULT 0,
    revenue_pp      DECIMAL(15,2)   DEFAULT 0,
    revenue_pharma  DECIMAL(15,2)   DEFAULT 0,
    revenue_lab     DECIMAL(15,2)   DEFAULT 0,
    revenue_rad     DECIMAL(15,2)   DEFAULT 0,
    revenue_other   DECIMAL(15,2)   DEFAULT 0,
    total_revenue   DECIMAL(15,2)   DEFAULT 0,
    
    -- By payer
    revenue_social  DECIMAL(15,2)   DEFAULT 0,
    revenue_gov     DECIMAL(15,2)   DEFAULT 0,
    revenue_private DECIMAL(15,2)   DEFAULT 0,
    revenue_civil   DECIMAL(15,2)   DEFAULT 0,
    revenue_self    DECIMAL(15,2)   DEFAULT 0,
    
    -- Receivables
    ar_new          DECIMAL(15,2)   DEFAULT 0,
    ar_collected    DECIMAL(15,2)   DEFAULT 0,
    ar_adjusted     DECIMAL(15,2)   DEFAULT 0,
    
    -- Claims
    claims_submitted INTEGER        DEFAULT 0,
    claims_amount   DECIMAL(15,2)   DEFAULT 0,
    claims_rejected INTEGER         DEFAULT 0,
    claims_pending  INTEGER         DEFAULT 0,
    
    -- Expenses
    expense_staff   DECIMAL(15,2)   DEFAULT 0,
    expense_drugs   DECIMAL(15,2)   DEFAULT 0,
    expense_supplies DECIMAL(15,2)   DEFAULT 0,
    expense_overhead DECIMAL(15,2)   DEFAULT 0,
    total_expense   DECIMAL(15,2)   DEFAULT 0,
    
    -- Net
    net_revenue     DECIMAL(15,2)   DEFAULT 0,
    
    UNIQUE(hcode, report_date)
);

-- Resource Daily Summary
CREATE TABLE IF NOT EXISTS summary_resource_daily (
    id              BIGSERIAL       PRIMARY KEY,
    hcode           VARCHAR(11)     NOT NULL,
    report_date     DATE            NOT NULL,
    sync_date       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    
    -- Staff (FTE)
    staff_md        DECIMAL(6,2)    DEFAULT 0,
    staff_nurse     DECIMAL(6,2)    DEFAULT 0,
    staff_pharm     DECIMAL(6,2)    DEFAULT 0,
    staff_tech      DECIMAL(6,2)    DEFAULT 0,
    staff_admin     DECIMAL(6,2)    DEFAULT 0,
    staff_other     DECIMAL(6,2)    DEFAULT 0,
    total_staff     DECIMAL(6,2)    DEFAULT 0,
    
    -- Staff present
    present_md      INTEGER         DEFAULT 0,
    present_nurse   INTEGER         DEFAULT 0,
    absent          INTEGER         DEFAULT 0,
    
    -- Beds
    beds_total      INTEGER         DEFAULT 0,
    beds_available  INTEGER         DEFAULT 0,
    beds_occupied   INTEGER         DEFAULT 0,
    
    -- Equipment
    equip_vent      INTEGER         DEFAULT 0,
    equip_monitor   INTEGER         DEFAULT 0,
    equip_infusion  INTEGER         DEFAULT 0,
    equip_dialysis  INTEGER         DEFAULT 0,
    
    -- Vehicles
    ambulance_avail INTEGER         DEFAULT 0,
    ambulance_inuse INTEGER         DEFAULT 0,
    
    -- Utilities
    water_usage     DECIMAL(10,2),
    electric_usage  DECIMAL(10,2),
    oxygen_usage    DECIMAL(10,2),
    
    -- Waste
    waste_medical   DECIMAL(10,2),
    waste_general   DECIMAL(10,2),
    
    UNIQUE(hcode, report_date)
);

-- ----------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------

-- Health facilities
CREATE INDEX IF NOT EXISTS idx_facilities_status ON health_facilities(status);
CREATE INDEX IF NOT EXISTS idx_facilities_province ON health_facilities(province);
CREATE INDEX IF NOT EXISTS idx_facilities_region ON health_facilities(region);

-- Date dimension
CREATE INDEX IF NOT EXISTS idx_date_year ON dim_date(year);
CREATE INDEX IF NOT EXISTS idx_date_month ON dim_date(month);
CREATE INDEX IF NOT EXISTS idx_date_quarter ON dim_date(quarter);

-- OP Summary
CREATE INDEX IF NOT EXISTS idx_op_hcode ON summary_op_daily(hcode);
CREATE INDEX IF NOT EXISTS idx_op_date ON summary_op_daily(report_date);
CREATE INDEX IF NOT EXISTS idx_op_hcode_date ON summary_op_daily(hcode, report_date);
CREATE INDEX IF NOT EXISTS idx_op_sync ON summary_op_daily(sync_date);

-- IP Summary
CREATE INDEX IF NOT EXISTS idx_ip_hcode ON summary_ip_daily(hcode);
CREATE INDEX IF NOT EXISTS idx_ip_date ON summary_ip_daily(report_date);
CREATE INDEX IF NOT EXISTS idx_ip_hcode_date ON summary_ip_daily(hcode, report_date);
CREATE INDEX IF NOT EXISTS idx_ip_sync ON summary_ip_daily(sync_date);

-- ER Summary
CREATE INDEX IF NOT EXISTS idx_er_hcode ON summary_er_daily(hcode);
CREATE INDEX IF NOT EXISTS idx_er_date ON summary_er_daily(report_date);
CREATE INDEX IF NOT EXISTS idx_er_hcode_date ON summary_er_daily(hcode, report_date);
CREATE INDEX IF NOT EXISTS idx_er_sync ON summary_er_daily(sync_date);

-- PP Summary
CREATE INDEX IF NOT EXISTS idx_pp_hcode ON summary_pp_daily(hcode);
CREATE INDEX IF NOT EXISTS idx_pp_date ON summary_pp_daily(report_date);
CREATE INDEX IF NOT EXISTS idx_pp_hcode_date ON summary_pp_daily(hcode, report_date);
CREATE INDEX IF NOT EXISTS idx_pp_sync ON summary_pp_daily(sync_date);

-- Pharmacy Summary
CREATE INDEX IF NOT EXISTS idx_pharm_hcode ON summary_pharmacy_daily(hcode);
CREATE INDEX IF NOT EXISTS idx_pharm_date ON summary_pharmacy_daily(report_date);
CREATE INDEX IF NOT EXISTS idx_pharm_hcode_date ON summary_pharmacy_daily(hcode, report_date);
CREATE INDEX IF NOT EXISTS idx_pharm_sync ON summary_pharmacy_daily(sync_date);

-- Lab Summary
CREATE INDEX IF NOT EXISTS idx_lab_hcode ON summary_lab_daily(hcode);
CREATE INDEX IF NOT EXISTS idx_lab_date ON summary_lab_daily(report_date);
CREATE INDEX IF NOT EXISTS idx_lab_hcode_date ON summary_lab_daily(hcode, report_date);
CREATE INDEX IF NOT EXISTS idx_lab_sync ON summary_lab_daily(sync_date);

-- Radiology Summary
CREATE INDEX IF NOT EXISTS idx_rad_hcode ON summary_radiology_daily(hcode);
CREATE INDEX IF NOT EXISTS idx_rad_date ON summary_radiology_daily(report_date);
CREATE INDEX IF NOT EXISTS idx_rad_hcode_date ON summary_radiology_daily(hcode, report_date);
CREATE INDEX IF NOT EXISTS idx_rad_sync ON summary_radiology_daily(sync_date);

-- Financial Summary
CREATE INDEX IF NOT EXISTS idx_fin_hcode ON summary_financial_daily(hcode);
CREATE INDEX IF NOT EXISTS idx_fin_date ON summary_financial_daily(report_date);
CREATE INDEX IF NOT EXISTS idx_fin_hcode_date ON summary_financial_daily(hcode, report_date);
CREATE INDEX IF NOT EXISTS idx_fin_sync ON summary_financial_daily(sync_date);

-- Resource Summary
CREATE INDEX IF NOT EXISTS idx_res_hcode ON summary_resource_daily(hcode);
CREATE INDEX IF NOT EXISTS idx_res_date ON summary_resource_daily(report_date);
CREATE INDEX IF NOT EXISTS idx_res_hcode_date ON summary_resource_daily(hcode, report_date);
CREATE INDEX IF NOT EXISTS idx_res_sync ON summary_resource_daily(sync_date);

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
    AVG(res.occupancy_rate) as avg_occupancy
FROM health_facilities hf
LEFT JOIN summary_op_daily op ON hf.hcode = op.hcode
LEFT JOIN summary_ip_daily ip ON hf.hcode = ip.hcode
LEFT JOIN summary_er_daily er ON hf.hcode = er.hcode
LEFT JOIN summary_financial_daily fin ON hf.hcode = fin.hcode
LEFT JOIN summary_resource_daily res ON hf.hcode = res.hcode
WHERE hf.status = 'active'
GROUP BY hf.hcode, hf.facility_name, hf.province
ORDER BY avg_daily_revenue DESC;

-- ----------------------------------------------------------------------------
-- COMMENTS FOR DOCUMENTATION (PostgreSQL syntax, omit for MariaDB)
-- ----------------------------------------------------------------------------

-- For PostgreSQL, uncomment and run these:
-- COMMENT ON TABLE summary_op_daily IS 'Daily outpatient summary from JHCIS units';
-- COMMENT ON TABLE summary_ip_daily IS 'Daily inpatient summary from JHCIS units';
-- COMMENT ON TABLE summary_er_daily IS 'Daily emergency room summary from JHCIS units';
-- COMMENT ON TABLE summary_pp_daily IS 'Daily health promotion summary from JHCIS units';
-- COMMENT ON TABLE summary_pharmacy_daily IS 'Daily pharmacy summary from JHCIS units';
-- COMMENT ON TABLE summary_lab_daily IS 'Daily laboratory summary from JHCIS units';
-- COMMENT ON TABLE summary_radiology_daily IS 'Daily radiology summary from JHCIS units';
-- COMMENT ON TABLE summary_financial_daily IS 'Daily financial summary from JHCIS units';
-- COMMENT ON TABLE summary_resource_daily IS 'Daily resource summary from JHCIS units';
