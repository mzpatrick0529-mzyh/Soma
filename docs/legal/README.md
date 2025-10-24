# Legal & Compliance Documentation

This folder contains all legal documents, compliance guidelines, and regulatory documentation for Soma.

## ⚖️ Contents

### Core Legal Documents
- **[LEGAL_DOCUMENTATION.md](./LEGAL_DOCUMENTATION.md)** - Master legal documentation overview
- **[LEGAL_FINAL_SUMMARY.md](./LEGAL_FINAL_SUMMARY.md)** - Complete legal implementation summary
- **[LEGAL_QUICK_REFERENCE.md](./LEGAL_QUICK_REFERENCE.md)** - Quick reference guide

### Deployment Checklists
- **[LEGAL_DEPLOYMENT_CHECKLIST.md](./LEGAL_DEPLOYMENT_CHECKLIST.md)** - Pre-launch compliance checklist
- **[LEGAL_DOCUMENTS_DEPLOYMENT.md](./LEGAL_DOCUMENTS_DEPLOYMENT.md)** - Document deployment guide
- **[LEGAL_DOCUMENTS_VERIFICATION.md](./LEGAL_DOCUMENTS_VERIFICATION.md)** - Verification procedures

### Implementation Details
- **[LEGAL_IMPLEMENTATION_SUMMARY.md](./LEGAL_IMPLEMENTATION_SUMMARY.md)** - Implementation overview
- **[LEGAL_INVENTORY.md](./LEGAL_INVENTORY.md)** - Complete inventory of legal assets
- **[LEGAL_QUICKSTART.md](./LEGAL_QUICKSTART.md)** - Quick start guide for legal compliance
- **[LEGAL_PAGES_FIX.md](./LEGAL_PAGES_FIX.md)** - Legal page corrections and updates

## 📋 Compliance Overview

### Implemented Legal Pages
✅ Terms of Service (`/legal/terms`)
✅ Privacy Policy (`/legal/privacy`)
✅ Cookie Policy (integrated into Privacy Policy)
✅ Data Processing Agreement (for B2B, `/legal/dpa`)
✅ Acceptable Use Policy (integrated into Terms)

### Regulatory Compliance
- **GDPR** (General Data Protection Regulation - EU)
- **CCPA** (California Consumer Privacy Act - US)
- **COPPA** (Children's Online Privacy Protection Act - 18+ enforcement)
- **PIPEDA** (Personal Information Protection - Canada)

### Key Features
- User data rights (access, deletion, portability)
- Consent management
- Data retention policies
- Security measures documentation
- Breach notification procedures

## 🚀 Quick Start

### For Developers
1. Review [LEGAL_QUICK_REFERENCE.md](./LEGAL_QUICK_REFERENCE.md)
2. Check [LEGAL_DEPLOYMENT_CHECKLIST.md](./LEGAL_DEPLOYMENT_CHECKLIST.md) before launch
3. Ensure all legal pages are accessible and up-to-date

### For Product Managers
1. Read [LEGAL_FINAL_SUMMARY.md](./LEGAL_FINAL_SUMMARY.md)
2. Verify compliance with [LEGAL_DOCUMENTS_VERIFICATION.md](./LEGAL_DOCUMENTS_VERIFICATION.md)
3. Schedule regular compliance reviews

### For Legal Teams
1. Start with [LEGAL_DOCUMENTATION.md](./LEGAL_DOCUMENTATION.md)
2. Review [LEGAL_IMPLEMENTATION_SUMMARY.md](./LEGAL_IMPLEMENTATION_SUMMARY.md)
3. Audit using [LEGAL_INVENTORY.md](./LEGAL_INVENTORY.md)

## ⚠️ Important Compliance Requirements

### User Consent
- Age verification (18+) required at registration
- Explicit consent for data processing
- Opt-in for marketing communications
- Cookie consent banner

### Data Subject Rights
Users can request:
- Data access (JSON export)
- Data deletion (right to be forgotten)
- Data portability
- Consent withdrawal

Implementation: See `src/pages/Settings/DataSubjectRights.tsx`

### Data Retention
- Active user data: Retained while account is active
- Deleted accounts: 30-day grace period, then permanent deletion
- Backup retention: 90 days maximum
- Logs: 1 year for security purposes

### Security Measures
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Row-Level Security (RLS) in database
- Regular security audits
- Incident response plan

## 📝 Updating Legal Documents

### Process
1. Make changes to source files in `src/pages/legal/`
2. Update version dates in legal pages
3. Notify users of material changes (if applicable)
4. Update [LEGAL_INVENTORY.md](./LEGAL_INVENTORY.md)
5. Run verification checklist

### Material Changes
Material changes require:
- ✅ Email notification to all users
- ✅ Prominent notice in app
- ✅ 30-day notice period before taking effect
- ✅ Option to accept or close account

### Minor Changes
Minor clarifications/formatting:
- Update version date
- No user notification required
- Document in change log

## 🔍 Compliance Monitoring

### Regular Audits
- **Quarterly**: Review legal pages for accuracy
- **Annually**: Full compliance audit
- **Post-incident**: Review and update security documentation

### Metrics to Track
- User consent rates
- Data subject request response times
- Security incident frequency
- Legal page view/acceptance rates

## 🆘 Legal Emergencies

### Data Breach
1. Follow incident response plan (see Privacy Policy § 7)
2. Notify affected users within 72 hours
3. Report to regulatory authorities as required
4. Document all actions taken

### Subpoena/Legal Request
1. Verify legitimacy of request
2. Consult legal counsel
3. Provide only necessary data
4. Notify user unless legally prohibited

### Compliance Violation
1. Immediately document the issue
2. Assess impact and severity
3. Implement corrective measures
4. Report to stakeholders and authorities if required

## 📚 External Resources

- [GDPR Official Text](https://gdpr.eu/)
- [CCPA Official Site](https://oag.ca.gov/privacy/ccpa)
- [COPPA Rule](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)

## ✅ Pre-Launch Checklist

Before going live, verify:
- [ ] All legal pages are accessible
- [ ] Age gate implemented at registration
- [ ] Consent checkboxes present and functional
- [ ] Data subject rights endpoints working
- [ ] Privacy policy links visible in footer
- [ ] Cookie banner displays correctly
- [ ] Contact information up-to-date
- [ ] Legal email monitored (legal@soma.ai)

See [LEGAL_DEPLOYMENT_CHECKLIST.md](./LEGAL_DEPLOYMENT_CHECKLIST.md) for complete list.

---

**For Questions**: Contact legal@soma.ai

**Related Code**:
- Legal Pages: `src/pages/legal/`
- Settings: `src/pages/Settings/`
- Compliance Components: `src/components/ComplianceModals.tsx`
