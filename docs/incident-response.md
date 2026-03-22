# Incident Response Plan

## JHCIS Summary Centralization

### Document Control
- **Version**: 1.0
- **Effective Date**: 2026-03-21
- **Owner**: JHCIS Security Team
- **Classification**: Internal - Confidential
- **Review Cycle**: Semi-annual

---

## 1. Executive Summary

This incident response plan provides structured procedures for detecting, responding to, and recovering from security incidents affecting the JHCIS Summary Centralization system. The plan ensures rapid containment, minimal data exposure, and systematic recovery across all 80 connected health facilities.

---

## 2. Incident Classification

### 2.1 Severity Levels

| Level | Code | Response Time | Examples |
|-------|------|---------------|----------|
| **Critical** | P0 | Immediate (<15 min) | Active data breach, ransomware, system compromise |
| **High** | P1 | <1 hour | API key compromise, authentication bypass, SQL injection success |
| **Medium** | P2 | <4 hours | Rate limit abuse, suspicious access patterns, policy violations |
| **Low** | P3 | <24 hours | Failed attack attempts, reconnaissance, minor misconfigurations |

### 2.2 Incident Categories

#### Category A: Authentication & Authorization
- API key compromise
- Unauthorized access
- Privilege escalation
- Session hijacking

#### Category B: Data Security
- Data breach (PHI/PII exposure)
- Data integrity violation
- Data exfiltration
- Ransomware/encryption

#### Category C: Infrastructure
- DDoS attack
- Service disruption
- Certificate compromise
- Network intrusion

#### Category D: Application
- SQL injection success
- XSS exploitation
- Remote code execution
- API abuse

#### Category E: Compliance
- PDPA violation
- Unauthorized data sharing
- Audit log tampering
- Policy violation

---

## 3. Incident Response Team (IRT)

### 3.1 Core Team Members

| Role | Primary | Backup | Contact |
|------|---------|--------|---------|
| **Incident Commander** | Security Lead | Deputy Security | +66-XXX-XXX-XXXX |
| **Technical Lead** | Senior Engineer | Staff Engineer | +66-XXX-XXX-XXXX |
| **Communications** | Comms Manager | PR Lead | +66-XXX-XXX-XXXX |
| **Legal/Compliance** | Legal Counsel | DPO | +66-XXX-XXX-XXXX |
| **Operations** | Ops Manager | On-call Lead | +66-XXX-XXX-XXXX |

### 3.2 Extended Team (As Needed)

- **Facility Liaison**: Coordinate with affected health facilities
- **Forensics Specialist**: Evidence collection and analysis
- **External PR**: Media relations (if public impact)
- **Law Enforcement Liaison**: Criminal incidents
- **Vendor Support**: Third-party system incidents

### 3.3 On-Call Rotation

24/7 on-call schedule:
- **Primary**: Rotating weekly (Senior Engineer)
- **Secondary**: Rotating weekly (Staff Engineer)
- **Escalation**: Security Lead (always available)

On-call handbook: `ops/oncall-handbook.md`

---

## 4. Incident Response Lifecycle

### Phase 1: Preparation

#### 4.1 Pre-Incident Readiness

**Tools & Access**
- [ ] Incident management platform (Jira/PagerDuty)
- [ ] Secure communication channel (Signal/Telegram group)
- [ ] Forensics toolkit installed
- [ ] Backup systems verified
- [ ] Contact list updated

**Training**
- [ ] IRT members trained on procedures
- [ ] Quarterly tabletop exercises completed
- [ ] Runbooks reviewed and updated
- [ ] New team members onboarded

**Monitoring**
- [ ] SIEM alerts configured
- [ ] Log aggregation operational
- [ ] Anomaly detection tuned
- [ ] Dashboard health checks passing

### Phase 2: Detection & Analysis

#### 4.2 Detection Sources

| Source | Type | Reliability |
|--------|------|-------------|
| SIEM alerts | Automated | High |
| Facility reports | Manual | Medium |
| User complaints | Manual | Medium |
| Monitoring dashboards | Automated | High |
| Threat intelligence | External | Medium |
| Audit log review | Manual | High |

#### 4.3 Initial Triage

**Triage Checklist** (complete within 15 minutes):
1. [ ] Confirm incident is real (not false positive)
2. [ ] Determine severity level (P0-P3)
3. [ ] Identify affected systems/facilities
4. [ ] Estimate data exposure scope
5. [ ] Assign incident commander
6. [ ] Open incident ticket
7. [ ] Notify core IRT members

#### 4.4 Analysis Questions

- **What**: What type of incident? (category A-E)
- **When**: When did it start? When detected?
- **Where**: Which systems/facilities affected?
- **Who**: Who is responsible? (internal/external)
- **How**: Attack vector? (phishing, exploit, misconfiguration)
- **Scope**: How many records/users/facilities?

