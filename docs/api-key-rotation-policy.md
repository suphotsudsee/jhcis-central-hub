# API Key Rotation Policy

## JHCIS Summary Centralization

### Document Control
- **Version**: 1.0
- **Effective Date**: 2026-03-21
- **Owner**: JHCIS Security Team
- **Review Cycle**: Annual

---

## 1. Purpose

This policy establishes mandatory API key rotation requirements for all 80 health facilities connected to the JHCIS Summary Centralization system. Regular rotation minimizes the impact of key compromise and maintains security posture.

---

## 2. Scope

### 2.1 Applicable Systems
- All 80 JHCIS health facility nodes
- API backend services
- Data aggregation pipelines
- Mobile companion apps (if using API keys)

### 2.2 Applicable Personnel
- Facility IT administrators
- JHCIS security team
- On-call operations engineers
- Third-party integrators

---

## 3. Rotation Schedule

### 3.1 Standard Rotation

| Key Age | Action | Responsibility |
|---------|--------|----------------|
| 0-60 days | Monitor | Automated |
| 61-89 days | Notify | Security team |
| 90 days | **Rotate** | Facility admin |
| 91+ days | **Escalate** | Security team |

### 3.2 Rotation Timeline

```
Day 0:    Key provisioned
Day 60:   First notification (email to facility admin)
Day 75:   Second notification (email + dashboard alert)
Day 85:   Final notification (email + SMS if configured)
Day 90:   Key expires, rotation required
Day 91:   Facility access suspended until rotation
```

### 3.3 Grace Period

During rotation, a **24-hour grace period** applies:
- Old key remains valid for 24 hours after new key issued
- Allows time for facility to update configurations
- Both keys accepted by API during this window
- After 24 hours: old key permanently rejected

---

## 4. Rotation Procedures

### 4.1 Scheduled Rotation (Normal)

