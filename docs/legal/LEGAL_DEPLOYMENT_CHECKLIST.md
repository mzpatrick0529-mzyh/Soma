# 🚀 Soma Legal Compliance Deployment Checklist

## Pre-Launch Legal Requirements

This checklist must be completed before Soma can legally operate in the United States. Use this as a step-by-step guide to ensure full compliance.

---

## ✅ Phase 1: Critical Blockers (Must Complete Before ANY User Access)

### Legal Documents Publication
- [ ] **Privacy Policy** - Live at `/legal/privacy-policy`
  - [ ] Accessible from footer on every page
  - [ ] Accessible from Settings → About section
  - [ ] PDF download link functional
  - [ ] Last updated date accurate
  
- [ ] **Terms of Service** - Live at `/legal/terms-of-service`
  - [ ] Accessible from footer on every page  
  - [ ] Accessible from Settings → About section
  - [ ] PDF download link functional
  - [ ] Arbitration clause present (Section 14)

- [ ] **Legal Hub** - Live at `/legal`
  - [ ] All documents linked
  - [ ] Contact emails functional
  - [ ] Compliance badges accurate

### Age Verification
- [ ] Signup form includes birthdate field
- [ ] Age validation logic implemented (18+ years)
- [ ] State-specific age checks:
  - [ ] Alabama, Nebraska: 19+ years
  - [ ] Mississippi: 21+ years
- [ ] COPPA compliance: Under-13 rejection with clear message
- [ ] Age falsification consequences in Terms of Service

### Consent Framework
- [ ] **Terms of Service Acceptance**
  - [ ] Checkbox: "I agree to the Terms of Service" (required)
  - [ ] Clickable link to open Terms in new window/modal
  - [ ] Cannot create account without checking
  - [ ] Consent logged with timestamp, IP, version

- [ ] **Privacy Policy Acknowledgment**
  - [ ] Checkbox: "I acknowledge the Privacy Policy" (required)
  - [ ] Clickable link to open Privacy Policy
  - [ ] Combined with Terms checkbox acceptable
  - [ ] Consent logged with timestamp, IP, version

- [ ] **Illinois BIPA (if serving IL residents)**
  - [ ] Separate written consent for biometric data
  - [ ] Clear description of biometric data collection
  - [ ] Retention period disclosed (account duration + 30 days)
  - [ ] Destruction policy disclosed
  - [ ] Option to decline (disables voice/facial features)

---

## ✅ Phase 2: High Priority (Complete Within Week 1)