### Phase 3: Containment

#### 4.5 Short-Term Containment (Immediate)

**Goal**: Stop the bleeding

| Incident Type | Containment Action |
|---------------|-------------------|
| API key compromise | Revoke key immediately |
| Active breach | Isolate affected systems |
| DDoS attack | Enable CDN protection, rate limiting |
| Ransomware | Disconnect infected systems |
| SQL injection | Block source IP, patch vulnerability |
| Data exfiltration | Revoke access, enable egress filtering |

**Containment Commands**:
```bash
# Revoke API key
POST /api/admin/keys/revoke { facilityCode: "FAC001", reason: "compromise" }

# Block IP address
iptables -A INPUT -s <attacker_ip> -j DROP

# Isolate system
systemctl stop jhcis-api
ufw deny from <subnet>

# Enable emergency rate limiting
redis-cli SET rate_limit:emergency 1
```

#### 4.6 Long-Term Containment (Sustained)

**Goal**: Maintain security while preparing recovery

- [ ] Apply temporary patches
- [ ] Increase monitoring on affected systems
- [ ] Implement compensating controls
- [ ] Document all containment actions
- [ ] Preserve evidence for forensics

### Phase 4: Eradication

#### 4.7 Root Cause Removal

**Eradication Steps**:
1. [ ] Identify root cause (vulnerability, misconfiguration, human error)
2. [ ] Develop permanent fix
3. [ ] Test fix in staging environment
4. [ ] Deploy to production (change management)
5. [ ] Verify fix effectiveness
6. [ ] Remove temporary workarounds

**Common Eradication Actions**:
- Patch vulnerable software
- Rotate all potentially compromised keys
- Remove malware/backdoors
- Fix misconfigurations
- Update firewall rules
- Patch database vulnerabilities

### Phase 5: Recovery

#### 4.8 System Recovery

**Recovery Checklist**:
- [ ] All systems patched and hardened
- [ ] Credentials rotated (API keys, passwords, certificates)
- [ ] Monitoring enhanced (additional alerts)
- [ ] Backups verified (clean, not compromised)
- [ ] Systems restored from clean backups
- [ ] Gradual service restoration (canary deployment)
- [ ] Facility connectivity verified
- [ ] Data integrity confirmed

#### 4.9 Service Restoration

**Phased Approach**:
1. **Phase 1**: Core authentication (10% traffic)
2. **Phase 2**: Data submission (50% traffic)
3. **Phase 3**: Full service (100% traffic)
4. **Phase 4**: Enhanced monitoring (7-day observation)

### Phase 6: Post-Incident

#### 4.10 Post-Incident Activities

**Within 24 Hours**:
- [ ] Initial incident report drafted
- [ ] Stakeholders notified
- [ ] Evidence preserved
- [ ] Timeline documented

**Within 72 Hours**:
- [ ] Post-mortem meeting scheduled
- [ ] Root cause analysis complete
- [ ] Remediation plan approved
- [ ] PDPA notification (if required)

**Within 7 Days**:
- [ ] Post-mortem report published
- [ ] Remediation items in backlog
- [ ] Process improvements identified
- [ ] Training gaps addressed

**Within 30 Days**:
- [ ] All remediation items complete
- [ ] Policy/procedure updates deployed
- [ ] Lessons learned incorporated
- [ ] IRT debrief complete

---

## 5. Communication Plan

### 5.1 Internal Communication

| Audience | Channel | Timing | Owner |
|----------|---------|--------|-------|
| IRT Core | Secure chat (Signal) | Immediate | Incident Commander |
| Executive | Email + Call | <1 hour (P0/P1) | Communications |
| Technical | Slack #security | <2 hours | Technical Lead |
| All Staff | Email | <24 hours | Communications |

### 5.2 External Communication

| Audience | Channel | Timing | Owner |
|----------|---------|--------|-------|
| Affected Facilities | Secure email + Phone | <4 hours | Facility Liaison |
| All Facilities | Portal announcement | <24 hours | Comms Manager |
| PDPA Regulator | Formal notification | <72 hours (if breach) | Legal/DPO |
| Media/Press | Press release | As needed | External PR |
| Law Enforcement | Formal report | As required | Legal Counsel |

### 5.3 Communication Templates

#### Template: Facility Notification (Email)
```
Subject: [URGENT] Security Incident - Action Required

Dear [Facility Administrator],

We are writing to inform you of a security incident affecting [system/facility].

Incident Summary:
- Type: [API key compromise / Data breach / etc.]
- Detected: [Date/Time]
- Affected: [Your facility / X facilities]
- Status: [Contained / Under investigation]

Required Actions:
1. [Rotate your API key immediately]
2. [Review recent submissions for anomalies]
3. [Contact support if you observe issues]

Support Contact: security-incident@jhcis.go.th | +66-XXX-XXX-XXXX

Next Update: [Date/Time]

Regards,
JHCIS Security Team
```

