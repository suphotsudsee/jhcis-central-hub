# JHCIS Summary Centralization - Security Plan

## Executive Summary

This document outlines the comprehensive security architecture for the JHCIS (Joint Health Care Information System) Summary Centralization system, designed to securely aggregate data from 80 health facilities across Thailand.

---

## 1. Authentication & Authorization

### 1.1 API Key Management

#### Architecture
- **One Key Per Facility**: Each of the 80 health facilities receives a unique API key
- **Storage**: API keys stored in `health_facilities` table using Argon2id hashing
- **Key Format**: 32-byte cryptographically secure random token (base64url encoded)

#### Database Schema
```sql
CREATE TABLE health_facilities (
    id SERIAL PRIMARY KEY,
    facility_code VARCHAR(50) UNIQUE NOT NULL,
    facility_name VARCHAR(255) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL,
    api_key_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_key_last_rotated_at TIMESTAMP,
    api_key_expires_at TIMESTAMP,
    api_key_revoked_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Key Generation Flow
1. Generate 32-byte secure random token
2. Hash using Argon2id (memory: 64MB, iterations: 3, parallelism: 4)
3. Store hash in database, return plaintext key ONCE to facility admin
4. Facility must store key securely (never commit to version control)

#### Rotation Policy
- **Standard Rotation**: Every 90 days
- **Emergency Rotation**: Immediate upon suspected compromise
- **Grace Period**: 24-hour overlap during rotation (both keys valid)

#### Revocation Process
1. Set `api_key_revoked_at` timestamp
2. Set `is_active = FALSE`
3. Invalidate all active sessions for this facility
4. Audit log entry created
5. Notify facility administrator

### 1.2 Authorization Middleware

```javascript
// Middleware validates API key on every request
// Rejects if: key missing, key invalid, key revoked, facility inactive
```

---

## 2. Transport Security (HTTPS/TLS)

### 2.1 HTTPS Enforcement

#### Requirements
- **HTTPS Only**: All endpoints reject HTTP with 301 redirect to HTTPS
- **HSTS Header**: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- **TLS Version**: TLS 1.2 minimum, TLS 1.3 preferred

#### Configuration (Express + Helmet)
```javascript
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
```

### 2.2 Certificate Management

#### Options
1. **Let's Encrypt** (Recommended for cost-effectiveness)
   - Auto-renewal via certbot cron job
   - 90-day validity, auto-renew at 30 days remaining
   
2. **Commercial Certificate** (For enterprise requirements)
   - Wildcard certificate for *.jhcis.go.th
   - Extended Validation (EV) for enhanced trust

#### Certificate Pinning (Mobile Apps)
- Implement public key pinning for iOS/Android companion apps
- Pin SHA-256 digest of certificate public key
- Include backup pins for CA rotation

### 2.3 Cipher Suites

#### Allowed Ciphers (TLS 1.2+)
- TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
- TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
- TLS_AES_256_GCM_SHA384 (TLS 1.3)
- TLS_AES_128_GCM_SHA256 (TLS 1.3)

#### Disabled Ciphers
- All RC4, DES, 3DES cipher suites
- All MD5-based MACs
- All export-grade ciphers

---

## 3. Data Validation & Sanitization

### 3.1 Input Validation

#### Library: Joi Schema Validation
```javascript
const patientDataSchema = Joi.object({
  facility_code: Joi.string().length(50).required(),
  patient_id: Joi.string().alphanum().length(20).required(),
  visit_date: Joi.date().iso().required(),
  diagnosis_code: Joi.string().regex(/^[A-Z0-9]{3,10}$/).required(),
  treatment_summary: Joi.string().max(5000).allow('').optional(),
  submitted_by: Joi.string().email().required()
});
```

#### Validation Rules
- **Type Checking**: All fields validated for correct type
- **Length Limits**: String fields have explicit max lengths
- **Pattern Matching**: Codes validated against regex patterns
- **Required Fields**: Explicitly marked, reject incomplete payloads
- **No Arbitrary Keys**: `stripUnknown: true` removes unexpected fields

### 3.2 SQL Injection Prevention

#### Mandatory Practices
1. **Parameterized Queries ONLY**
   ```javascript
   // ✅ CORRECT
   await db.query('SELECT * FROM facilities WHERE code = $1', [facilityCode]);
   
   // ❌ WRONG - NEVER DO THIS
   await db.query(`SELECT * FROM facilities WHERE code = '${facilityCode}'`);
   ```

2. **ORM Usage**: Sequelize/Prisma with built-in parameterization
3. **Input Sanitization**: Strip control characters, normalize Unicode
4. **Stored Procedures**: Use for complex queries with typed parameters

#### Defense Layers
- **Layer 1**: Input validation (Joi)
- **Layer 2**: Parameterized queries (ORM)
- **Layer 3**: WAF rules (rate limiting, SQL pattern detection)
- **Layer 4**: Audit logging (detect anomalous query patterns)

### 3.3 Output Encoding
- JSON responses use native `JSON.stringify()` (auto-escapes)
- HTML contexts: encode with `he.encode()` if rendering views
- Logging: sanitize PII before writing logs

---

## 4. Rate Limiting & DDoS Prevention

### 4.1 Rate Limiting Strategy

#### Tiers
| Endpoint Type | Limit | Window | Rationale |
|--------------|-------|--------|-----------|
| Authentication | 5 req | 1 min | Prevent brute force |
| Data Submission | 100 req | 1 min | Normal facility traffic |
| Bulk Import | 10 req | 1 min | Resource-intensive |
| General API | 1000 req | 1 min | Standard usage |

#### Implementation
```javascript
// See: api-backend/src/middleware/rateLimit.js
```

#### Per-Facility Limits
- Each API key tracked independently
- Facility exceeding limits: 429 Too Many Requests
- Repeated violations: temporary suspension (24h)

### 4.2 DDoS Mitigation

#### Infrastructure Level
1. **Cloudflare/WAF**: Rate limiting at edge, geo-blocking if needed
2. **Load Balancer**: Health checks, connection draining
3. **Auto-scaling**: Scale based on CPU/memory/connection count

#### Application Level
1. **Request Queuing**: Bull/Redis for background processing
2. **Circuit Breakers**: Fail fast on downstream failures
3. **Timeout Enforcement**: All queries have 30s max timeout

---

## 5. Audit Logging

### 5.1 Log Schema

```json
{
  "log_id": "uuid",
  "timestamp": "ISO-8601",
  "facility_code": "FAC001",
  "api_key_id": "key_hash_prefix",
  "action": "CREATE|READ|UPDATE|DELETE|AUTH|ROTATE|REVOKE",
  "resource": "patients|visits|diagnoses|api_keys",
  "resource_id": "optional-entity-id",
  "ip_address": "xxx.xxx.xxx.xxx",
  "user_agent": "client-string",
  "status_code": 200,
  "response_time_ms": 145,
  "request_hash": "sha256-of-sanitized-payload"
}
```

### 5.2 Retention Policy
- **Active Logs**: 90 days in hot storage (Elasticsearch)
- **Archive**: 7 years in cold storage (S3 Glacier)
- **PII Handling**: Anonymize after 1 year, aggregate statistics only

### 5.3 Monitoring & Alerts
- **Failed Auth**: >10 failures in 5 min → alert security team
- **Rate Limit Hits**: >1000 in 1 hour → investigate facility
- **Unusual Patterns**: Off-hours access, new endpoints → anomaly detection
- **Key Rotation**: Log all rotation events, notify on emergency rotation

---

## 6. Incident Response Plan

### 6.1 Severity Classification

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P0 | Critical | Immediate (<15 min) | Active data breach, system down |
| P1 | High | <1 hour | API key compromise, auth bypass |
| P2 | Medium | <4 hours | Rate limit abuse, suspicious patterns |
| P3 | Low | <24 hours | Policy violations, minor anomalies |

### 6.2 Response Procedures

#### P0: Active Breach
1. **Contain**: Revoke affected API keys, isolate systems
2. **Assess**: Determine scope, affected facilities, data types
3. **Notify**: Security team, management, legal, affected facilities
4. **Remediate**: Patch vulnerability, rotate all keys if needed
5. **Post-mortem**: Document timeline, root cause, prevention

#### P1: Key Compromise
1. **Revoke**: Immediately invalidate compromised key
2. **Rotate**: Issue new key to affected facility
3. **Investigate**: Review audit logs for unauthorized access
4. **Document**: Incident report within 24 hours

### 6.3 Communication Plan
- **Internal**: Security Slack channel, incident war room
- **External**: Facility admins via secure email, status page updates
- **Regulatory**: PDPA notification within 72 hours if PII breached

### 6.4 Recovery Checklist
- [ ] All compromised keys revoked
- [ ] New keys issued to affected facilities
- [ ] Vulnerability patched
- [ ] Audit logs preserved for forensics
- [ ] Stakeholders notified
- [ ] Post-mortem scheduled
- [ ] Prevention measures implemented

---

## 7. Compliance

### 7.1 PDPA (Thailand Personal Data Protection Act)

#### Requirements Met
- **Lawful Basis**: Legitimate interest (public health)
- **Data Minimization**: Only required fields collected
- **Purpose Limitation**: Data used only for JHCIS aggregation
- **Storage Limitation**: Retention policies enforced
- **Security**: Encryption, access controls, audit logging
- **Data Subject Rights**: Access, rectification, erasure procedures

#### DPO Responsibilities
- Maintain processing records
- Handle data subject requests
- Conduct DPIA for new features
- Liaise with PDPC (regulator)

### 7.2 HIPAA (If US Partners Involved)

#### Safeguards
- **Administrative**: Access policies, workforce training
- **Physical**: Server access controls, workstation security
- **Technical**: Encryption, audit controls, integrity controls

#### BAA Requirements
- Business Associate Agreements with all vendors
- Subcontractor flow-down obligations

### 7.3 OWASP Top 10 Compliance

| Risk | Mitigation |
|------|------------|
| A01: Broken Access Control | API key auth, RBAC, facility isolation |
| A02: Cryptographic Failures | TLS 1.3, Argon2id, secure random keys |
| A03: Injection | Parameterized queries, input validation |
| A04: Insecure Design | Security-by-design, threat modeling |
| A05: Security Misconfiguration | Helmet, HSTS, secure defaults |
| A06: Vulnerable Components | SCA scanning, dependency updates |
| A07: Auth Failures | Rate limiting, key rotation, revocation |
| A08: Data Integrity | Input validation, output encoding |
| A09: Logging Failures | Comprehensive audit logging |
| A10: SSRF | Egress filtering, allowlist URLs |

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] API key generation utility
- [ ] Database schema migration
- [ ] Basic auth middleware
- [ ] HTTPS enforcement

### Phase 2: Hardening (Week 3-4)
- [ ] Rate limiting implementation
- [ ] Input validation across all endpoints
- [ ] Audit logging infrastructure
- [ ] Security headers (Helmet)

### Phase 3: Operations (Week 5-6)
- [ ] Key rotation automation
- [ ] Monitoring dashboards
- [ ] Incident response runbooks
- [ ] Security training for ops team

### Phase 4: Compliance (Week 7-8)
- [ ] PDPA documentation
- [ ] DPIA completion
- [ ] External security audit
- [ ] Penetration testing

---

## 9. Security Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| Security Lead | security-lead@jhcis.go.th | P0 incidents |
| On-call Engineer | oncall@jhcis.go.th | P1-P2 incidents |
| DPO | dpo@jhcis.go.th | PDPA matters |
| Infrastructure | infra@jhcis.go.th | Platform issues |

---

## Document Control

- **Version**: 1.0
- **Created**: 2026-03-21
- **Owner**: JHCIS Security Team
- **Review Cycle**: Quarterly
- **Classification**: Internal - Confidential

---

*This security plan is a living document. Review and update quarterly or after any security incident.*