### DMCA Compliance
- [ ] **Register DMCA Agent** with U.S. Copyright Office
  - [ ] File online at [copyright.gov/dmca-directory](https://www.copyright.gov/dmca-directory/)
  - [ ] Fee: $6 (first time) + $6 (every 3 years)
  - [ ] Agent information:
    ```
    Soma Inc.
    Attn: Copyright Agent
    [Physical Address]
    Email: dmca@soma.ai
    ```
  - [ ] Registration confirmation received

- [ ] **DMCA Takedown Process**
  - [ ] Email inbox dmca@soma.ai monitored
  - [ ] Documented internal process (24-48 hour response)
  - [ ] Notice template for users when content removed
  - [ ] Counter-notice procedure documented

### Data Protection Infrastructure
- [ ] **Encryption**
  - [ ] TLS 1.3 for all data transmission
  - [ ] AES-256 for data at rest
  - [ ] Database encryption enabled (SQLite: SQLCipher)
  - [ ] Password hashing (bcrypt, cost factor ≥12)
  - [ ] OAuth tokens encrypted in storage

- [ ] **Access Controls**
  - [ ] Role-based access control (RBAC) implemented
  - [ ] Principle of least privilege enforced
  - [ ] User can only access own data
  - [ ] Admin access logged and audited
  - [ ] Two-factor authentication available

- [ ] **Audit Logging**
  - [ ] All data access logged (user ID, timestamp, action)
  - [ ] Admin actions logged separately
  - [ ] Login/logout events logged
  - [ ] Data export/deletion logged
  - [ ] Logs retained for 7 years (litigation hold)

---

## ✅ Phase 3: Medium Priority (Complete Within Month 1)

### California Privacy Rights (CCPA/CPRA)
- [ ] **"Do Not Sell or Share My Personal Information" Link**
  - [ ] Prominent link in footer of every page
  - [ ] Web form to submit opt-out request
  - [ ] Verification process (email confirmation)
  - [ ] Processed within 15 days
  - [ ] Confirmation email sent to user

- [ ] **"Limit the Use of My Sensitive Personal Information" Link**
  - [ ] Prominent link in footer (California users only)
  - [ ] Toggle controls in Settings → Privacy
  - [ ] Limits use to service provision only
  - [ ] Applied within 15 days
  - [ ] Confirmation email sent to user

- [ ] **Data Subject Access Request (DSAR) Form**
  - [ ] Web form at `/legal/data-request` or similar
  - [ ] Verification process (matching email + optional ID upload)
  - [ ] Request types supported:
    - [ ] Access (view all data)
    - [ ] Deletion (with 30-day grace period)
    - [ ] Correction (update inaccurate data)
    - [ ] Portability (download in JSON/CSV)
    - [ ] Opt-out (from sale/sharing)
  - [ ] Response time: 45 days (extend to 90 if complex)
  - [ ] Free for first 2 requests/year; $25 fee thereafter (if allowed by state)

- [ ] **Privacy Policy Addendum**
  - [ ] 13 categories of PI disclosed (per CPRA § 1798.140)
  - [ ] Business purposes for each category
  - [ ] Categories of third parties receiving data
  - [ ] Retention periods specified
  - [ ] Sensitive PI flagged and limited use disclosed

### Data Retention and Deletion
- [ ] **Retention Policy Documented**
  - [ ] L0 raw memories: Account duration
  - [ ] L1 clusters: Account duration
  - [ ] L2 biography: Account duration
  - [ ] Logs: 1 year (operational), 7 years (security/legal)
  - [ ] Backups: 90 days maximum

- [ ] **Deletion Pipeline Implemented**
  - [ ] User can request account deletion from Settings
  - [ ] 30-day grace period (user can cancel)
  - [ ] After 30 days: Remove from production DB
  - [ ] After 90 days: Purge from backups
  - [ ] Confirmation email after complete deletion
  - [ ] Exception: Legal hold (litigation, subpoena)

- [ ] **Machine Unlearning Strategy**
  - [ ] User-specific AI model deleted immediately
  - [ ] If shared models used: Retrain without user data
  - [ ] Privacy Policy discloses technical limitations
  - [ ] User informed that "traces may persist" in trained weights

---

## ✅ Phase 4: Lower Priority (Complete Within Month 2-3)

### Cookie and Tracking Technologies
- [ ] **Cookie Banner** (if cookies beyond essential used)
  - [ ] Appears on first visit
  - [ ] Categories: Essential, Analytics, Marketing
  - [ ] User can accept all, reject all, or customize
  - [ ] Cookie Policy link present
  - [ ] Consent stored for 12 months

- [ ] **Cookie Policy Document**
  - [ ] List all cookies used (name, purpose, duration)
  - [ ] First-party vs third-party designation
  - [ ] How to disable cookies (browser settings)
  - [ ] Link to privacy policy

### Third-Party Service Agreements
- [ ] **Data Processing Agreements (DPAs) Signed**
  - [ ] Google Gemini API / Google Cloud
    - [ ] DPA executed (standard GCP DPA)
    - [ ] Data residency: U.S. only
    - [ ] Sub-processor list reviewed
  - [ ] Railway.app (hosting)
    - [ ] DPA requested and signed
    - [ ] Data location: U.S. data centers
  - [ ] Vercel (hosting)
    - [ ] DPA included in Enterprise Terms (if applicable)
    - [ ] Edge network limited to U.S.
  - [ ] Stripe (payments, future)
    - [ ] DPA available by default
    - [ ] PCI DSS Level 1 certified
  - [ ] OpenAI API (if used for embeddings)
    - [ ] Enterprise API tier (no training on data)
    - [ ] Zero Data Retention policy confirmed

- [ ] **Vendor Risk Assessment**
  - [ ] Security questionnaire sent to all vendors
  - [ ] SOC 2 reports requested (if available)
  - [ ] Insurance certificates reviewed
  - [ ] Incident notification clauses in contracts

### WeChat Data Import Risk Mitigation
- [ ] **Legal Disclaimer Prominent**
  - [ ] Before enabling WeChat import: Warning modal
  - [ ] Content: "You are responsible for compliance with WeChat ToS"
  - [ ] "Soma does not endorse circumventing platform restrictions"
  - [ ] "Decryption key provided by you, not stored by Soma"
  - [ ] User must click "I Understand and Accept Responsibility"

- [ ] **Alternative Path Explored**
  - [ ] Contacted Tencent for official data export API
  - [ ] If denied: Consider disabling WeChat import
  - [ ] Legal counsel consulted on CFAA risk

---

## ✅ Phase 5: Ongoing Compliance

### Security Monitoring
- [ ] **Incident Response Plan**
  - [ ] 24/7 monitoring for security breaches
  - [ ] Escalation procedure documented
  - [ ] Breach notification templates prepared
  - [ ] State AG contact list compiled (for >500 resident breaches)
  - [ ] External forensics firm on retainer

- [ ] **Annual Security Audit**
  - [ ] Penetration testing (Q3 each year)
  - [ ] Vulnerability scanning (monthly)
  - [ ] Code security review (quarterly)
  - [ ] Third-party audit report (if pursuing SOC 2)

### Legal Document Maintenance
- [ ] **Quarterly Review Process**
  - [ ] Legal counsel reviews Privacy Policy
  - [ ] Legal counsel reviews Terms of Service
  - [ ] Check for new federal/state laws
  - [ ] Check for new regulatory guidance (FTC, CPPA)
  - [ ] Update documents if material changes

- [ ] **Version Control**
  - [ ] All changes tracked in Git
  - [ ] Previous versions archived and accessible
  - [ ] Change log maintained
  - [ ] Users notified of material changes (30-day advance notice)

### Training and Awareness
- [ ] **Employee Training**
  - [ ] All employees complete privacy training (annual)
  - [ ] Engineers trained on data minimization
  - [ ] Customer support trained on DSAR handling
  - [ ] Legal compliance training for executives

- [ ] **User Education**
  - [ ] Help Center articles on privacy rights
  - [ ] Blog post explaining CCPA rights
  - [ ] In-app tooltips for privacy settings
  - [ ] Annual privacy reminder email to users

---

## 📊 Compliance Dashboard (Track These Metrics)

| Metric | Target | Tracking |
|--------|--------|----------|
| Privacy Policy acceptance rate | 100% | Signup flow |
| DSAR response time | <45 days | Ticket system |
| DMCA takedown response | <48 hours | dmca@soma.ai |
| Data breach notification | <72 hours | Incident log |
| User data deletion | <30 days production, <90 days backup | Deletion queue |
| Cookie consent rate | >80% acceptance | Analytics |
| DPA execution rate | 100% of vendors | Legal tracker |
| Security patch deployment | <7 days for critical | DevOps |
| Privacy training completion | 100% annually | HR system |

---

## 🚨 Red Flags - Do NOT Launch If:

- ❌ Privacy Policy or Terms of Service not published
- ❌ No age verification on signup
- ❌ No Terms acceptance checkbox
- ❌ Data transmitted without TLS encryption
- ❌ Passwords stored in plain text or weak hashing
- ❌ No DMCA agent registration (if user-generated content)
- ❌ Collecting biometric data from IL residents without written consent
- ❌ No process to handle data deletion requests
- ❌ DPAs not signed with critical vendors (Gemini, hosting)
- ❌ No incident response plan for data breaches

---

## 🎯 Go-Live Approval Checklist

**Before flipping the switch to production:**

- [ ] Legal counsel has reviewed and approved all documents
- [ ] Phase 1 (Critical Blockers) 100% complete
- [ ] Phase 2 (High Priority) 100% complete  
- [ ] Cyber liability insurance purchased ($2M+ coverage)
- [ ] Legal team contact information populated (privacy@, legal@, dmca@, dsr@)
- [ ] All team members trained on privacy procedures
- [ ] Incident response plan tested (table-top exercise)
- [ ] Data backup and recovery tested
- [ ] Privacy Policy and Terms URLs working and accessible
- [ ] User signup flow tested (including consent checkboxes)
- [ ] DSAR process tested end-to-end
- [ ] CEO/Founder final approval obtained

---

**Sign-Off:**

- [ ] **Legal Counsel:** _________________________ Date: _______
- [ ] **CTO/Engineering Lead:** __________________ Date: _______
- [ ] **CEO/Founder:** ___________________________ Date: _______

---

## 📚 Resources and References

- [California AG CCPA Resources](https://oag.ca.gov/privacy/ccpa)
- [FTC Privacy and Security Guidance](https://www.ftc.gov/business-guidance/privacy-security)
- [IAPP Privacy Tech Vendor Report](https://iapp.org/resources/article/privacy-tech-vendor-report/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [DMCA Agent Directory](https://www.copyright.gov/dmca-directory/)

---

**Document Version:** 1.0  
**Created:** October 20, 2025  
**Next Review:** January 20, 2026 (or upon material change)  
**Owner:** Legal & Compliance Team