#### Facility Administrator Steps
1. **Receive notification** (email at Day 60, 75, 85)
2. **Login to JHCIS portal** (https://portal.jhcis.go.th)
3. **Navigate to**: Settings → API Keys → Rotate Key
4. **Generate new key**: Click "Rotate API Key"
5. **Download new key**: Save securely (password manager, encrypted vault)
6. **Update systems**: Replace key in all connected systems
7. **Test connectivity**: Verify data submission works
8. **Confirm completion**: Mark rotation complete in portal

#### Security Team Steps
1. Monitor rotation completion rate
2. Follow up with non-compliant facilities (Day 91+)
3. Update audit logs
4. Verify no service disruptions

### 4.2 Emergency Rotation (Compromise)

#### Trigger Conditions
- Suspected key exposure
- Unauthorized access detected
- Facility security breach
- Staff departure with key access
- Vendor compromise

#### Immediate Actions
1. **Revoke**: Security team invalidates key immediately
2. **Notify**: Facility admin alerted via phone + email
3. **Issue**: New key generated and transmitted securely
4. **Audit**: Review access logs for unauthorized activity
5. **Document**: Incident report initiated

#### Timeline
- **T+0**: Compromise detected
- **T+15 min**: Key revoked
- **T+30 min**: Facility notified
- **T+1 hour**: New key issued
- **T+24 hours**: Incident report complete

---

## 5. Key Storage Requirements

### 5.1 Approved Storage Methods

| Method | Security Level | Recommended For |
|--------|---------------|-----------------|
| Hardware Security Module (HSM) | Critical | Large hospitals |
| Encrypted password manager (1Password, Bitwarden) | High | All facilities |
| OS keychain (macOS Keychain, Windows Credential Manager) | Medium | Workstations |
| Environment variables (encrypted) | Medium | Production servers |
| Configuration files (encrypted at rest) | Low | Development only |

### 5.2 Prohibited Storage

❌ **NEVER store API keys in:**
- Plain text files
- Version control (Git, SVN)
- Shared documents (Google Docs, Word)
- Email drafts or sent items
- Chat messages (Slack, Teams, Line)
- Unencrypted databases
- Client-side code (JavaScript, mobile apps)

### 5.3 Transmission Security

When sharing keys (initial provision or emergency rotation):
- **Encrypted email**: PGP or S/MIME
- **Secure portal**: HTTPS with certificate validation
- **Out-of-band**: Phone call for verification
- **Never**: Plain email, chat, SMS as primary channel

---

## 6. Compliance & Enforcement

### 6.1 Compliance Tracking

Dashboard metrics tracked:
- % facilities with keys <30 days old
- % facilities with keys 30-60 days old
- % facilities with keys 60-90 days old (warning)
- % facilities with keys >90 days old (violation)
- Average rotation completion time
- Emergency rotation count (quarterly)

### 6.2 Enforcement Actions

| Violation | Duration | Action |
|-----------|----------|--------|
| First offense | 1-7 days overdue | Warning email |
| Second offense | 8-14 days overdue | Escalation to hospital director |
| Third offense | 15-30 days overdue | Temporary suspension |
| Repeated | 30+ days overdue | Contract review, penalties |

### 6.3 Exemptions

Temporary exemptions granted for:
- Natural disasters affecting facility
- Major IT system migration
- Force majeure events

Exemption process:
1. Written request to security team
2. Justification documented
3. Maximum 30-day extension
4. Compensating controls required

---

## 7. Technical Implementation

### 7.1 Automated Rotation (Future Enhancement)

Roadmap for automated rotation:
- **Phase 1**: Email notifications (current)
- **Phase 2**: API-based rotation endpoint
- **Phase 3**: Automated key push to facilities
- **Phase 4**: Zero-touch rotation (HSM integration)

### 7.2 Key Versioning

Database tracks:
```sql
api_key_version: INTEGER
previous_key_hash: VARCHAR(255)
rotation_timestamp: TIMESTAMP
rotation_reason: VARCHAR(100)
rotated_by: VARCHAR(50) -- 'scheduled' | 'emergency' | 'manual'
```

### 7.3 Validation During Rotation

Pre-rotation checklist:
- [ ] New key generated successfully
- [ ] New key hash stored in database
- [ ] Old key marked for grace period
- [ ] Facility notified
- [ ] Audit log entry created
- [ ] Monitoring alert configured

Post-rotation verification:
- [ ] Facility confirms new key working
- [ ] Old key rejected after grace period
- [ ] No service disruption reported
- [ ] Rotation marked complete

---

## 8. Roles & Responsibilities

### 8.1 Facility Administrator
- Receive rotation notifications
- Execute rotation before expiry
- Securely store new keys
- Update all connected systems
- Report issues to security team

### 8.2 Security Team
- Monitor rotation compliance
- Send notifications at Day 60/75/85
- Execute emergency rotations
- Track violations
- Maintain rotation dashboard

### 8.3 Operations Team
- Handle rotation-related incidents
- Provide 24/7 support for emergency rotations
- Maintain rotation automation infrastructure

### 8.4 Compliance Officer
- Audit rotation compliance quarterly
- Report metrics to management
- Liaise with PDPA regulator if needed

---

## 9. Metrics & Reporting

### 9.1 Key Performance Indicators

| KPI | Target | Measurement |
|-----|--------|-------------|
| On-time rotation rate | >95% | Keys rotated by Day 90 |
| Emergency rotation count | <5/quarter | Unscheduled rotations |
| Mean rotation time | <7 days | Notification to completion |
| Key compromise incidents | 0 | Confirmed breaches |

### 9.2 Monthly Report

Security team produces monthly report:
- Rotation compliance by facility
- Overdue facilities list
- Emergency rotation summary
- Trends and recommendations

### 9.3 Quarterly Review

Quarterly business review includes:
- Compliance trends
- Policy effectiveness
- Technology improvements
- Training needs

---

## 10. Training & Awareness

### 10.1 Required Training

All facility administrators must complete:
- **Initial**: API key management training (onboarding)
- **Annual**: Refresher training (key rotation procedures)
- **Ad-hoc**: Emergency rotation drill (simulated compromise)

### 10.2 Training Materials

Available resources:
- Video tutorial: "How to Rotate Your API Key"
- Quick reference card: Rotation checklist
- FAQ: Common rotation issues
- Helpdesk: support@jhcis.go.th

### 10.3 Certification

Facility administrators certified after:
- Completing training module
- Passing knowledge check (80%+)
- Successful rotation execution (supervised)

---

## 11. Policy Exceptions

### 11.1 Exception Process

Request exception when:
- Technical constraints prevent rotation
- Third-party dependency blocks rotation
- Business continuity risk identified

Process:
1. Submit written request to security team
2. Include justification and risk assessment
3. Specify compensating controls
4. Define expiration date (max 90 days)
5. Security team approval required

### 11.2 Compensating Controls

If rotation delayed, implement:
- Enhanced monitoring (real-time alerting)
- Reduced key permissions (scope limitation)
- Network segmentation (IP allowlisting)
- Additional MFA layer

---

## 12. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-21 | Security Team | Initial policy |

---

## 13. Related Documents

- `docs/security-plan.md` - Overall security architecture
- `docs/incident-response.md` - Incident handling procedures
- `api-backend/src/utils/apiKeyGenerator.js` - Key generation implementation
- `api-backend/src/middleware/rateLimit.js` - Rate limiting controls

---

**Acknowledgment**: All facility administrators must acknowledge this policy annually via the JHCIS portal.

*Last reviewed: 2026-03-21 | Next review: 2027-03-21*