#### Template: Executive Summary
```
INCIDENT REPORT - EXECUTIVE SUMMARY

Classification: P0/P1/P2/P3
Status: [Active / Contained / Resolved]
Duration: [X hours/days]

Impact:
- Facilities Affected: X/80
- Data Records: ~X,XXX
- Service Downtime: X hours
- Financial Impact: TBD

Root Cause: [Brief description]

Remediation: [Key actions taken]

Next Steps: [Immediate priorities]

Report Owner: [Name/Title]
```

---

## 6. Specific Incident Playbooks

### 6.1 Playbook: API Key Compromise

**Trigger**: Unauthorized API key use detected

**Response Steps**:
1. [T+0] Detect anomalous API usage (SIEM alert)
2. [T+5 min] Triage: Confirm compromise, identify facility
3. [T+15 min] Revoke compromised API key
4. [T+30 min] Notify facility administrator
5. [T+1 hour] Issue new API key to facility
6. [T+2 hours] Review audit logs for unauthorized access
7. [T+4 hours] Assess data exposure scope
8. [T+24 hours] Complete incident report
9. [T+7 days] Post-mortem review

**Containment**:
```javascript
// Immediate key revocation
await apiKeyGenerator.revokeApiKey(facilityCode, keyHash, 'compromise');

// Invalidate active sessions
await db.sessions.invalidateByFacility(facilityCode);

// Alert security team
await slack.alerts.post(`🚨 API key compromised: ${facilityCode}`);
```

### 6.2 Playbook: SQL Injection Attack

**Trigger**: SQL injection pattern detected in logs

**Response Steps**:
1. [T+0] WAF/monitoring detects SQL injection attempt
2. [T+5 min] Block source IP address
3. [T+15 min] Review logs for successful injections
4. [T+30 min] If successful: assess data exposure
5. [T+1 hour] Patch vulnerable endpoint
6. [T+2 hours] Security scan all endpoints
7. [T+4 hours] Deploy WAF rule update
8. [T+24 hours] Complete penetration test
9. [T+7 days] Post-mortem

**Containment**:
```bash
# Block attacking IP
iptables -A INPUT -s <attacker_ip> -j DROP

# Enable WAF blocking
aws wafv2 update-web-acl --name jhcis-waf --set-regex-string-set "SQL Injection"

# Kill suspicious database connections
ps aux | grep postgres | grep -v grep | awk '{print $2}' | xargs kill
```

### 6.3 Playbook: DDoS Attack

**Trigger**: Traffic spike, service degradation

**Response Steps**:
1. [T+0] Monitoring alerts on traffic spike
2. [T+5 min] Confirm DDoS (vs. legitimate traffic)
3. [T+15 min] Enable CDN rate limiting
4. [T+30 min] Enable geo-blocking if applicable
5. [T+1 hour] Contact upstream provider (ISP/Cloudflare)
6. [T+2 hours] Scale infrastructure if needed
7. [T+4 hours] Implement application-level throttling
8. [T+24 hours] Attack subsides, monitor for waves
9. [T+7 days] Post-mortem, capacity planning

**Containment**:
```bash
# Enable Cloudflare Under Attack mode
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/<zone>/settings/security_level" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  --data '{"value":"under_attack"}'

# Enable aggressive rate limiting
redis-cli SET rate_limit:ddos 1
redis-cli EXPIRE rate_limit:ddos 3600
```

### 6.4 Playbook: Data Breach (PHI/PII)

**Trigger**: Unauthorized data access/exfiltration confirmed

**Response Steps**:
1. [T+0] Detect unauthorized data access
2. [T+15 min] Revoke all potentially compromised credentials
3. [T+30 min] Isolate affected systems
4. [T+1 hour] Engage forensics team
5. [T+2 hours] Assess scope (records, facilities, data types)
6. [T+4 hours] Legal review for PDPA notification
7. [T+24 hours] PDPA notification (if required)
8. [T+48 hours] Affected individual notification
9. [T+7 days] Post-mortem, policy updates

**PDPA Timeline**:
- **72 hours**: Notify PDPC (Personal Data Protection Commission)
- **Immediate**: Notify affected data subjects (if high risk)
- **Documentation**: Maintain breach register

---

## 7. Evidence Preservation

### 7.1 Forensics Requirements

**Preserve**:
- System memory dumps
- Disk images (affected systems)
- Network packet captures
- Application logs (full, not rotated)
- Database transaction logs
- Authentication logs
- Firewall/IDS logs

**Chain of Custody**:
- Document who accessed evidence
- Timestamp all access
- Hash verification (SHA-256)
- Secure storage (encrypted, access-controlled)

### 7.2 Log Retention During Incident

**Standard retention**: 90 days
**Incident hold**: Extend to 7 years for relevant logs
**Export**: Copy to secure cold storage immediately

---

## 8. Legal & Compliance

### 8.1 PDPA Requirements

**Notification Obligations**:
- **PDPC**: Within 72 hours of becoming aware (if high risk)
- **Data Subjects**: Without undue delay (if high risk to rights/freedoms)

**Documentation**:
- Breach register entry
- Risk assessment rationale
- Notification copies
- Remediation evidence

### 8.2 Law Enforcement

**Engagement Criteria**:
- Criminal activity confirmed
- Significant financial impact
- Nation-state actors
- Ransomware/extortion

**Process**:
1. Legal counsel approval
2. Preserve all evidence
3. Contact appropriate agency (Thai Police, FBI, etc.)
4. Coordinate public statements

---

## 9. Training & Exercises

### 9.1 Training Requirements

| Role | Training | Frequency |
|------|----------|-----------|
| IRT Core | Incident response certification | Annual |
| All Engineers | Security awareness + IR basics | Annual |
| Facility Admins | Incident reporting procedures | Annual |
| Executives | Crisis communication | Annual |

### 9.2 Exercise Schedule

| Exercise Type | Frequency | Duration | Participants |
|---------------|-----------|----------|--------------|
| Tabletop (P3 incident) | Quarterly | 2 hours | IRT Core |
| Simulation (P2 incident) | Semi-annual | 4 hours | IRT + Extended |
| Full Drill (P0 incident) | Annual | 1 day | All stakeholders |

### 9.3 Exercise Scenarios

**Sample Scenarios**:
- API key compromise at 5 facilities simultaneously
- Ransomware attack on primary database
- DDoS during peak submission period
- Insider threat: unauthorized data export
- Third-party vendor breach affecting JHCIS

---

## 10. Metrics & Continuous Improvement

### 10.1 Key Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Mean Time to Detect (MTTD) | <30 minutes | Detection timestamp - incident start |
| Mean Time to Respond (MTTR) | <2 hours | Response start - detection |
| Mean Time to Contain (MTTC) | <4 hours | Containment - response start |
| Mean Time to Recover (MTTRec) | <24 hours | Recovery - containment |
| Post-mortem completion rate | 100% | Incidents with post-mortem / total |
| Remediation completion | <30 days | All items closed / incident close |

### 10.2 Continuous Improvement

**Post-Incident Review Questions**:
1. What went well?
2. What could be improved?
3. Were tools/processes adequate?
4. Was communication effective?
5. What would we do differently?

**Improvement Backlog**:
- Track remediation items in Jira
- Assign owners and due dates
- Review progress weekly
- Escalate blockers to leadership

---

## 11. Document Maintenance

### 11.1 Review Schedule

| Document | Review Frequency | Owner |
|----------|-----------------|-------|
| Incident Response Plan | Semi-annual | Security Lead |
| Playbooks | After each incident | Technical Lead |
| Contact List | Quarterly | Ops Manager |
| Communication Templates | Annual | Comms Manager |

### 11.2 Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-21 | Security Team | Initial document |

---

## 12. Appendices

### Appendix A: Contact List

**24/7 Emergency Contacts**:
- Security Lead: +66-XXX-XXX-XXXX
- On-call Engineer: +66-XXX-XXX-XXXX
- Legal Counsel: +66-XXX-XXX-XXXX
- DPO: +66-XXX-XXX-XXXX

**External Contacts**:
- PDPC: 02-XXX-XXXX
- CERT Thailand: 02-XXX-XXXX
- Cloud Provider Support: +1-XXX-XXX-XXXX
- MSP/Vendor: +66-XXX-XXX-XXXX

### Appendix B: Escalation Matrix

| Severity | Escalation Path | Time |
|----------|----------------|------|
| P3 | On-call Engineer | <24 hours |
| P2 | Security Lead + Ops | <4 hours |
| P1 | Security Lead + Legal | <1 hour |
| P0 | All IRT + Executives | Immediate |

### Appendix C: Tool Access

| Tool | Purpose | Access |
|------|---------|--------|
| PagerDuty | On-call management | IRT Core |
| Jira | Incident tracking | IRT + Extended |
| SIEM | Log analysis | Security Team |
| Slack #security | Communication | All Engineers |
| Signal Group | Secure comms | IRT Core |

---

**Acknowledgment**: All IRT members must acknowledge this plan annually and after each major revision.

*This is a living document. Update after each incident with lessons learned.*

---

**Last Updated**: 2026-03-21  
**Next Review**: 2026-09-21  
**Document Owner**: JHCIS Security Team
