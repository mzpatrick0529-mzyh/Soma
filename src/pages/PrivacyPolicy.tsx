/**
 * 🔒 Privacy Policy - Soma Inc.
 * Comprehensive U.S. Legal Privacy Document
 * CCPA, GDPR, COPPA Compliant
 * Last Updated: October 22, 2025
 */

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Lock,
  AlertTriangle,
  Download,
  Mail,
  ExternalLink,
  CheckCircle,
  Eye,
  Database,
  Share2,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const lastUpdated = "October 22, 2025";
  const effectiveDate = "October 22, 2025";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/95 border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="text-green-600" size={24} />
              <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="p-8 lg:p-12">
            {/* Critical Privacy Notice */}
            <div className="bg-green-50 border-l-4 border-green-600 p-5 mb-8 rounded-r-lg">
              <div className="flex items-start gap-3">
                <Shield className="text-green-600 mt-0.5 flex-shrink-0" size={24} />
                <div>
                  <p className="text-base text-green-900 font-bold mb-2">🔒 YOUR PRIVACY IS OUR PRIORITY</p>
                  <p className="text-sm text-green-800 leading-relaxed">
                    This Privacy Policy explains how Soma Inc. collects, uses, discloses, and protects your personal information. We are committed to transparency and your right to privacy under CCPA, GDPR, COPPA, and other applicable privacy laws.
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-600">
                  Effective Date: <span className="font-semibold text-gray-900">{effectiveDate}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Last Updated: <span className="font-semibold text-gray-900">{lastUpdated}</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">Version 1.0.0</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download size={16} />
                Download PDF
              </Button>
            </div>

            {/* Table of Contents */}
            <div className="bg-gray-50 rounded-xl p-6 mb-10">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Table of Contents</h2>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                {[
                  "1. Introduction and Scope",
                  "2. Information We Collect",
                  "3. How We Use Your Information",
                  "4. How We Share Your Information",
                  "5. Data Retention",
                  "6. Data Security",
                  "7. Your Privacy Rights (CCPA)",
                  "8. Your Privacy Rights (GDPR)",
                  "9. COPPA - Children's Privacy",
                  "10. Cookies and Tracking Technologies",
                  "11. Third-Party Links",
                  "12. Data Transfers",
                  "13. Marketing Communications",
                  "14. Do Not Track (DNT)",
                  "15. Contact Information",
                  "16. Updates to This Policy",
                ].map((item, index) => (
                  <a
                    key={index}
                    href={`#section-${index + 1}`}
                    className="block text-sm text-green-600 hover:text-green-700 hover:underline transition-colors py-1"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="prose prose-gray max-w-none space-y-8">
              {/* SECTION 1: Introduction and Scope */}
              <section id="section-1" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200 flex items-center gap-3">
                  <Shield className="text-green-600" size={32} />
                  1. Introduction, Scope, and Applicable Privacy Frameworks
                </h2>

                <div className="bg-green-50 border-l-4 border-green-600 p-5 mb-6 rounded-r-lg">
                  <p className="text-sm text-green-900 font-bold mb-2">🔒 PRIVACY-BY-DESIGN COMMITMENT</p>
                  <p className="text-sm text-green-800 leading-relaxed">
                    Soma Inc. is committed to protecting your privacy and maintaining your trust. We believe privacy is a fundamental human right. This Privacy Policy explains comprehensively how we collect, use, disclose, and protect your personal information with transparency and in compliance with all applicable privacy laws.
                  </p>
                </div>

                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Soma Inc.</strong> ("<strong>we</strong>," "<strong>us</strong>," "<strong>our</strong>," or "<strong>Soma</strong>") is committed to protecting your privacy. This Privacy Policy governs how we collect, use, disclose, process, and otherwise handle personal information through:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>Our website located at <a href="https://soma.ai" className="text-green-600 hover:underline">https://soma.ai</a> and all subdomains</li>
                  <li>Mobile applications for iOS (Soma App) and Android (Soma App)</li>
                  <li>Application Programming Interfaces (APIs) and integrations</li>
                  <li>Customer support portals, ticketing systems, and communications channels</li>
                  <li>All other Services, features, and functionality provided by Soma under these Terms</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1.1 Data Controller and Processors</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">Data Controller Information</p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    <strong>Data Controller:</strong> Soma Inc., a Delaware corporation
                  </p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    <strong>Headquarters:</strong> United States
                  </p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    <strong>Privacy Officer:</strong> <a href="mailto:privacy@soma.ai" className="text-blue-600 hover:underline">privacy@soma.ai</a>
                  </p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    <strong>Data Protection Officer (GDPR):</strong> <a href="mailto:dpo@soma.ai" className="text-blue-600 hover:underline">dpo@soma.ai</a>
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1.2 Applicable Privacy Laws and Frameworks</h3>
                <div className="grid md:grid-cols-2 gap-4 my-6">
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">🇺🇸 CCPA Compliance</h4>
                    <p className="text-xs text-blue-800">
                      California Consumer Privacy Act (Cal. Civil Code § 1798.100 et seq.) - 45-day response requirement, detailed consumer rights procedures
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-300 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">🇪🇺 GDPR Compliance</h4>
                    <p className="text-xs text-purple-800">
                      General Data Protection Regulation (EU 2016/679) - 30-day response requirement, comprehensive data subject rights, standard contractual clauses
                    </p>
                  </div>
                  <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 mb-2">👧 COPPA Compliance</h4>
                    <p className="text-xs text-orange-800">
                      Children's Online Privacy Protection Act (15 U.S.C. § 6501) - 72-hour notification, verifiable parental consent, no sale to children under 13
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">⚡ Multi-State Laws</h4>
                    <p className="text-xs text-green-800">
                      Virginia VCDPA, Colorado CPA, Connecticut CTDPA, Utah UCPA, Illinois BIPA, Texas TDPSA
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1.3 Lawful Basis for Processing (GDPR)</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">Legal Bases Under Article 6 GDPR</p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-3">
                    For users in the EU, we process personal data based on the following lawful bases:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                    <li><strong>Article 6(1)(b):</strong> Performance of contract (processing necessary to provide Services)</li>
                    <li><strong>Article 6(1)(a):</strong> Consent (explicit consent for optional processing, marketing)</li>
                    <li><strong>Article 6(1)(c):</strong> Legal obligation (compliance with laws, CCPA, tax requirements)</li>
                    <li><strong>Article 6(1)(d):</strong> Vital interests (emergency situations, safety)</li>
                    <li><strong>Article 6(1)(e):</strong> Public task (if applicable)</li>
                    <li><strong>Article 6(1)(f):</strong> Legitimate interests (fraud prevention, security, service improvement)</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1.4 Scope of This Policy</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  This Privacy Policy applies to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>Personal information we collect directly from you</li>
                  <li>Personal information collected automatically through your use of Soma</li>
                  <li>Personal information we receive from third parties (with your consent or as permitted by law)</li>
                  <li>Personal information you provide through customer support channels</li>
                </ul>
                <p className="text-sm text-gray-600 italic">
                  <strong>Does NOT apply to:</strong> Third-party websites, services, or integrations (Google, Instagram, WeChat) covered by their own privacy policies. We are not responsible for their practices.
                </p>
              </section>

              {/* SECTION 2: Information We Collect */}
              <section id="section-2" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200">
                  2. Information We Collect - Comprehensive Data Inventory
                </h2>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-5 mb-6 rounded-r-lg">
                  <p className="text-sm text-blue-900 font-bold mb-2">DATA TRANSPARENCY COMMITMENT</p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    We collect only the information necessary to provide Services and comply with legal obligations. Below is a comprehensive inventory of all data we collect.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2.1 Information You Provide Directly (Required for Account)</h3>
                <div className="bg-white border border-gray-300 rounded-lg p-5 my-6">
                  <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="text-green-600" size={18} />
                    Account Registration Information:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                      <span><strong>Full Name:</strong> Legal first and last name (required for billing)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                      <span><strong>Email Address:</strong> For account access, verification, and communications (required)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                      <span><strong>Password Hash:</strong> Never stored in plain text; encrypted using bcrypt with salt (required)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                      <span><strong>Phone Number:</strong> Optional; used for 2FA (two-factor authentication) security</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                      <span><strong>Billing Address:</strong> Required for subscription processing and tax compliance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                      <span><strong>Profile Information:</strong> Optional bio, avatar, timezone, language preferences</span>
                    </li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2.2 User Content and Imported Data (Voluntary Uploads)</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Database className="text-blue-600" size={18} />
                    Content YOU Choose to Import or Upload:
                  </p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    <strong>CRITICAL:</strong> You maintain ownership of all User Content. Soma processes this data solely to provide personalized Services to YOUR account. No data is accessible to other users without your explicit permission.
                  </p>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li><strong>📧 Email Data:</strong> Gmail messages, attachments, metadata (sender, recipient, timestamp)</li>
                    <li><strong>📅 Calendar Events:</strong> Event titles, descriptions, dates, times, attendees, locations</li>
                    <li><strong>📸 Photos and Media:</strong> Images, videos, metadata (timestamps, location, EXIF data)</li>
                    <li><strong>💬 Chat Messages:</strong> Conversations from WeChat, WhatsApp, Telegram (you initiate import)</li>
                    <li><strong>📱 Social Media:</strong> Instagram posts, stories, DMs, follower information</li>
                    <li><strong>🗺️ Location Data:</strong> Google Maps history, visited places, timeline data</li>
                    <li><strong>📄 Documents:</strong> PDFs, Word files, text documents you upload manually</li>
                    <li><strong>🎙️ Biometric Data:</strong> Voice recordings (if using voice import feature)</li>
                  </ul>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-red-900 font-bold mb-2">⚠️ YOUR DATA IS YOUR OWN</p>
                  <p className="text-sm text-red-800 leading-relaxed">
                    You explicitly control which data sources to connect. Soma never accesses or imports data without your authorization through OAuth or manual permission. Data remains encrypted and is only accessible to you.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2.3 Usage Data (Automatically Collected)</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">Technical and Behavioral Information</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-3">
                    When you use Soma, we automatically collect:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-yellow-800">
                    <li><strong>Device Information:</strong> Device type, OS (iOS/Android/Windows), browser type, app version</li>
                    <li><strong>Connection Data:</strong> IP address, ISP information, connection type (WiFi/mobile)</li>
                    <li><strong>Geolocation:</strong> Approximate location derived from IP (city-level accuracy)</li>
                    <li><strong>Identifiers:</strong> Unique device ID (UDID for iOS, IDFA for ad tracking, Android ID)</li>
                    <li><strong>Usage Analytics:</strong> Pages/features accessed, time spent on each feature, button clicks</li>
                    <li><strong>Search Queries:</strong> Search terms you enter (within your account only)</li>
                    <li><strong>Error Logs:</strong> System errors, crashes, API errors (for debugging)</li>
                    <li><strong>Referral Data:</strong> Source of traffic (Google Search, direct, referral link)</li>
                    <li><strong>Session Information:</strong> Login times, session duration, logout events</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2.4 Payment and Billing Information</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">🛡️ Payment Security Statement</p>
                  <p className="text-sm text-green-800 leading-relaxed mb-3">
                    Soma NEVER directly collects or stores full credit card numbers. Payment processing is handled by PCI-DSS compliant third parties (Stripe, PayPal). We receive only:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-green-800">
                    <li><strong>Transaction ID:</strong> Unique identifier for each transaction</li>
                    <li><strong>Amount Paid:</strong> Subscription amount, currency, tax included</li>
                    <li><strong>Card Last 4 Digits:</strong> For receipt display and card identification only</li>
                    <li><strong>Cardholder Name:</strong> Name on card (for billing records)</li>
                    <li><strong>Billing Address:</strong> For tax calculation and compliance</li>
                    <li><strong>Billing Frequency:</strong> Monthly/annual subscription cycle</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2.5 Communications Data</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  When you communicate with Soma:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Support Tickets:</strong> Your questions, descriptions of issues, attachments you send</li>
                  <li><strong>Feedback and Suggestions:</strong> Feature requests, product feedback, improvement suggestions</li>
                  <li><strong>Surveys:</strong> Your responses to user satisfaction surveys, A/B testing data</li>
                  <li><strong>Email Communications:</strong> Email threads with Soma staff, support conversations</li>
                  <li><strong>Chat/Live Support:</strong> Live chat conversations with support representatives</li>
                  <li><strong>Reports:</strong> Complaint reports, abuse reports, security issues reported</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2.6 Third-Party Integrations (With Your Authorization)</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">OAuth and API Permissions</p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-3">
                    When you authorize Soma to access third-party services, we receive:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                    <li><strong>Google Services:</strong> Email (Gmail), Calendar, Photos, Google Drive (based on OAuth scopes you approve)</li>
                    <li><strong>Instagram:</strong> Posts, media, follower information (via Instagram Graph API)</li>
                    <li><strong>WeChat:</strong> Chat history, contacts, messages (encrypted import only)</li>
                    <li><strong>Other Third Parties:</strong> Any other services you explicitly authorize through OAuth</li>
                  </ul>
                  <p className="text-xs text-purple-800 mt-3 italic">
                    <strong>You Control Access:</strong> You can revoke these permissions at any time in your account settings or the third-party provider's app permissions page.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2.7 Inferred and Derived Data</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Based on data you provide and your usage, we may derive:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>User Interests:</strong> Inferred interests based on content you import</li>
                  <li><strong>Personality Traits:</strong> Personality analysis based on communication patterns</li>
                  <li><strong>Usage Patterns:</strong> Peak usage times, feature preferences, engagement level</li>
                  <li><strong>AI Model Outputs:</strong> Results from machine learning models trained on your data</li>
                  <li><strong>Risk Assessments:</strong> Fraud risk scores, account security assessments</li>
                </ul>
              </section>

              {/* SECTION 3: How We Use Your Information */}
              <section id="section-3" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200">
                  3. How We Use Your Information - Comprehensive Usage Purposes
                </h2>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3.1 Core Service Delivery (Contractual Performance)</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">✅ CONTRACTUAL NECESSITY (Legal Basis: GDPR Article 6(1)(b))</p>
                  <p className="text-sm text-green-800 leading-relaxed mb-3">
                    We use your information to perform the Services you've requested:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                    <li><strong>Account Management:</strong> Create, maintain, authenticate, and manage your account</li>
                    <li><strong>Service Provision:</strong> Provide AI-powered personalization, voice cloning, and memory systems</li>
                    <li><strong>Data Processing:</strong> Import, process, and analyze your User Content</li>
                    <li><strong>Third-Party Integration:</strong> Connect and sync with Google, Instagram, WeChat</li>
                    <li><strong>AI Model Training:</strong> Train user-specific AI models on your data (ONLY for your account)</li>
                    <li><strong>Content Delivery:</strong> Deliver personalized responses, recommendations, and insights</li>
                    <li><strong>System Maintenance:</strong> Maintain server infrastructure, databases, backup systems</li>
                    <li><strong>API Services:</strong> If using Soma API, process API requests and deliver results</li>
                    <li><strong>Account Features:</strong> Enable voice cloning, personality matching, memory persistence</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3.2 Communications and Notifications</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">Communication Purposes (Legal Basis: GDPR Article 6(1)(b) and 6(1)(c))</p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    We send communications to keep you informed:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-blue-800">
                    <li><strong>Account Notifications:</strong> New login notifications, suspicious activity alerts, 2FA prompts</li>
                    <li><strong>Transactional Emails:</strong> Password resets, email verification, receipt confirmations</li>
                    <li><strong>Billing Notifications:</strong> Payment confirmations, subscription renewals, billing issues, failed payments</li>
                    <li><strong>Customer Support:</strong> Responses to support tickets, status updates on issues, account recovery</li>
                    <li><strong>Service Changes:</strong> Updates to Terms of Service, Privacy Policy, feature changes (30-day notice)</li>
                    <li><strong>Security Alerts:</strong> Breach notifications (CCPA §1798.82: within 60 days), password change requests, 2FA setup</li>
                    <li><strong>Emergency Notifications:</strong> System outages, service interruptions, critical issues, maintenance windows</li>
                    <li><strong>Account Status:</strong> Upgrade offers, subscription expiration warnings, account suspension notices</li>
                  </ul>
                  <p className="text-xs text-blue-800 mt-3 italic">
                    <strong>Your Control:</strong> You can control most notifications in account settings. However, we MUST send legally required communications (e.g., account security alerts, breach notifications).
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3.3 Analytics, Optimization, and Service Improvement</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">Continuous Service Enhancement (Legal Basis: GDPR Article 6(1)(f) - Legitimate Interest)</p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-3">
                    We use data to continuously improve Soma:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                    <li><strong>Performance Analytics:</strong> Monitor uptime, response times, error rates, server load</li>
                    <li><strong>Feature Usage Analysis:</strong> Which features are most/least used to prioritize development</li>
                    <li><strong>Bug Detection & Fixing:</strong> Identify errors and crashes to fix quickly (server logs, error tracking)</li>
                    <li><strong>User Experience Research:</strong> Analyze user journeys to improve UI/UX (heatmaps, session recordings)</li>
                    <li><strong>Conversion Funnel Analysis:</strong> Where users drop off in signup/payment flows to optimize flows</li>
                    <li><strong>A/B Testing:</strong> Test new features with subsets of users to determine best version</li>
                    <li><strong>Aggregated Reports:</strong> Generate anonymous usage reports for product insights</li>
                    <li><strong>Product Roadmap Planning:</strong> Prioritize new features based on user demand and usage data</li>
                    <li><strong>Engagement Metrics:</strong> Track retention rates, churn predictions, user satisfaction</li>
                  </ul>
                  <p className="text-xs text-purple-800 mt-3">
                    <strong>Data Anonymization:</strong> This analysis typically uses aggregated, anonymized data (impossible to trace back to you).
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3.4 Marketing and Promotional Communications (Opt-In Only)</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">⚠️ OPTIONAL - CAN-SPAM Compliance (Legal Basis: GDPR Article 6(1)(a) - Consent)</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-3">
                    Only if you explicitly opt-in will we send promotional content:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-yellow-800">
                    <li><strong>Promotional Emails:</strong> New features, special offers, discounts, limited-time deals</li>
                    <li><strong>Newsletters:</strong> Soma news, updates, blog articles, customer success stories</li>
                    <li><strong>Product Announcements:</strong> Major releases, product updates, beta features</li>
                    <li><strong>Personalized Recommendations:</strong> Features you might like based on usage patterns</li>
                    <li><strong>Retargeting Ads:</strong> Ads on Google, Facebook, Instagram (only if you opt-in to web tracking)</li>
                    <li><strong>Event Invitations:</strong> Webinars, product demos, community events</li>
                  </ul>
                  <p className="text-xs text-yellow-800 mt-3">
                    <strong>Unsubscribe Anytime:</strong> Every marketing email contains an unsubscribe link (CAN-SPAM compliance). You can also adjust preferences in Settings→Notifications.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3.5 Legal Compliance and Safety</h3>
                <div className="bg-red-50 border border-red-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-red-900 font-semibold mb-3">Legal Obligations & Safety (Legal Basis: GDPR Article 6(1)(c) - Legal Obligation)</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-3">
                    We process data as required by law and to protect safety:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-red-800">
                    <li><strong>Legal Compliance:</strong> Comply with CCPA (§1798.100-125), GDPR, COPPA, tax laws, and other regulations</li>
                    <li><strong>Law Enforcement Requests:</strong> Respond to legal process (subpoena, warrant) from authorities with appropriate legal review</li>
                    <li><strong>Fraud Prevention & Detection:</strong> Detect and prevent payment fraud, account takeover, chargebacks, abuse</li>
                    <li><strong>Security & Threat Prevention:</strong> Identify and block security threats, malware, unauthorized access attempts</li>
                    <li><strong>Terms Enforcement:</strong> Detect violations of Terms of Service (harassment, spam, illegal content, DMCA infringement)</li>
                    <li><strong>Safety & Emergency:</strong> Prevent imminent harm, threats to safety, emergency situations, suicide prevention</li>
                    <li><strong>Account Recovery:</strong> Verify identity during account recovery requests (identity verification)</li>
                    <li><strong>Litigation:</strong> Enforce rights in disputes or legal proceedings</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3.6 Machine Learning and AI Model Training</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">AI-Specific Data Usage (Legal Basis: GDPR Article 6(1)(b) - Contractual Performance)</p>
                  <p className="text-sm text-indigo-800 leading-relaxed mb-3">
                    <strong>CRITICAL:</strong> User Content is used ONLY for your personalized AI models:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-indigo-800">
                    <li><strong>User-Specific Models:</strong> Train AI models specific to your account and preferences (NOT shared with others)</li>
                    <li><strong>Personalization Quality:</strong> Improve response relevance and accuracy specifically for you</li>
                    <li><strong>Voice Cloning:</strong> Create voice models matching your voice (only your Voice Content, consent required)</li>
                    <li><strong>Personality Tuning:</strong> Customize AI responses to match your communication style and preferences</li>
                    <li><strong>Context Retention:</strong> Store conversation history to improve context understanding in future conversations</li>
                    <li><strong>No Cross-User Training:</strong> Your data is NOT used to train models for other users</li>
                    <li><strong>No Public Release:</strong> Your data is NOT used to create public models or shared systems</li>
                    <li><strong>No Resale:</strong> Your trained models are not sold or licensed to third parties</li>
                  </ul>
                  <p className="text-xs text-indigo-800 mt-3 italic">
                    <strong>Your Control:</strong> You can opt-out of AI model training in Settings→AI Settings→Disable Personalization. Opting out may reduce personalization quality but improves privacy.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3.7 Aggregate and Anonymized Usage</h3>
                <div className="bg-pink-50 border border-pink-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-pink-900 font-semibold mb-3">Aggregated & Anonymized Data (No Personal Identification)</p>
                  <p className="text-sm text-pink-800 leading-relaxed mb-3">
                    We may use aggregated, anonymized data (impossible to trace back to you individually):
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-pink-800">
                    <li><strong>Industry Benchmarking:</strong> Compare our performance to industry standards</li>
                    <li><strong>Academic Research:</strong> Publish anonymized research papers (with IRB approval)</li>
                    <li><strong>Public Reports:</strong> "X million users trust Soma" or "Average user engages 5 hours/week"</li>
                    <li><strong>Product Development:</strong> Identify trends to guide feature planning</li>
                    <li><strong>Marketing Materials:</strong> Use aggregated statistics in case studies and testimonials</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3.8 International User Considerations</h3>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-gray-900 font-semibold mb-3">Jurisdiction-Specific Standards</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-800">
                    <li><strong>GDPR (EU Users):</strong> We process data only based on lawful bases (Article 6). No automated decision-making without opt-in (Article 22).</li>
                    <li><strong>CCPA (California Users):</strong> You have rights to know, delete, opt-out of sale (§1798.100-125). We provide detailed disclosures.</li>
                    <li><strong>COPPA (Children &lt;13):</strong> We do NOT knowingly collect data from children. Parents can request deletion.</li>
                    <li><strong>Other State Laws:</strong> Virginia, Colorado, Connecticut, Utah laws respected with consumer opt-out rights.</li>
                  </ul>
                </div>
              </section>

              {/* SECTION 4: How We Share Your Information */}
              <section id="section-4" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200">
                  4. How We Share Your Information - Comprehensive Data Sharing Policy
                </h2>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4.1 We DO NOT Sell Your Data (CCPA §1798.115 Compliance)</h3>
                <div className="bg-red-50 border-l-4 border-red-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-red-900 font-bold mb-3">🚫 CRITICAL COMMITMENT - "NO SALE" PLEDGE</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-4">
                    <strong>Soma DOES NOT sell, rent, lease, or share your personal information or User Content with third parties for commercial benefit or marketing purposes.</strong> This is our binding commitment under:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-red-800">
                    <li><strong>CCPA §1798.115:</strong> California "Do Not Sell My Personal Information" compliance</li>
                    <li><strong>GDPR Article 20:</strong> No transfer of data to uncontrolled third parties</li>
                    <li><strong>State Privacy Laws:</strong> Virginia VCCPA, Colorado CPA, Connecticut CTDPA, Utah UCPA all respected</li>
                    <li><strong>International Commitments:</strong> GDPR Standard Contractual Clauses for any cross-border transfers</li>
                  </ul>
                  <p className="text-xs text-red-800 mt-3 italic font-semibold">
                    ⚠️ The ONLY exception: If required by law (subpoena, warrant) or to prevent imminent harm. We will notify you of legal demands unless prohibited.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4.2 Service Providers (Authorized Third Parties with Data Processing Agreements)</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">Data Processors Under Contract (GDPR Article 28 Compliant)</p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-4">
                    We share LIMITED information with trusted service providers who are contractually bound to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-blue-800 mb-4">
                    <li>Process data ONLY on our instructions</li>
                    <li>Implement data security measures (encryption, access controls)</li>
                    <li>NOT use data for their own purposes</li>
                    <li>NOT share data with sub-processors without approval</li>
                    <li>Comply with GDPR Data Processing Agreements (DPAs)</li>
                  </ul>

                  <p className="text-sm text-blue-900 font-semibold mb-3">Current Service Providers (with Restrictions):</p>
                  <div className="space-y-3 text-sm text-blue-800">
                    <div className="border-l-4 border-blue-400 pl-4 bg-white p-3 rounded">
                      <p className="font-semibold">☁️ Cloud Infrastructure Provider</p>
                      <p><strong>Google Cloud Platform (GCP)</strong> for hosting, storage, backup</p>
                      <p className="text-xs text-gray-600 mt-1">Data: Server logs, database backups, file storage. Scope: Infrastructure only (DPA signed)</p>
                    </div>
                    <div className="border-l-4 border-blue-400 pl-4 bg-white p-3 rounded">
                      <p className="font-semibold">💳 Payment Processing</p>
                      <p><strong>Stripe, PayPal</strong> for subscription and payment handling</p>
                      <p className="text-xs text-gray-600 mt-1">Data: Name, billing address, last 4 digits of card. PCI-DSS compliance required. Scope: Payment processing only</p>
                    </div>
                    <div className="border-l-4 border-blue-400 pl-4 bg-white p-3 rounded">
                      <p className="font-semibold">🤖 AI & ML Services</p>
                      <p><strong>Google Gemini API</strong> for language model inference</p>
                      <p className="text-xs text-gray-600 mt-1">Data: Conversation context (non-identifying). Scope: API calls only. Google does NOT train models on your data (per Google DPA)</p>
                    </div>
                    <div className="border-l-4 border-blue-400 pl-4 bg-white p-3 rounded">
                      <p className="font-semibold">📧 Email Service</p>
                      <p><strong>SendGrid, AWS SES</strong> for transactional emails</p>
                      <p className="text-xs text-gray-600 mt-1">Data: Email address, message content. Scope: Email delivery only (DPA signed)</p>
                    </div>
                    <div className="border-l-4 border-blue-400 pl-4 bg-white p-3 rounded">
                      <p className="font-semibold">📊 Analytics Services</p>
                      <p><strong>Google Analytics, Amplitude</strong> for usage analytics (OPTIONAL)</p>
                      <p className="text-xs text-gray-600 mt-1">Data: Anonymized usage data (page views, feature usage). Scope: Aggregated analytics only</p>
                    </div>
                    <div className="border-l-4 border-blue-400 pl-4 bg-white p-3 rounded">
                      <p className="font-semibold">🔐 Authentication & Security</p>
                      <p><strong>Auth0, Okta</strong> for account authentication and security</p>
                      <p className="text-xs text-gray-600 mt-1">Data: Email, hashed password, 2FA tokens. Scope: Authentication & fraud detection only</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4.3 Legal Requirements and Law Enforcement (GDPR Article 6(1)(c))</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">When We MUST Share Information</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-4">
                    We may disclose information when required by law or to protect safety:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-yellow-800">
                    <li><strong>Legal Process:</strong> Valid subpoena, court order, warrant from law enforcement (with CCPA §1798.100 verification)</li>
                    <li><strong>Government Agencies:</strong> Tax authorities, regulatory agencies, agencies with subpoena power</li>
                    <li><strong>Imminent Harm:</strong> Prevent death, serious physical injury, or imminent danger</li>
                    <li><strong>Criminal Activity:</strong> Report serious crimes (child exploitation, terrorism, violent felonies)</li>
                    <li><strong>Fraud Prevention:</strong> Report payment fraud, account takeover, unauthorized access to law enforcement</li>
                    <li><strong>Compliance:</strong> Meet statutory obligations (tax laws, AML/KYC, FARA, etc.)</li>
                  </ul>
                  <p className="text-xs text-yellow-800 mt-4 font-semibold">
                    <strong>Our Commitment:</strong> We WILL NOT voluntarily disclose information to governments without a valid legal process. We will:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-xs text-yellow-800">
                    <li>Challenge overbroad or invalid requests in court if possible</li>
                    <li>Request the SHORTEST data retention period allowed</li>
                    <li>Publish transparency reports (twice yearly) showing all requests and our responses</li>
                    <li>Notify users of law enforcement requests UNLESS legally prohibited</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4.4 Business Transfers (Merger, Acquisition, Bankruptcy)</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">What Happens to Your Data in M&A Transactions</p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-4">
                    In the event of merger, acquisition, bankruptcy, or sale of substantially all assets:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                    <li><strong>Data Transfers:</strong> Your information may be transferred to the acquiring company as part of the transaction</li>
                    <li><strong>Notice Requirement:</strong> We will provide at least 30 days' advance notice to affected users</li>
                    <li><strong>Privacy Terms:</strong> The acquiring company must agree to honor this Privacy Policy (or notify you of material changes)</li>
                    <li><strong>Opt-Out Right:</strong> You may request deletion rather than transfer (within 30-day notice period)</li>
                    <li><strong>Bankruptcy:</strong> If filed, user data treated as company asset but subject to court approval and privacy protections</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4.5 Your Choices and Controls</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">Data Sharing Preferences You Control</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                    <li><strong>Analytics Opt-Out:</strong> Disable Google Analytics tracking in Settings→Privacy (disables usage analytics sharing)</li>
                    <li><strong>Marketing Communications:</strong> Unsubscribe from promotional emails (does NOT disable transactional emails)</li>
                    <li><strong>Third-Party Integrations:</strong> Revoke OAuth permissions for Google, Instagram, WeChat (immediately stops data sync)</li>
                    <li><strong>Location Sharing:</strong> Disable geolocation services in Settings→App Permissions</li>
                    <li><strong>Cookie Preferences:</strong> Manage cookie consent in Settings→Cookie Settings</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4.6 Aggregated and Anonymized Data (Non-Personal Information)</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">Truly De-Identified Data (Cannot Identify You)</p>
                  <p className="text-sm text-indigo-800 leading-relaxed mb-4">
                    We may freely use and share aggregated, anonymized data (impossible to trace back to you):
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-indigo-800">
                    <li><strong>Industry Research:</strong> "Average Soma user engages 4.5 hours per week" (aggregated only)</li>
                    <li><strong>Benchmarking:</strong> Compare our performance to industry standards</li>
                    <li><strong>Academic Publication:</strong> Publish anonymized research papers (with IRB approval)</li>
                    <li><strong>Public Reports:</strong> "X million users trust Soma" statistics in marketing materials</li>
                    <li><strong>Third-Party Analytics:</strong> Share with SimilarWeb, Crunchbase, etc. (non-identifying only)</li>
                  </ul>
                  <p className="text-xs text-indigo-800 mt-3 italic">
                    <strong>Standard:</strong> Data must be de-identified per NIST SP 800-188 or HIPAA Safe Harbor standards (no re-identification risk).
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4.7 International Data Transfers (GDPR Standard Contractual Clauses)</h3>
                <div className="bg-pink-50 border border-pink-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-pink-900 font-semibold mb-3">Cross-Border Data Transfer Safeguards</p>
                  <p className="text-sm text-pink-800 leading-relaxed mb-4">
                    If Soma transfers your data to countries outside the EU/EEA or other jurisdictions:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-pink-800">
                    <li><strong>Standard Contractual Clauses (SCCs):</strong> We use EU-approved SCCs for GDPR compliance (Decision 4/2021)</li>
                    <li><strong>Privacy Shield Alternative:</strong> If SCC inadequate, we implement Binding Corporate Rules (BCRs)</li>
                    <li><strong>Adequacy Determinations:</strong> We rely on existing EU adequacy decisions where applicable</li>
                    <li><strong>Supplementary Measures:</strong> Encryption, access controls, data minimization for high-risk transfers</li>
                    <li><strong>Notice to Users:</strong> You'll be notified if transfer mechanisms change materially</li>
                  </ul>
                </div>
              </section>

              {/* SECTION 5: Data Retention */}
              <section id="section-5" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200 flex items-center gap-3">
                  <Clock className="text-green-600" size={32} />
                  5. Data Retention - Jurisdiction-Specific Timelines
                </h2>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5.1 Active Accounts (During Service Provision)</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">While Your Account is Active:</p>
                  <p className="text-sm text-green-800 leading-relaxed mb-3">
                    We retain your information to provide Services:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                    <li><strong>Account Data:</strong> Retained for account management (until account deletion)</li>
                    <li><strong>User Content:</strong> Retained as long as you store it (you control deletion)</li>
                    <li><strong>Transaction History:</strong> Retained for 7 years (tax and accounting compliance)</li>
                    <li><strong>Communications:</strong> Retained for 2 years for support reference</li>
                    <li><strong>Usage Logs:</strong> Retained for 90 days (performance monitoring)</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5.2 Account Deletion (User-Initiated)</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">If You Delete Your Account:</p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-4">
                    Upon your request, we delete data on this timeline:
                  </p>
                  <div className="space-y-3">
                    <div className="border-l-4 border-blue-400 pl-4 bg-white p-3 rounded">
                      <p className="font-semibold text-sm">⚡ Immediate (24 hours)</p>
                      <p className="text-xs text-gray-700">Account access disabled, profile removed from public views</p>
                    </div>
                    <div className="border-l-4 border-blue-400 pl-4 bg-white p-3 rounded">
                      <p className="font-semibold text-sm">🗑️ Production Systems (30 days)</p>
                      <p className="text-xs text-gray-700">User content, account data deleted from active databases. CCPA compliance: respond within 45 days of verification (§1798.100)</p>
                    </div>
                    <div className="border-l-4 border-blue-400 pl-4 bg-white p-3 rounded">
                      <p className="font-semibold text-sm">💾 Backup Systems (90 days)</p>
                      <p className="text-xs text-gray-700">Data retained in encrypted backups for disaster recovery (automatic purge)</p>
                    </div>
                    <div className="border-l-4 border-blue-400 pl-4 bg-white p-3 rounded">
                      <p className="font-semibold text-sm">📋 Records (7 years)</p>
                      <p className="text-xs text-gray-700">Payment/tax records retained per IRS requirements (§1798.155 CCPA exemption)</p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-800 mt-4 italic">
                    <strong>Confirmation:</strong> We will send you email confirmation within 15 business days confirming deletion completion.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5.3 Inactive Accounts (Auto-Deletion Policy)</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">⚠️ Automatic Inactivity Deletion</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-4">
                    To protect dormant accounts, we delete inactive accounts on this schedule:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-yellow-800 mb-4">
                    <li><strong>12 months with NO login:</strong> Account eligible for deletion</li>
                    <li><strong>Month 10:</strong> First warning email sent to registered email address</li>
                    <li><strong>Month 11:</strong> Second warning email with urgent notice</li>
                    <li><strong>Month 11.5:</strong> Final deletion notice with 2-week reactivation window</li>
                    <li><strong>Month 12:</strong> Account and associated data deleted permanently</li>
                  </ul>
                  <p className="text-xs text-yellow-800">
                    <strong>Reactivation:</strong> You can prevent deletion at ANY point by logging in or clicking the link in warning emails.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5.4 Backup and Archive Systems</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">Backup Data Retention</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                    <li><strong>Regular Backups:</strong> Created daily and retained for 90 days (disaster recovery window)</li>
                    <li><strong>Archive Backups:</strong> Created monthly and retained for 1 year (compliance archive)</li>
                    <li><strong>Encryption:</strong> All backups encrypted with AES-256 at rest</li>
                    <li><strong>Deletion Compliance:</strong> Backups purged automatically per retention schedule (no manual intervention)</li>
                    <li><strong>Recovery SLA:</strong> Any user-deleted data restored from backups within 90 days at user's request</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5.5 Legal Hold and Litigation Preservation</h3>
                <div className="bg-red-50 border border-red-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-red-900 font-semibold mb-3">If Legally Required</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-red-800">
                    <li><strong>Court Order:</strong> Data retained indefinitely per litigation hold</li>
                    <li><strong>Regulatory Investigation:</strong> Data retained per government agency request</li>
                    <li><strong>Notice to User:</strong> We will notify you of legal hold unless prohibited by law</li>
                    <li><strong>Duration:</strong> Hold maintained until legal proceeding concluded + appeal period expires</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5.6 Specific Data Retention Periods by Type</h3>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-gray-900 font-semibold mb-4">Data Category Retention Schedule:</p>
                  <div className="space-y-2 text-xs text-gray-800">
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Account Information (name, email, password)</span>
                      <span className="text-right">Until deletion + 30 days</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">User Content (emails, photos, memories)</span>
                      <span className="text-right">Until deletion + 90 days (backup)</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Payment Information</span>
                      <span className="text-right">7 years (tax compliance)</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Transaction History</span>
                      <span className="text-right">7 years (IRS requirements)</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Support Tickets & Communications</span>
                      <span className="text-right">2 years (customer service reference)</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Server Logs & Analytics</span>
                      <span className="text-right">90 days (performance monitoring)</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">Security Audit Logs</span>
                      <span className="text-right">1 year (SOC 2 compliance)</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold">AI Training Data (conversations)</span>
                      <span className="text-right">Until model retrained or deletion</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Failed Login Attempts</span>
                      <span className="text-right">30 days (security monitoring)</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5.7 International Variations (GDPR, CCPA, State Laws)</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">Jurisdiction-Specific Timelines:</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-indigo-800">
                    <li><strong>GDPR (EU/UK):</strong> Delete within 30 days of request; storage minimization principle (Article 5(1)(e))</li>
                    <li><strong>CCPA (California):</strong> Delete within 45 days of verification; exemptions for accounting/tax (§1798.155)</li>
                    <li><strong>VCDPA (Virginia):</strong> Delete within reasonable timeframe after request</li>
                    <li><strong>COPPA (Children):</strong> Delete within 30 days of parent request (15 U.S.C. § 6505)</li>
                  </ul>
                </div>
              </section>

              {/* SECTION 6: Data Security */}
              <section id="section-6" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200 flex items-center gap-3">
                  <Lock className="text-green-600" size={32} />
                  6. Data Security - Technical & Organizational Measures
                </h2>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6.1 Encryption Standards</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">🔒 Encryption Protection</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-blue-800">
                    <li><strong>In Transit:</strong> All data encrypted with TLS 1.2+ during transmission</li>
                    <li><strong>At Rest:</strong> All sensitive data encrypted with AES-256 encryption</li>
                    <li><strong>Password Hashing:</strong> Passwords hashed with bcrypt or scrypt (salted, never stored plaintext)</li>
                    <li><strong>Payment Data:</strong> Card data tokenized and never stored by Soma (handled by PCI-DSS compliant processor)</li>
                    <li><strong>Database Encryption:</strong> Entire database encrypted at rest with AES-256</li>
                    <li><strong>Key Management:</strong> Encryption keys stored separately in secure key management system (Google Cloud KMS)</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6.2 Access Controls</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">Access Restriction Measures</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                    <li><strong>Role-Based Access Control (RBAC):</strong> Employees access only data necessary for their role</li>
                    <li><strong>Admin Separation:</strong> Separate admin accounts from personal accounts (no root access to personal data)</li>
                    <li><strong>Multi-Factor Authentication:</strong> All admin and service accounts require 2FA (TOTP or hardware keys)</li>
                    <li><strong>IP Whitelisting:</strong> System admin access limited to company IP ranges</li>
                    <li><strong>Session Management:</strong> Admin sessions expire after 15 minutes of inactivity</li>
                    <li><strong>Privileged Access Logging:</strong> All admin data access logged and audited quarterly</li>
                    <li><strong>Database Access:</strong> Direct database access restricted (no shell access, query logging enabled)</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6.3 Authentication & Authorization</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">Account Protection</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                    <li><strong>Password Requirements:</strong> Minimum 12 characters, mixed case, numbers, special characters recommended</li>
                    <li><strong>Password Expiration:</strong> Optional password reset every 90 days (reminder sent)</li>
                    <li><strong>Account Lockout:</strong> After 5 failed login attempts, account locked for 30 minutes</li>
                    <li><strong>Optional 2FA:</strong> Users can enable TOTP-based 2FA (Google Authenticator, Authy) or hardware keys</li>
                    <li><strong>Session Security:</strong> Sessions use secure, HTTPOnly cookies with SameSite protection</li>
                    <li><strong>Device Trust:</strong> Option to trust devices and skip 2FA on known devices</li>
                    <li><strong>Suspicious Login Detection:</strong> Alerts sent for logins from new locations or devices</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6.4 Infrastructure Security</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">🏗️ System Architecture Security</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-yellow-800">
                    <li><strong>Cloud Infrastructure:</strong> Google Cloud Platform with security defaults enabled</li>
                    <li><strong>Firewalls:</strong> WAF (Web Application Firewall) blocks common web attacks (SQL injection, XSS, DDoS)</li>
                    <li><strong>Network Isolation:</strong> Production systems isolated in private VPC, no direct internet exposure</li>
                    <li><strong>DDoS Protection:</strong> Google Cloud DDoS protection + rate limiting on all endpoints</li>
                    <li><strong>API Rate Limiting:</strong> Endpoints rate-limited per user/IP to prevent abuse</li>
                    <li><strong>Container Security:</strong> All services run in hardened, minimal Docker containers</li>
                    <li><strong>Vulnerability Scanning:</strong> Automated scanning of container images and dependencies</li>
                    <li><strong>Patch Management:</strong> Critical security patches applied within 24 hours</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6.5 Monitoring & Incident Response</h3>
                <div className="bg-red-50 border border-red-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-red-900 font-semibold mb-3">⚠️ Security Monitoring</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-red-800">
                    <li><strong>24/7 Monitoring:</strong> Real-time alerts for suspicious activities (failed logins, data exfiltration)</li>
                    <li><strong>Intrusion Detection:</strong> IDS/IPS systems block unauthorized access attempts</li>
                    <li><strong>Log Aggregation:</strong> All logs centralized in secure SIEM for analysis</li>
                    <li><strong>Incident Response Team:</strong> On-call security team available 24/7 for breaches</li>
                    <li><strong>Breach Response Time:</strong> Critical incidents addressed within 1 hour</li>
                    <li><strong>Notification Timeline:</strong> CCPA §1798.82: Notified within 60 days of breach discovery</li>
                    <li><strong>Post-Incident:</strong> Full forensic audit performed, root cause analysis, preventive measures implemented</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6.6 Third-Party Security Audits</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">✅ External Certifications & Audits</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-indigo-800">
                    <li><strong>SOC 2 Type II:</strong> Annual audit (system, availability, processing integrity, confidentiality, privacy controls)</li>
                    <li><strong>Penetration Testing:</strong> Quarterly third-party penetration tests to identify vulnerabilities</li>
                    <li><strong>Vulnerability Assessment:</strong> Monthly automated scanning for known CVEs and misconfigurations</li>
                    <li><strong>GDPR Data Protection:</strong> Impact assessment (DPIA) for high-risk processing activities</li>
                    <li><strong>Privacy by Design:</strong> Security and privacy reviewed at each development phase</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6.7 Employee Security Training</h3>
                <div className="bg-pink-50 border border-pink-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-pink-900 font-semibold mb-3">👥 Staff Protection Measures</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-pink-800">
                    <li><strong>Background Checks:</strong> All employees undergo background screening</li>
                    <li><strong>Security Training:</strong> Mandatory onboarding security training for all staff</li>
                    <li><strong>Phishing Simulations:</strong> Monthly phishing tests to ensure security awareness</li>
                    <li><strong>Confidentiality Agreements:</strong> All employees sign NDAs and data protection agreements</li>
                    <li><strong>Least Privilege:</strong> Employees given minimum data access necessary for their role</li>
                    <li><strong>Off-boarding:</strong> Immediate access revocation upon termination</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6.8 What Security DOES NOT Cover</h3>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-gray-900 font-semibold mb-3">Limitations & Your Responsibility</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-800">
                    <li><strong>No Absolute Guarantee:</strong> No security system is 100% secure; breaches cannot be completely eliminated</li>
                    <li><strong>Your Password:</strong> You are responsible for keeping your password confidential</li>
                    <li><strong>Device Security:</strong> We cannot protect against malware or compromised devices on your end</li>
                    <li><strong>Public WiFi:</strong> We recommend avoiding public WiFi when accessing sensitive data</li>
                    <li><strong>Account Recovery:</strong> If you lose your password and authentication device, data recovery may require verification</li>
                  </ul>
                </div>
              </section>

              {/* SECTION 7: Your Privacy Rights (CCPA) */}
              <section id="section-7" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200">
                  7. Your Privacy Rights (CCPA) - Comprehensive California Consumer Rights
                </h2>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7.1 Right to Know (CCPA § 1798.100)</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">Your Right to Access Personal Information</p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    You have the right to request what personal information Soma collects, uses, and shares about you. Upon verification, we will provide you with:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-blue-800">
                    <li><strong>Categories of Information:</strong> Data we collect about you</li>
                    <li><strong>Purposes of Collection:</strong> Why we collect each category</li>
                    <li><strong>Sources of Collection:</strong> Where we obtained the data</li>
                    <li><strong>Parties with Whom We Share:</strong> Third parties with access</li>
                    <li><strong>Specific Pieces of Information:</strong> Individual data points (upon request)</li>
                    <li><strong>Disclosure Frequency:</strong> How often we disclose data</li>
                  </ul>
                  <p className="text-xs text-blue-800 mt-3 font-semibold">
                    <strong>Timeline:</strong> Response within 45 days of verification (may extend 45 more days with notice).
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7.2 Right to Delete (CCPA § 1798.105)</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">Your Right to Deletion</p>
                  <p className="text-sm text-green-800 leading-relaxed mb-3">
                    You may request deletion of personal information collected from you. We MUST delete upon verification, except where we need it for:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                    <li><strong>Completing Transactions:</strong> Completing transactions you initiated</li>
                    <li><strong>Providing Services:</strong> Providing Services requested by you</li>
                    <li><strong>Security & Fraud:</strong> Detecting and prosecuting security breaches/fraud</li>
                    <li><strong>Legal Obligations:</strong> Complying with legal obligations (tax, audit trails)</li>
                    <li><strong>Reasonable Internal Uses:</strong> Uses aligned with user expectations</li>
                    <li><strong>Improving Services:</strong> Improving Services or fixing bugs</li>
                    <li><strong>De-identified Data:</strong> Aggregated/anonymized data (no re-identification possible)</li>
                  </ul>
                  <p className="text-xs text-green-800 mt-3 font-semibold">
                    <strong>Timeline:</strong> Deleted within 45 days of verification. You receive confirmation within 15 business days.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7.3 Right to Opt-Out of Sale/Sharing (CCPA § 1798.120)</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">🚫 Right to Opt-Out (Do Not Sell/Share)</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-3">
                    You have the right to opt-out of the "sale" or "sharing" of your personal information:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-yellow-800 mb-4">
                    <li><strong>What Counts as "Sale":</strong> Disclosing information for monetary/valuable consideration</li>
                    <li><strong>What Counts as "Sharing":</strong> Cross-context behavioral advertising (including targeted ads)</li>
                    <li><strong>Soma's Commitment:</strong> We do NOT sell or share your data (No sale commitment fully satisfies this right)</li>
                  </ul>
                  <div className="bg-white p-3 rounded border-l-4 border-yellow-400">
                    <p className="text-xs text-gray-700 font-semibold mb-2">To Exercise Your Right:</p>
                    <p className="text-xs text-gray-700">1. Click "Do Not Sell/Share My Personal Information" link in website footer</p>
                    <p className="text-xs text-gray-700">2. Or email <a href="mailto:privacy@soma.ai" className="text-yellow-600">privacy@soma.ai</a> with subject "Opt-Out Request"</p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7.4 Right to Correct (CCPA § 1798.100 (d))</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">Your Right to Accuracy</p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-3">
                    You have the right to request correction of inaccurate personal information:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                    <li><strong>Self-Correction:</strong> Update name, email, phone, billing address in account settings</li>
                    <li><strong>Request Correction:</strong> Submit correction request to <a href="mailto:privacy@soma.ai" className="text-purple-600">privacy@soma.ai</a></li>
                    <li><strong>Verification Required:</strong> We verify the inaccuracy before correcting</li>
                    <li><strong>Timeline:</strong> Corrected within 45 days of verified request</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7.5 Right to Limit Use & Disclosure (CCPA § 1798.100 (e))</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">Your Right to Limit Data Use</p>
                  <p className="text-sm text-indigo-800 leading-relaxed mb-3">
                    You may request that we limit use of your sensitive personal information to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-indigo-800">
                    <li>Providing Services you requested</li>
                    <li>Maintaining account security</li>
                    <li>Fulfilling other purposes you explicitly authorized</li>
                    <li>Legal compliance</li>
                  </ul>
                  <p className="text-xs text-indigo-800 mt-3">
                    <strong>Current Practice:</strong> Soma ONLY uses data for these purposes—we do NOT use it for:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-xs text-indigo-800">
                    <li>Marketing without explicit consent</li>
                    <li>Behavioral advertising</li>
                    <li>Profiling for non-essential purposes</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7.6 Non-Discrimination (CCPA § 1798.125)</h3>
                <div className="bg-pink-50 border border-pink-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-pink-900 font-semibold mb-3">⚖️ You Cannot Be Punished for Exercising Rights</p>
                  <p className="text-sm text-pink-800 leading-relaxed mb-3">
                    Soma will NOT discriminate against you for exercising CCPA rights:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-pink-800">
                    <li><strong>No Denial of Service:</strong> We will NOT deny you access to Services</li>
                    <li><strong>No Price Discrimination:</strong> We will NOT charge different prices</li>
                    <li><strong>No Quality Reduction:</strong> We will NOT reduce quality of service</li>
                    <li><strong>No Retaliation:</strong> We will NOT retaliate or threaten retaliation</li>
                  </ul>
                  <p className="text-xs text-pink-800 mt-3 italic">
                    <strong>Exception:</strong> Different pricing is allowed if it's materially related to the value of your data (e.g., you opt-out of Analytics → slightly reduced personalization features allowed).
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7.7 CCPA Request Submission Procedures</h3>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-gray-900 font-semibold mb-3">📋 How to Submit a CCPA Request:</p>
                  <div className="space-y-3 text-sm text-gray-800">
                    <div className="border-l-4 border-gray-400 pl-4 bg-white p-3 rounded">
                      <p className="font-semibold">Step 1: Send Request</p>
                      <p className="text-xs">Email <a href="mailto:privacy@soma.ai" className="text-blue-600 hover:underline">privacy@soma.ai</a> with subject line indicating request type</p>
                    </div>
                    <div className="border-l-4 border-gray-400 pl-4 bg-white p-3 rounded">
                      <p className="font-semibold">Step 2: Include Information</p>
                      <p className="text-xs">Provide details to identify you: full name, email, phone number, account ID (if available)</p>
                    </div>
                    <div className="border-l-4 border-gray-400 pl-4 bg-white p-3 rounded">
                      <p className="font-semibold">Step 3: Verification</p>
                      <p className="text-xs">We verify your identity by comparing provided details with account information (no passwords required)</p>
                    </div>
                    <div className="border-l-4 border-gray-400 pl-4 bg-white p-3 rounded">
                      <p className="font-semibold">Step 4: Response</p>
                      <p className="text-xs">We respond within 45 days. For complex requests, we may extend 45 more days (with notice)</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7.8 Authorized Agents & Family Representatives</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">Submitting Requests on Your Behalf</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-blue-800">
                    <li><strong>Authorized Agent:</strong> A business/person authorized by you (power of attorney, agent designation form)</li>
                    <li><strong>Family Member (Deceased):</strong> If person deceased, authorized executor/heir can submit requests</li>
                    <li><strong>Required Documentation:</strong> Agent must provide: (a) written authorization from you, (b) proof of identity, (c) written declaration under penalty of perjury</li>
                    <li><strong>We May Verify:</strong> We may request additional verification before processing agent requests</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7.9 Additional CCPA Protections</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">Additional Consumer Safeguards</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                    <li><strong>No Charge for Requests:</strong> We will NOT charge fees for CCPA requests (except repeated/frivolous requests)</li>
                    <li><strong>Easy Opt-Out Mechanisms:</strong> Website footer contains clickable "Do Not Sell/Share" link</li>
                    <li><strong>Financial Incentives Allowed:</strong> Soma may offer incentives for data collection (CCPA § 1798.100(d)(3))</li>
                    <li><strong>Shine the Light Law:</strong> California residents also have rights under Penal Code § 1798.83</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7.10 Contact Information for CCPA Requests</h3>
                <div className="bg-red-50 border border-red-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-red-800 font-semibold mb-3">📧 Privacy Contact Details:</p>
                  <p className="text-sm text-red-800 mb-2"><strong>Email:</strong> <a href="mailto:privacy@soma.ai" className="text-red-600 hover:underline">privacy@soma.ai</a></p>
                  <p className="text-sm text-red-800 mb-2"><strong>Mailing Address:</strong> Legal Department, Soma Inc., [Address TBD]</p>
                  <p className="text-sm text-red-800"><strong>Response Time:</strong> 45 days standard, up to 90 days with extension notice</p>
                </div>
              </section>

              {/* SECTION 8: Your Privacy Rights (GDPR) */}
              <section id="section-8" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200">
                  8. Your Privacy Rights (GDPR) - European Data Subject Rights
                </h2>

                <p className="text-gray-700 leading-relaxed mb-4">
                  If you are located in the European Union, United Kingdom, EEA, or other GDPR jurisdictions, you have the following rights under GDPR (Regulation (EU) 2016/679):
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8.1 Right of Access (GDPR Article 15)</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">Your Right to Access Your Data</p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    You have the right to access your personal data and receive a copy of information we process about you:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-blue-800">
                    <li>What categories of data we hold</li>
                    <li>Purpose of processing</li>
                    <li>Recipients of data sharing</li>
                    <li>Retention period</li>
                    <li>A copy of your data in accessible format</li>
                  </ul>
                  <p className="text-xs text-blue-800 mt-3 font-semibold">Timeline: 30 days from request (may extend 60 more days with notice)</p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8.2 Right of Rectification (GDPR Article 16)</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You have the right to request correction of inaccurate or incomplete personal data. You can update account information directly or submit correction requests to <a href="mailto:dpo@soma.ai" className="text-blue-600 hover:underline">dpo@soma.ai</a>.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8.3 Right to Erasure / "Right to Be Forgotten" (GDPR Article 17)</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">Your Right to Deletion</p>
                  <p className="text-sm text-green-800 leading-relaxed mb-3">
                    You have the right to request erasure of your personal data when:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-green-800 mb-3">
                    <li>Data is no longer necessary for original purpose</li>
                    <li>You withdraw consent</li>
                    <li>You object and we have no legitimate interest</li>
                    <li>Data processed unlawfully</li>
                    <li>Legal obligation to delete</li>
                  </ul>
                  <p className="text-xs text-green-800 mt-2">
                    <strong>Exceptions:</strong> We may retain data for: legal compliance, contract performance, public interest, legitimate interests, health/safety.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8.4 Right to Restrict Processing (GDPR Article 18)</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You have the right to restrict our processing (pause but not delete) when: data is inaccurate, processing is unlawful, we no longer need it but you need it for legal claim, or you've objected.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8.5 Right to Data Portability (GDPR Article 20)</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">Your Right to Transfer Your Data</p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-3">
                    You have the right to receive your data in a portable format (CSV, JSON) and transmit it to another service:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-purple-800">
                    <li>Data you provided or generated through your use</li>
                    <li>Machine-readable format (structured, standard, commonly used)</li>
                    <li>Directly to another provider without hindrance</li>
                  </ul>
                  <p className="text-xs text-purple-800 mt-2">Process: Email <a href="mailto:dpo@soma.ai" className="text-purple-600">dpo@soma.ai</a> with "Data Portability Request"</p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8.6 Right to Object (GDPR Article 21)</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You have the right to object to processing for: marketing, profiling, legitimate interest purposes. We must stop processing unless we have compelling legitimate interests or legal obligations.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8.7 Rights Related to Automated Decision-Making (GDPR Article 22)</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">Your Rights in Automated Decisions</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-3">
                    You have the right NOT to be subject to automated decision-making (including profiling) unless:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-yellow-800 mb-3">
                    <li>Decision is necessary for contract performance</li>
                    <li>You've given explicit consent</li>
                    <li>Required by EU law</li>
                  </ul>
                  <p className="text-xs text-yellow-800">
                    <strong>Current Practice:</strong> Soma uses automated systems only for personalization (with your consent). You can request human review.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8.8 Submitting GDPR Requests</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">📧 Data Protection Officer Contact</p>
                  <p className="text-sm text-blue-800 mb-2"><strong>Email:</strong> <a href="mailto:dpo@soma.ai" className="text-blue-600 hover:underline">dpo@soma.ai</a></p>
                  <p className="text-sm text-blue-800 mb-2"><strong>Subject:</strong> Include "GDPR" and request type (Access, Erasure, Portability, etc.)</p>
                  <p className="text-sm text-blue-800">Include sufficient information to identify yourself (name, email, user ID)</p>
                  <p className="text-xs text-blue-800 mt-2 font-semibold">Response Time: 30 days standard, up to 60 days for complex requests (with notice)</p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8.9 Right to Lodge a Complaint (GDPR Article 77-78)</h3>
                <div className="bg-red-50 border border-red-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-red-900 font-semibold mb-3">⚖️ Right to Supervisory Authority Complaint</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-3">
                    If you believe your rights have been violated, you have the right to lodge a complaint with your national data protection authority (DPA):
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-red-800">
                    <li>EU residents: Contact your country's DPA (e.g., CNIL for France, ICO for UK)</li>
                    <li>No fee required to lodge complaint</li>
                    <li>You may also pursue legal remedies (Article 79-80)</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8.10 Lawful Basis for Processing (GDPR Article 6)</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">Why We Process Your Data</p>
                  <p className="text-xs text-indigo-800 mb-2"><strong>Article 6(1)(a) - Consent:</strong> Marketing, cookies (opt-in)</p>
                  <p className="text-xs text-indigo-800 mb-2"><strong>Article 6(1)(b) - Contract:</strong> Account management, service delivery</p>
                  <p className="text-xs text-indigo-800 mb-2"><strong>Article 6(1)(c) - Legal Obligation:</strong> Tax, compliance, law enforcement</p>
                  <p className="text-xs text-indigo-800 mb-2"><strong>Article 6(1)(d) - Vital Interests:</strong> Safety, emergency situations</p>
                  <p className="text-xs text-indigo-800 mb-2"><strong>Article 6(1)(e) - Public Task:</strong> Not applicable to Soma</p>
                  <p className="text-xs text-indigo-800"><strong>Article 6(1)(f) - Legitimate Interest:</strong> Analytics, security, fraud prevention</p>
                </div>
              </section>

              {/* SECTION 9: COPPA - Children's Privacy */}
              <section id="section-9" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200">
                  9. COPPA - Children's Privacy Protection (15 U.S.C. § 6501-6506)
                </h2>

                <div className="bg-orange-50 border-l-4 border-orange-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-orange-900 font-bold mb-3">🚫 NO CHILDREN UNDER 13 - STRICT POLICY</p>
                  <p className="text-sm text-orange-800 leading-relaxed mb-3">
                    Soma is NOT designed for children under 13 years of age. We do NOT knowingly collect, use, or disclose personal information from children under 13 without verifiable parental consent as required by COPPA (Children's Online Privacy Protection Act, 15 U.S.C. § 6501-6506).
                  </p>
                  <p className="text-xs text-orange-800 font-semibold">
                    Age Requirement: Users MUST be at least 18 years old (or age of majority in their jurisdiction) to use Soma Services.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9.1 COPPA Compliance Framework</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">Our Children's Privacy Protection Measures:</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-blue-800">
                    <li><strong>Age Gate at Registration:</strong> Users must confirm they are 18+ during account creation (checkbox with legal attestation)</li>
                    <li><strong>Age Verification:</strong> We reserve the right to verify age using government-issued ID if we suspect underage usage</li>
                    <li><strong>No Targeting or Marketing:</strong> We do NOT knowingly direct marketing or advertising to children under 13</li>
                    <li><strong>No Behavioral Tracking:</strong> We do NOT employ behavioral tracking, profiling, or analytics on children's data</li>
                    <li><strong>No Data Collection from Children:</strong> We do NOT knowingly collect personal information from children under 13</li>
                    <li><strong>Immediate Account Termination:</strong> If we discover a child under 13, we immediately terminate the account and delete all associated data within 72 hours (15 U.S.C. § 6502)</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9.2 What Happens If We Discover a Child Account</h3>
                <div className="bg-red-50 border border-red-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-red-900 font-semibold mb-3">Immediate Action Protocol:</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-3">
                    If we become aware that a child under 13 has registered or provided personal information:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-red-800">
                    <li><strong>Step 1:</strong> Immediately disable the account (within 24 hours of discovery)</li>
                    <li><strong>Step 2:</strong> Notify the registered email address (parent/guardian notification)</li>
                    <li><strong>Step 3:</strong> Delete all personal information collected from the child within 72 hours</li>
                    <li><strong>Step 4:</strong> Notify affected parents/guardians with details of information collected and deletion confirmation</li>
                    <li><strong>Step 5:</strong> Review internal processes to prevent future occurrences</li>
                  </ul>
                  <p className="text-xs text-red-800 mt-3 font-semibold">
                    <strong>Legal Basis:</strong> COPPA 15 U.S.C. § 6502(b)(1)(A)(ii) - Parental notification requirement.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9.3 Parental Rights Under COPPA</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">If Your Child Has Used Soma:</p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-3">
                    Parents/guardians have the right to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                    <li><strong>Review Information:</strong> Request to review any personal information collected from your child</li>
                    <li><strong>Request Deletion:</strong> Demand deletion of your child's personal information (we will comply within 72 hours)</li>
                    <li><strong>Refuse Future Collection:</strong> Refuse to permit further collection or use of your child's information</li>
                    <li><strong>Notification Rights:</strong> Receive notice of our information practices concerning children</li>
                  </ul>
                  <p className="text-xs text-purple-800 mt-3">
                    <strong>To Exercise These Rights:</strong> Email <a href="mailto:legal@soma.ai" className="text-purple-600 hover:underline">legal@soma.ai</a> with subject "COPPA Parental Request" and provide proof of parental status.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9.4 Types of Information NOT Collected from Children</h3>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-gray-900 font-semibold mb-3">Prohibited Data Collection from Children:</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-gray-800">
                    <li>Full name, home address, email address</li>
                    <li>Phone number, Social Security number</li>
                    <li>Geolocation data, persistent identifiers (cookies, device IDs)</li>
                    <li>Photos, videos, audio recordings</li>
                    <li>School name, grades, educational records</li>
                    <li>Behavioral or psychological profiles</li>
                    <li>Any other identifier that permits physical or online contact</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9.5 How to Report a COPPA Violation</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">⚠️ Report Child Privacy Violations</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-4">
                    If you believe a child under 13 has created a Soma account, provided personal information, or if we are collecting data from a child, please contact us IMMEDIATELY:
                  </p>
                  <div className="bg-white p-4 rounded border-l-4 border-yellow-400">
                    <p className="text-sm text-gray-800 font-semibold mb-2">📧 Emergency Contact:</p>
                    <p className="text-sm text-gray-800 mb-1"><strong>Email:</strong> <a href="mailto:legal@soma.ai" className="text-yellow-600 hover:underline">legal@soma.ai</a></p>
                    <p className="text-sm text-gray-800 mb-1"><strong>Subject:</strong> "COPPA Violation Report - URGENT"</p>
                    <p className="text-xs text-gray-700 mt-3">Include: Child's name, account username/email, date of birth (if known), and description of concern</p>
                  </div>
                  <p className="text-xs text-yellow-800 mt-3 font-semibold">
                    <strong>Response Time:</strong> We will respond within 24 hours and initiate deletion within 72 hours.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9.6 FTC Complaint & Enforcement</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">Report COPPA Violations to Authorities:</p>
                  <p className="text-sm text-indigo-800 leading-relaxed mb-3">
                    If you believe Soma is violating COPPA, you may also file a complaint with:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-indigo-800">
                    <li><strong>Federal Trade Commission (FTC):</strong> <a href="https://www.ftc.gov/complaint" className="text-indigo-600 hover:underline">www.ftc.gov/complaint</a></li>
                    <li><strong>Phone:</strong> 1-877-FTC-HELP (1-877-382-4357)</li>
                    <li><strong>Address:</strong> Federal Trade Commission, Consumer Response Center, 600 Pennsylvania Avenue NW, Washington, DC 20580</li>
                  </ul>
                  <p className="text-xs text-indigo-800 mt-3">
                    <strong>FTC Enforcement:</strong> COPPA violations can result in civil penalties up to $51,744 per violation (as of 2024, adjusted for inflation under 15 U.S.C. § 6505).
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9.7 School & Educational Institution Notice</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Soma is NOT intended for use in educational settings for children under 13. Schools and educational institutions MUST NOT permit children under 13 to use Soma Services without explicit written authorization and compliance with FERPA (Family Educational Rights and Privacy Act) and COPPA requirements.
                </p>
              </section>

              {/* SECTION 10: Cookies and Tracking Technologies */}
              <section id="section-10" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200 flex items-center gap-3">
                  <Eye className="text-green-600" size={32} />
                  10. Cookies and Tracking Technologies (EU ePrivacy Directive 2002/58/EC)
                </h2>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-blue-900 font-bold mb-3">🍪 COOKIE CONSENT NOTICE</p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    Soma uses cookies and similar tracking technologies to provide, secure, analyze, and improve our Services. By using our Services, you consent to our use of cookies as described in this policy, in accordance with GDPR Article 6(1)(a) and EU ePrivacy Directive 2002/58/EC.
                  </p>
                  <p className="text-xs text-blue-800 font-semibold">
                    You may withdraw consent or manage cookie preferences at any time through your browser settings or our Cookie Preference Center (available in account settings).
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10.1 What Are Cookies and How We Use Them</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Cookies</strong> are small text files (typically 4KB or less) stored on your device (computer, phone, tablet) by your web browser. Cookies help us:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li><strong>Remember You:</strong> Keep you logged in between sessions (authentication cookies)</li>
                  <li><strong>Personalize Experience:</strong> Store your preferences (theme, language, layout settings)</li>
                  <li><strong>Analyze Usage:</strong> Understand how users interact with Soma (analytics cookies)</li>
                  <li><strong>Improve Security:</strong> Detect suspicious activity and prevent fraud (security cookies)</li>
                  <li><strong>Enable Features:</strong> Support core functionality like shopping cart, payment processing</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10.2 Types of Cookies We Use</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-4">Detailed Cookie Classification:</p>
                  
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded border-l-4 border-green-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">1️⃣ Strictly Necessary Cookies (REQUIRED)</p>
                      <p className="text-sm text-gray-800 mb-2">These cookies are essential for the Services to function and cannot be disabled.</p>
                      <ul className="list-disc pl-6 space-y-1 text-xs text-gray-700">
                        <li><strong>Authentication:</strong> Session tokens, login state (expires on logout or 30 days)</li>
                        <li><strong>Security:</strong> CSRF tokens, rate limiting, fraud detection</li>
                        <li><strong>Load Balancing:</strong> Server routing cookies (AWS ALB/ELB)</li>
                        <li><strong>Legal Basis:</strong> GDPR Article 6(1)(b) - Necessary for contract performance</li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-blue-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">2️⃣ Performance & Analytics Cookies (OPTIONAL)</p>
                      <p className="text-sm text-gray-800 mb-2">Help us understand how you use Soma to improve performance and user experience.</p>
                      <ul className="list-disc pl-6 space-y-1 text-xs text-gray-700">
                        <li><strong>Google Analytics:</strong> _ga, _gid, _gat (expires 2 years/24 hours/1 minute)</li>
                        <li><strong>Amplitude:</strong> amplitude_id, amplitude_session (expires 10 years/30 minutes)</li>
                        <li><strong>Data Collected:</strong> Page views, session duration, device type, browser version, referring sites</li>
                        <li><strong>Legal Basis:</strong> GDPR Article 6(1)(a) - Consent (you can opt-out)</li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-purple-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">3️⃣ Functional/Preference Cookies (OPTIONAL)</p>
                      <p className="text-sm text-gray-800 mb-2">Remember your settings and preferences for a better experience.</p>
                      <ul className="list-disc pl-6 space-y-1 text-xs text-gray-700">
                        <li><strong>UI Preferences:</strong> soma_theme, soma_language, soma_layout (expires 1 year)</li>
                        <li><strong>Feature Toggles:</strong> Onboarding completed, tutorial dismissed</li>
                        <li><strong>Data Collected:</strong> Theme choice (light/dark), language (en/es/zh), notification settings</li>
                        <li><strong>Legal Basis:</strong> GDPR Article 6(1)(a) - Consent</li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-red-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">4️⃣ Advertising & Marketing Cookies (NOT USED)</p>
                      <p className="text-sm text-gray-800 mb-2">❌ Soma does NOT use advertising or marketing cookies for tracking, retargeting, or behavioral advertising.</p>
                      <ul className="list-disc pl-6 space-y-1 text-xs text-gray-700">
                        <li><strong>No Third-Party Ad Networks:</strong> No Facebook Pixel, Google Ads, or similar tracking</li>
                        <li><strong>No Cross-Site Tracking:</strong> We do NOT track your activity across other websites</li>
                        <li><strong>No Sale of Data:</strong> We do NOT sell cookie data to advertisers (CCPA compliance)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10.3 Cookie Inventory & Data Collection Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left">Cookie Name</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Purpose</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Type</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Duration</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Third-Party</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2 font-mono text-xs">soma_session</td>
                        <td className="border border-gray-300 px-3 py-2">User authentication</td>
                        <td className="border border-gray-300 px-3 py-2">Essential</td>
                        <td className="border border-gray-300 px-3 py-2">30 days</td>
                        <td className="border border-gray-300 px-3 py-2">No</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2 font-mono text-xs">soma_csrf</td>
                        <td className="border border-gray-300 px-3 py-2">CSRF protection</td>
                        <td className="border border-gray-300 px-3 py-2">Essential</td>
                        <td className="border border-gray-300 px-3 py-2">Session</td>
                        <td className="border border-gray-300 px-3 py-2">No</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2 font-mono text-xs">_ga</td>
                        <td className="border border-gray-300 px-3 py-2">Google Analytics - User ID</td>
                        <td className="border border-gray-300 px-3 py-2">Analytics</td>
                        <td className="border border-gray-300 px-3 py-2">2 years</td>
                        <td className="border border-gray-300 px-3 py-2">Yes (Google)</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2 font-mono text-xs">_gid</td>
                        <td className="border border-gray-300 px-3 py-2">Google Analytics - Session</td>
                        <td className="border border-gray-300 px-3 py-2">Analytics</td>
                        <td className="border border-gray-300 px-3 py-2">24 hours</td>
                        <td className="border border-gray-300 px-3 py-2">Yes (Google)</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2 font-mono text-xs">amplitude_id</td>
                        <td className="border border-gray-300 px-3 py-2">Amplitude - User tracking</td>
                        <td className="border border-gray-300 px-3 py-2">Analytics</td>
                        <td className="border border-gray-300 px-3 py-2">10 years</td>
                        <td className="border border-gray-300 px-3 py-2">Yes (Amplitude)</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2 font-mono text-xs">soma_theme</td>
                        <td className="border border-gray-300 px-3 py-2">UI theme preference</td>
                        <td className="border border-gray-300 px-3 py-2">Functional</td>
                        <td className="border border-gray-300 px-3 py-2">1 year</td>
                        <td className="border border-gray-300 px-3 py-2">No</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10.4 Third-Party Analytics & Tracking Services</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">Third-Party Service Providers:</p>
                  <ul className="list-disc pl-6 space-y-3 text-sm text-yellow-800">
                    <li>
                      <strong>Google Analytics (Google LLC):</strong> Web analytics to understand user behavior, page views, session duration.
                      <br /><span className="text-xs">Privacy Policy: <a href="https://policies.google.com/privacy" className="text-yellow-600 hover:underline">policies.google.com/privacy</a></span>
                      <br /><span className="text-xs">Opt-Out: <a href="https://tools.google.com/dlpage/gaoptout" className="text-yellow-600 hover:underline">Google Analytics Opt-Out Browser Add-On</a></span>
                    </li>
                    <li>
                      <strong>Amplitude (Amplitude Inc.):</strong> Product analytics to track feature usage, user flows, retention metrics.
                      <br /><span className="text-xs">Privacy Policy: <a href="https://amplitude.com/privacy" className="text-yellow-600 hover:underline">amplitude.com/privacy</a></span>
                      <br /><span className="text-xs">Data Processing Addendum (DPA) in place for GDPR compliance</span>
                    </li>
                    <li>
                      <strong>Sentry (Functional Software Inc.):</strong> Error tracking and crash reporting to improve stability.
                      <br /><span className="text-xs">Privacy Policy: <a href="https://sentry.io/privacy/" className="text-yellow-600 hover:underline">sentry.io/privacy</a></span>
                      <br /><span className="text-xs">PII scrubbing enabled, IP anonymization active</span>
                    </li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10.5 How to Control and Delete Cookies</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">Browser-Based Cookie Controls:</p>
                  <p className="text-sm text-purple-800 mb-4">
                    You can control cookies through your browser settings. Note: Disabling essential cookies may prevent core functionality.
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                    <li><strong>Google Chrome:</strong> Settings → Privacy and Security → Cookies and other site data → See all cookies and site data</li>
                    <li><strong>Mozilla Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data → Manage Data</li>
                    <li><strong>Apple Safari:</strong> Preferences → Privacy → Manage Website Data → Remove All</li>
                    <li><strong>Microsoft Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies and site data</li>
                  </ul>
                  <p className="text-xs text-purple-800 mt-4 font-semibold">
                    <strong>Soma Cookie Preference Center:</strong> Manage cookie preferences directly in your Account Settings → Privacy → Cookie Preferences (coming soon).
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10.6 Web Beacons, Pixels, and Other Tracking Technologies</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  In addition to cookies, we may use other tracking technologies:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li><strong>Web Beacons/Pixels:</strong> Small transparent images (1x1 pixel) embedded in emails or web pages to track email opens, page views, and user actions</li>
                  <li><strong>Local Storage:</strong> HTML5 local storage to cache UI state, preferences (similar to cookies but larger capacity)</li>
                  <li><strong>Session Storage:</strong> Temporary storage cleared when browser tab closes (used for form data persistence)</li>
                  <li><strong>Device Fingerprinting:</strong> We do NOT use device fingerprinting or canvas fingerprinting for tracking</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10.7 GDPR & ePrivacy Directive Compliance</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">EU Cookie Compliance:</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-indigo-800">
                    <li><strong>Consent Requirement:</strong> We obtain consent for non-essential cookies before placement (EU ePrivacy Directive 2002/58/EC, Article 5(3))</li>
                    <li><strong>Cookie Banner:</strong> Users receive a cookie consent banner on first visit with clear options to accept/decline</li>
                    <li><strong>Granular Consent:</strong> Users can consent to specific cookie categories (analytics, functional) separately</li>
                    <li><strong>Withdraw Consent:</strong> Users can withdraw consent at any time through browser settings or our Cookie Preference Center</li>
                    <li><strong>Pre-Ticked Boxes Prohibited:</strong> We do NOT use pre-ticked consent boxes (GDPR Article 4(11) - consent must be freely given)</li>
                  </ul>
                  <p className="text-xs text-indigo-800 mt-3">
                    <strong>Legal Basis:</strong> GDPR Article 6(1)(a) for non-essential cookies, Article 6(1)(b) for essential cookies necessary for contract performance.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10.8 Cookie Policy Updates</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may update this Cookie Policy to reflect changes in our cookie usage, new tracking technologies, or legal requirements. We will notify you of material changes by:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>Updating the "Last Updated" date at the top of this Privacy Policy</li>
                  <li>Displaying a prominent notice on our website</li>
                  <li>Sending email notification to registered users (for material changes)</li>
                </ul>
                <p className="text-sm text-gray-700 italic">
                  Continued use of Soma Services after cookie policy changes constitutes acceptance of the new policy.
                </p>
              </section>

              {/* SECTION 11: Third-Party Links */}
              <section id="section-11" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200">
                  11. Third-Party Links and External Services
                </h2>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-yellow-900 font-bold mb-3">⚠️ EXTERNAL LINK DISCLAIMER</p>
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    Soma Services may contain links to third-party websites, applications, or services ("External Links"). Soma is NOT responsible for the privacy practices, content, or security of these external sites. Use external links at your own risk.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11.1 What Are Third-Party Links?</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Third-party links are hyperlinks, integrations, or references to websites, apps, or services NOT owned, controlled, or operated by Soma. Examples include:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li><strong>Social Media Platforms:</strong> Links to Twitter/X, Facebook, LinkedIn, Instagram profiles</li>
                  <li><strong>Content Sources:</strong> Links to news articles, blog posts, research papers</li>
                  <li><strong>Integrations:</strong> OAuth connections to Google, WeChat, GitHub (covered in Section 2.6)</li>
                  <li><strong>Payment Processors:</strong> Stripe payment pages (covered in Section 2.4)</li>
                  <li><strong>User-Generated Content:</strong> URLs posted by users in messages, notes, or shared content</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11.2 No Responsibility or Liability</h3>
                <div className="bg-red-50 border border-red-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-red-900 font-semibold mb-3">❌ Soma is NOT responsible for:</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-red-800">
                    <li><strong>Privacy Practices:</strong> How third-party sites collect, use, store, or share your personal information</li>
                    <li><strong>Content Accuracy:</strong> Misleading, false, offensive, or illegal content on external sites</li>
                    <li><strong>Data Security:</strong> Security breaches, data leaks, or hacking on third-party services</li>
                    <li><strong>Terms of Service:</strong> Contractual obligations, refund policies, or disputes with third parties</li>
                    <li><strong>Malware or Viruses:</strong> Malicious software, phishing attacks, or scams on external sites</li>
                    <li><strong>Financial Loss:</strong> Fraudulent transactions, unauthorized charges, or payment disputes</li>
                    <li><strong>Legal Issues:</strong> Copyright violations, trademark infringement, or illegal activities on third-party platforms</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11.3 Review Third-Party Privacy Policies</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">🔍 Before Sharing Information:</p>
                  <p className="text-sm text-blue-800 mb-3">
                    Before visiting or providing personal information to external websites, we strongly recommend:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-blue-800">
                    <li><strong>Read Privacy Policies:</strong> Review the third-party's privacy policy to understand data collection practices</li>
                    <li><strong>Check Terms of Service:</strong> Understand the legal agreement you're accepting</li>
                    <li><strong>Verify Security:</strong> Ensure the site uses HTTPS encryption (look for padlock icon in browser)</li>
                    <li><strong>Research Reputation:</strong> Search for reviews, complaints, or security incidents related to the site</li>
                    <li><strong>Limit Data Sharing:</strong> Only provide necessary information (avoid sharing SSN, passwords, or sensitive data)</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11.4 No Endorsement of Third-Party Services</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  The presence of third-party links on Soma does NOT constitute:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li><strong>Endorsement:</strong> Soma does NOT endorse, recommend, or guarantee third-party services</li>
                  <li><strong>Affiliation:</strong> Links do NOT imply a partnership, sponsorship, or business relationship</li>
                  <li><strong>Quality Assurance:</strong> We do NOT verify the accuracy, safety, or legality of external content</li>
                  <li><strong>Warranty:</strong> We make NO warranties about third-party sites' functionality, availability, or reliability</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11.5 User-Generated External Links</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">User-Posted Links:</p>
                  <p className="text-sm text-purple-800 mb-3">
                    Users may post external links in messages, notes, or shared content. Soma:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                    <li><strong>No Pre-Moderation:</strong> We do NOT pre-screen or approve user-posted links</li>
                    <li><strong>Reporting Mechanism:</strong> You can report malicious, harmful, or inappropriate links to <a href="mailto:abuse@soma.ai" className="text-purple-600 hover:underline">abuse@soma.ai</a></li>
                    <li><strong>Removal Rights:</strong> We reserve the right to remove links violating our Terms of Service</li>
                    <li><strong>User Responsibility:</strong> Users are solely responsible for links they post and share</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11.6 Reporting Harmful External Links</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you encounter malicious, fraudulent, or illegal external links on Soma, please report them:
                </p>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-5">
                  <p className="text-sm text-gray-900 font-semibold mb-2">📧 Report Links:</p>
                  <p className="text-sm text-gray-800 mb-1"><strong>Email:</strong> <a href="mailto:abuse@soma.ai" className="text-blue-600 hover:underline">abuse@soma.ai</a></p>
                  <p className="text-sm text-gray-800 mb-1"><strong>Subject:</strong> "Malicious Link Report"</p>
                  <p className="text-xs text-gray-700 mt-2">Include: Link URL, location on Soma, description of harm (phishing, malware, scam, etc.)</p>
                </div>
              </section>

              {/* SECTION 12: International Data Transfers */}
              <section id="section-12" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200">
                  12. International Data Transfers (GDPR Chapter V)
                </h2>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-blue-900 font-bold mb-3">🌍 CROSS-BORDER DATA TRANSFER NOTICE</p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    Soma operates globally with servers primarily in the United States. If you are located in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, your personal data may be transferred to, stored, and processed in countries outside your jurisdiction where data protection laws may differ from those in your region.
                  </p>
                  <p className="text-xs text-blue-800 font-semibold">
                    By using Soma Services, you consent to the transfer of your data to the United States and other countries as described in this section.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12.1 Primary Data Storage Locations</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">Server Infrastructure:</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                    <li><strong>United States:</strong> Primary data storage and processing (AWS US-East-1, US-West-2)</li>
                    <li><strong>European Union:</strong> EU users may have data stored in EU data centers (AWS EU-Central-1 Frankfurt) - coming soon</li>
                    <li><strong>Backup Locations:</strong> Encrypted backups stored across multiple AWS regions for disaster recovery</li>
                    <li><strong>CDN (Content Delivery Network):</strong> Cloudflare edge servers worldwide for static content</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12.2 GDPR-Compliant Transfer Mechanisms</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">Lawful Basis for International Transfers (GDPR Articles 44-50):</p>
                  <p className="text-sm text-purple-800 mb-4">
                    For users in the EU/EEA, UK, or Switzerland, we ensure lawful data transfers through:
                  </p>
                  <ul className="list-disc pl-6 space-y-3 text-sm text-purple-800">
                    <li>
                      <strong>Standard Contractual Clauses (SCCs):</strong> We use the European Commission's Standard Contractual Clauses (Decision C(2021)3972 final, adopted June 4, 2021) with third-party data processors. SCCs are pre-approved contract templates that ensure adequate data protection when transferring personal data outside the EEA.
                      <br /><span className="text-xs">Legal Basis: GDPR Article 46(2)(c)</span>
                    </li>
                    <li>
                      <strong>Adequacy Decisions:</strong> We may transfer data to countries with an adequacy decision from the European Commission (e.g., Japan, South Korea, Canada under certain conditions).
                      <br /><span className="text-xs">Legal Basis: GDPR Article 45</span>
                    </li>
                    <li>
                      <strong>Binding Corporate Rules (BCRs):</strong> For intra-company data transfers (if applicable in the future).
                      <br /><span className="text-xs">Legal Basis: GDPR Article 47</span>
                    </li>
                    <li>
                      <strong>Explicit Consent:</strong> For specific data transfers (e.g., user-requested integrations with non-EEA services).
                      <br /><span className="text-xs">Legal Basis: GDPR Article 49(1)(a)</span>
                    </li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12.3 Supplementary Measures (Schrems II Compliance)</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">Additional Safeguards for EEA Data:</p>
                  <p className="text-sm text-yellow-800 mb-3">
                    Following the Schrems II ruling (CJEU C-311/18), we implement supplementary measures to ensure adequate protection:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-yellow-800">
                    <li><strong>Encryption in Transit:</strong> TLS 1.3 encryption for all data transfers</li>
                    <li><strong>Encryption at Rest:</strong> AES-256 encryption for stored data (see Section 6.1)</li>
                    <li><strong>Data Minimization:</strong> Only transfer necessary personal data to third countries</li>
                    <li><strong>Access Controls:</strong> Restrict U.S. government access to data (no backdoors, surveillance transparency)</li>
                    <li><strong>Transfer Impact Assessments (TIAs):</strong> Periodic assessments of legal frameworks in destination countries</li>
                    <li><strong>Contractual Obligations:</strong> Third-party processors contractually bound to refuse unlawful government data requests</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12.4 Privacy Shield Invalidation Notice</h3>
                <div className="bg-red-50 border border-red-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-red-900 font-semibold mb-3">⚠️ EU-U.S. Privacy Shield No Longer Valid</p>
                  <p className="text-sm text-red-800 leading-relaxed">
                    The EU-U.S. Privacy Shield Framework was invalidated by the Court of Justice of the European Union (CJEU) on July 16, 2020 (Schrems II case). Soma does NOT rely on Privacy Shield for international data transfers. We use Standard Contractual Clauses (SCCs) and supplementary measures instead.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12.5 Data Residency Options (Coming Soon)</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We are working to offer data residency options for users who require data to remain in specific geographic regions:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li><strong>EU Data Residency:</strong> Option to store all personal data exclusively in EU data centers (available for Enterprise plans)</li>
                  <li><strong>Swiss Data Residency:</strong> Compliance with Swiss Federal Data Protection Act (FADP)</li>
                  <li><strong>UK Data Residency:</strong> Post-Brexit UK GDPR compliance</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12.6 Third-Party Data Processors with International Transfers</h3>
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full bg-white border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left">Service Provider</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Data Location</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Transfer Mechanism</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">AWS</td>
                        <td className="border border-gray-300 px-3 py-2">US, EU</td>
                        <td className="border border-gray-300 px-3 py-2">SCCs</td>
                        <td className="border border-gray-300 px-3 py-2">Cloud hosting</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2">Google Analytics</td>
                        <td className="border border-gray-300 px-3 py-2">US</td>
                        <td className="border border-gray-300 px-3 py-2">SCCs + Consent</td>
                        <td className="border border-gray-300 px-3 py-2">Analytics</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">Stripe</td>
                        <td className="border border-gray-300 px-3 py-2">US, EU</td>
                        <td className="border border-gray-300 px-3 py-2">SCCs</td>
                        <td className="border border-gray-300 px-3 py-2">Payment processing</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2">Amplitude</td>
                        <td className="border border-gray-300 px-3 py-2">US</td>
                        <td className="border border-gray-300 px-3 py-2">SCCs + Consent</td>
                        <td className="border border-gray-300 px-3 py-2">Product analytics</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12.7 Your Rights Regarding International Transfers</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  EU/EEA users have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li><strong>Object to Transfers:</strong> You may object to the transfer of your data to third countries (GDPR Article 21)</li>
                  <li><strong>Request SCCs:</strong> You may request a copy of the Standard Contractual Clauses we use</li>
                  <li><strong>Withdraw Consent:</strong> If transfers are based on consent, you may withdraw consent at any time</li>
                  <li><strong>Lodge Complaint:</strong> You may file a complaint with your national data protection authority (see Section 8.9)</li>
                </ul>
                <p className="text-sm text-gray-700">
                  To exercise these rights, contact our DPO: <a href="mailto:dpo@soma.ai" className="text-blue-600 hover:underline">dpo@soma.ai</a>
                </p>
              </section>

              {/* SECTION 13: Marketing Communications */}
              <section id="section-13" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200">
                  13. Marketing Communications & Opt-Out Rights (CAN-SPAM Act 15 U.S.C. § 7701)
                </h2>

                <div className="bg-purple-50 border-l-4 border-purple-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-purple-900 font-bold mb-3">📧 EMAIL COMMUNICATION POLICY</p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-3">
                    Soma sends various types of email communications for transactional, legal, and marketing purposes. You have the right to opt-out of marketing emails at any time. We comply with the CAN-SPAM Act (15 U.S.C. § 7701 et seq.) and GDPR Article 21 (Right to Object).
                  </p>
                  <p className="text-xs text-purple-800 font-semibold">
                    Unsubscribe requests are honored within 10 business days per CAN-SPAM requirements.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13.1 Types of Email Communications</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-4">Email Categories:</p>
                  
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded border-l-4 border-green-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">1️⃣ Transactional Emails (CANNOT OPT-OUT)</p>
                      <p className="text-sm text-gray-800 mb-2">Essential service-related communications required for account operation:</p>
                      <ul className="list-disc pl-6 space-y-1 text-xs text-gray-700">
                        <li><strong>Account Management:</strong> Welcome emails, password resets, email verification, account deletion confirmations</li>
                        <li><strong>Billing & Payments:</strong> Purchase receipts, subscription renewals, failed payment notifications, refund confirmations</li>
                        <li><strong>Security Alerts:</strong> Suspicious login attempts, new device logins, password changes, API key access</li>
                        <li><strong>Service Status:</strong> Downtime notifications, maintenance schedules, critical bug fixes</li>
                        <li><strong>Legal Basis:</strong> GDPR Article 6(1)(b) - Necessary for contract performance</li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-blue-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">2️⃣ Marketing Emails (CAN OPT-OUT)</p>
                      <p className="text-sm text-gray-800 mb-2">Promotional and informational communications you can unsubscribe from:</p>
                      <ul className="list-disc pl-6 space-y-1 text-xs text-gray-700">
                        <li><strong>Product Updates:</strong> New features, product announcements, release notes</li>
                        <li><strong>Promotions:</strong> Discounts, special offers, referral bonuses</li>
                        <li><strong>Newsletters:</strong> Monthly product updates, best practices, tips and tricks</li>
                        <li><strong>Event Invitations:</strong> Webinars, conferences, virtual events</li>
                        <li><strong>Surveys:</strong> User feedback requests, satisfaction surveys (optional participation)</li>
                        <li><strong>Legal Basis:</strong> GDPR Article 6(1)(a) - Consent (you can withdraw consent)</li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-yellow-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">3️⃣ Legal & Compliance Emails (CANNOT OPT-OUT)</p>
                      <p className="text-sm text-gray-800 mb-2">Legally required notifications you cannot unsubscribe from:</p>
                      <ul className="list-disc pl-6 space-y-1 text-xs text-gray-700">
                        <li><strong>Policy Changes:</strong> Terms of Service updates, Privacy Policy amendments</li>
                        <li><strong>Data Breach Notifications:</strong> Security incident disclosures (GDPR Article 33-34, state breach laws)</li>
                        <li><strong>CCPA/GDPR Responses:</strong> Confirmations of data requests, deletion notices</li>
                        <li><strong>COPPA Parental Notifications:</strong> Child account discovery alerts</li>
                        <li><strong>Legal Basis:</strong> GDPR Article 6(1)(c) - Legal obligation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13.2 How to Opt-Out of Marketing Emails</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">🚫 Unsubscribe Methods:</p>
                  <p className="text-sm text-yellow-800 mb-4">
                    You have THREE ways to stop receiving marketing emails:
                  </p>
                  <ol className="list-decimal pl-6 space-y-3 text-sm text-yellow-800">
                    <li>
                      <strong>One-Click Unsubscribe Link (Recommended):</strong>
                      <br />Click the "Unsubscribe" link at the bottom of any marketing email. This immediately removes you from future marketing campaigns.
                      <br /><span className="text-xs">CAN-SPAM Compliance: Link must remain functional for 30 days after email sent.</span>
                    </li>
                    <li>
                      <strong>Account Settings:</strong>
                      <br />Log in to Soma → Settings → Notifications → Email Preferences → Uncheck "Marketing Emails"
                      <br /><span className="text-xs">This method allows granular control over specific email types.</span>
                    </li>
                    <li>
                      <strong>Email Request:</strong>
                      <br />Send an email to <a href="mailto:marketing@soma.ai" className="text-yellow-600 hover:underline">marketing@soma.ai</a> with subject "Unsubscribe - Marketing Emails"
                      <br /><span className="text-xs">Include your registered email address in the body.</span>
                    </li>
                  </ol>
                  <p className="text-xs text-yellow-800 mt-4 font-semibold">
                    <strong>Processing Time:</strong> We will honor your opt-out request within 10 business days (CAN-SPAM Act 15 U.S.C. § 7704(a)(4)).
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13.3 CAN-SPAM Act Compliance</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">Our CAN-SPAM Commitments:</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-blue-800">
                    <li><strong>Accurate Header Information:</strong> "From," "To," and routing information accurately identify us</li>
                    <li><strong>Non-Deceptive Subject Lines:</strong> Subject lines reflect the email content</li>
                    <li><strong>Identify as Advertisement:</strong> Marketing emails clearly labeled as promotional content</li>
                    <li><strong>Physical Address:</strong> All emails include our valid physical postal address (see Section 15)</li>
                    <li><strong>Opt-Out Mechanism:</strong> Every marketing email includes a clear and conspicuous unsubscribe link</li>
                    <li><strong>Prompt Opt-Out Processing:</strong> Unsubscribe requests honored within 10 business days</li>
                    <li><strong>Post-Opt-Out Compliance:</strong> We do NOT send marketing emails to unsubscribed users</li>
                  </ul>
                  <p className="text-xs text-blue-800 mt-3">
                    <strong>Penalties for Non-Compliance:</strong> CAN-SPAM violations can result in fines up to $51,744 per email (15 U.S.C. § 7706).
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13.4 Email Frequency & Double Opt-In</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Email Frequency:</strong> Marketing emails are sent no more than once per week unless you explicitly consent to more frequent communications.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Double Opt-In (Where Required):</strong> For certain marketing campaigns, we may use a double opt-in process where you receive a confirmation email to verify your subscription before receiving marketing content.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13.5 SMS & Push Notification Marketing (Future)</h3>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-gray-900 font-semibold mb-3">Mobile Marketing (If Implemented):</p>
                  <p className="text-sm text-gray-800 mb-3">
                    If we implement SMS or push notification marketing in the future, we will:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-800">
                    <li><strong>Explicit Opt-In:</strong> Require explicit consent before sending marketing SMS or push notifications</li>
                    <li><strong>Opt-Out Instructions:</strong> Provide clear instructions to stop receiving messages (e.g., "Reply STOP to unsubscribe")</li>
                    <li><strong>TCPA Compliance:</strong> Comply with Telephone Consumer Protection Act (47 U.S.C. § 227)</li>
                    <li><strong>GDPR Compliance:</strong> Obtain separate consent for push notifications (EU users)</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13.6 Third-Party Marketing (NO DATA SALE)</h3>
                <div className="bg-red-50 border border-red-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-red-900 font-semibold mb-3">❌ WE DO NOT SELL YOUR DATA FOR MARKETING</p>
                  <p className="text-sm text-red-800 leading-relaxed">
                    Soma does NOT sell, rent, or lease your email address or personal information to third-party marketers. You will ONLY receive marketing emails from Soma, not from external companies. This is our commitment under CCPA § 1798.120 and GDPR Article 6.
                  </p>
                </div>
              </section>

              {/* SECTION 14: Do Not Track */}
              <section id="section-14" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200">
                  14. Do Not Track (DNT) & Browser Privacy Signals
                </h2>

                <div className="bg-gray-50 border-l-4 border-gray-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-gray-900 font-bold mb-3">🔒 DO NOT TRACK DISCLOSURE</p>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    Some web browsers include a "Do Not Track" (DNT) feature that signals websites you visit that you do not want your online activity tracked. Currently, there is NO uniform industry standard for how services should respond to DNT signals. Soma does not currently respond to DNT signals, but we provide alternative privacy controls.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.1 What is Do Not Track (DNT)?</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Do Not Track (DNT)</strong> is a browser setting that sends an HTTP header signal (DNT:1) to websites requesting that they do not track your online activity. Major browsers like Chrome, Firefox, Safari, and Edge support DNT.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>How to Enable DNT:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li><strong>Chrome:</strong> Settings → Privacy and Security → Send a "Do Not Track" request</li>
                  <li><strong>Firefox:</strong> Settings → Privacy & Security → Send websites a "Do Not Track" signal</li>
                  <li><strong>Safari:</strong> Preferences → Privacy → Prevent cross-site tracking</li>
                  <li><strong>Edge:</strong> Settings → Privacy, search, and services → Send "Do Not Track" requests</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.2 Why Soma Does Not Respond to DNT (Industry Standard Gap)</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">⚠️ No Industry Consensus:</p>
                  <p className="text-sm text-yellow-800 mb-3">
                    As of 2025, there is NO widely accepted industry standard for interpreting or honoring DNT signals. Key reasons:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-yellow-800">
                    <li><strong>Ambiguous Definition:</strong> No clear consensus on what "tracking" means (first-party vs. third-party, analytics vs. advertising)</li>
                    <li><strong>No Legal Requirement:</strong> U.S. federal law does NOT require websites to honor DNT (unlike GDPR cookie consent)</li>
                    <li><strong>Browser Inconsistency:</strong> Different browsers implement DNT differently (some enable by default, others require opt-in)</li>
                    <li><strong>World Wide Web Consortium (W3C):</strong> The W3C DNT standard was never finalized and is no longer actively maintained</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.3 Alternative Privacy Controls (Better Than DNT)</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">🛡️ More Effective Privacy Options:</p>
                  <p className="text-sm text-green-800 mb-4">
                    Instead of relying on DNT, you have MORE CONTROL through:
                  </p>
                  <ul className="list-disc pl-6 space-y-3 text-sm text-green-800">
                    <li>
                      <strong>Browser Cookie Controls:</strong> Block all third-party cookies, clear cookies regularly (see Section 10.5)
                    </li>
                    <li>
                      <strong>Google Analytics Opt-Out:</strong> Install <a href="https://tools.google.com/dlpage/gaoptout" className="text-green-600 hover:underline">Google Analytics Opt-Out Browser Add-On</a>
                    </li>
                    <li>
                      <strong>Account-Level Tracking Preferences:</strong> Soma Account Settings → Privacy → Disable Analytics (coming soon)
                    </li>
                    <li>
                      <strong>Private Browsing Mode:</strong> Use Incognito (Chrome), Private Browsing (Safari), or Private Window (Firefox)
                    </li>
                    <li>
                      <strong>Ad Blockers:</strong> Browser extensions like uBlock Origin, Privacy Badger, Ghostery
                    </li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.4 Global Privacy Control (GPC) - Future Support</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">🌐 Global Privacy Control (Newer Standard):</p>
                  <p className="text-sm text-blue-800 mb-3">
                    <strong>Global Privacy Control (GPC)</strong> is a newer privacy signal standardized by the California Attorney General under CCPA regulations. GPC allows users to opt-out of data sales and targeted advertising.
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-blue-800">
                    <li><strong>Legal Recognition:</strong> California CCPA regulations (effective January 2023) require businesses to honor GPC signals as valid opt-out requests</li>
                    <li><strong>Browser Support:</strong> Supported by Brave, Firefox, DuckDuckGo, OptMeowt browser extensions</li>
                    <li><strong>Soma's Commitment:</strong> We are evaluating GPC support and will implement it to comply with CCPA requirements</li>
                  </ul>
                  <p className="text-xs text-blue-800 mt-3">
                    <strong>Learn More:</strong> <a href="https://globalprivacycontrol.org" className="text-blue-600 hover:underline">GlobalPrivacyControl.org</a>
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.5 Our Current Tracking Practices</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Regardless of DNT signals, Soma's tracking practices are LIMITED:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li><strong>No Cross-Site Tracking:</strong> We do NOT track your activity across other websites</li>
                  <li><strong>No Third-Party Advertising:</strong> We do NOT use third-party ad networks or retargeting pixels</li>
                  <li><strong>Analytics Only:</strong> We use Google Analytics and Amplitude solely to understand how users interact with Soma (see Section 10.4)</li>
                  <li><strong>Essential Cookies Only:</strong> You can disable non-essential cookies through browser settings (see Section 10.5)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.6 Changes to DNT Policy</h3>
                <p className="text-gray-700 leading-relaxed">
                  If a clear industry standard for DNT emerges or if federal/state laws require DNT compliance, we will update this policy accordingly and notify users of changes (see Section 16).
                </p>
              </section>

              {/* SECTION 15: Contact Information */}
              <section id="section-15" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200 flex items-center gap-3">
                  <Mail className="text-green-600" size={32} />
                  15. Contact Information & Privacy Office
                </h2>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-blue-900 font-bold mb-3">📧 HOW TO REACH OUR PRIVACY TEAM</p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    For questions, concerns, or requests related to this Privacy Policy, your personal data, or to exercise your privacy rights (CCPA, GDPR, COPPA), please contact us using the methods below. We respond to all privacy inquiries within 30 days.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">15.1 Privacy Office & Data Protection Officer</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-4">Contact Methods:</p>
                  
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded border-l-4 border-green-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">📧 General Privacy Inquiries</p>
                      <p className="text-sm text-gray-800 mb-2"><strong>Email:</strong> <a href="mailto:privacy@soma.ai" className="text-green-600 hover:underline">privacy@soma.ai</a></p>
                      <p className="text-xs text-gray-700">For general questions about our privacy practices, data collection, or this Privacy Policy.</p>
                      <p className="text-xs text-gray-700 font-semibold mt-2">Response Time: Within 5 business days</p>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-blue-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">🇪🇺 Data Protection Officer (DPO) - GDPR Requests</p>
                      <p className="text-sm text-gray-800 mb-2"><strong>Email:</strong> <a href="mailto:dpo@soma.ai" className="text-blue-600 hover:underline">dpo@soma.ai</a></p>
                      <p className="text-xs text-gray-700">For EU/EEA users exercising GDPR rights (access, deletion, portability, objection, complaint).</p>
                      <p className="text-xs text-gray-700 font-semibold mt-2">Response Time: Within 30 days (GDPR Article 12.3)</p>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-purple-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">🇺🇸 CCPA Requests (California Residents)</p>
                      <p className="text-sm text-gray-800 mb-2"><strong>Email:</strong> <a href="mailto:privacy@soma.ai" className="text-purple-600 hover:underline">privacy@soma.ai</a></p>
                      <p className="text-sm text-gray-800 mb-2"><strong>Subject Line:</strong> "CCPA Request - [Know/Delete/Opt-Out]"</p>
                      <p className="text-xs text-gray-700">For California residents exercising CCPA rights (right to know, delete, opt-out, correct, limit use).</p>
                      <p className="text-xs text-gray-700 font-semibold mt-2">Response Time: Within 45 days (CCPA § 1798.130(a)(2))</p>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-red-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">👶 COPPA Violations & Child Privacy</p>
                      <p className="text-sm text-gray-800 mb-2"><strong>Email:</strong> <a href="mailto:legal@soma.ai" className="text-red-600 hover:underline">legal@soma.ai</a></p>
                      <p className="text-sm text-gray-800 mb-2"><strong>Subject Line:</strong> "COPPA Violation Report - URGENT"</p>
                      <p className="text-xs text-gray-700">To report suspected child accounts or unauthorized collection from children under 13.</p>
                      <p className="text-xs text-gray-700 font-semibold mt-2">Response Time: Within 24 hours, deletion within 72 hours</p>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-yellow-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">🔒 Security Incidents & Data Breaches</p>
                      <p className="text-sm text-gray-800 mb-2"><strong>Email:</strong> <a href="mailto:security@soma.ai" className="text-yellow-600 hover:underline">security@soma.ai</a></p>
                      <p className="text-xs text-gray-700">To report security vulnerabilities, suspected data breaches, or unauthorized access.</p>
                      <p className="text-xs text-gray-700 font-semibold mt-2">Response Time: Within 24 hours (critical incidents), 72 hours (GDPR breach notification)</p>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-orange-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">📩 Marketing Unsubscribe</p>
                      <p className="text-sm text-gray-800 mb-2"><strong>Email:</strong> <a href="mailto:marketing@soma.ai" className="text-orange-600 hover:underline">marketing@soma.ai</a></p>
                      <p className="text-sm text-gray-800 mb-2"><strong>Subject Line:</strong> "Unsubscribe - Marketing Emails"</p>
                      <p className="text-xs text-gray-700">To opt-out of marketing communications (or use one-click unsubscribe link in emails).</p>
                      <p className="text-xs text-gray-700 font-semibold mt-2">Response Time: Within 10 business days (CAN-SPAM compliance)</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">15.2 Mailing Address (Physical Address)</h3>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-gray-900 font-semibold mb-3">Soma Inc. - Privacy Office</p>
                  <p className="text-sm text-gray-800">123 Market Street, Suite 400</p>
                  <p className="text-sm text-gray-800">San Francisco, CA 94103</p>
                  <p className="text-sm text-gray-800 mt-2">United States</p>
                  <p className="text-xs text-gray-700 mt-3 italic">
                    (For written correspondence, CCPA/GDPR formal requests, legal notices, or if you prefer traditional mail.)
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">15.3 Customer Support (Non-Privacy Questions)</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">General Support Inquiries:</p>
                  <p className="text-sm text-yellow-800 mb-2">For non-privacy related questions (account issues, billing, technical support):</p>
                  <p className="text-sm text-yellow-800"><strong>Email:</strong> <a href="mailto:support@soma.ai" className="text-yellow-600 hover:underline">support@soma.ai</a></p>
                  <p className="text-sm text-yellow-800"><strong>Help Center:</strong> <a href="https://help.soma.ai" className="text-yellow-600 hover:underline">help.soma.ai</a></p>
                  <p className="text-xs text-yellow-800 mt-2">Response Time: Within 24-48 hours</p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">15.4 EU Representative (GDPR Article 27)</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">EU Data Protection Representative (Coming Soon):</p>
                  <p className="text-sm text-purple-800 mb-3">
                    Under GDPR Article 27, companies outside the EU must appoint an EU representative. We are in the process of designating an EU representative for direct communication with EU data protection authorities.
                  </p>
                  <p className="text-xs text-purple-800">
                    Until then, EU users can contact our DPO at <a href="mailto:dpo@soma.ai" className="text-purple-600 hover:underline">dpo@soma.ai</a>
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">15.5 Response Times & SLAs</h3>
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full bg-white border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left">Request Type</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Response Time</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Legal Basis</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">General Privacy Inquiry</td>
                        <td className="border border-gray-300 px-3 py-2">5 business days</td>
                        <td className="border border-gray-300 px-3 py-2">Internal SLA</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2">GDPR Data Request</td>
                        <td className="border border-gray-300 px-3 py-2">30 days (extendable to 60)</td>
                        <td className="border border-gray-300 px-3 py-2">GDPR Article 12.3</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">CCPA Data Request</td>
                        <td className="border border-gray-300 px-3 py-2">45 days (extendable to 90)</td>
                        <td className="border border-gray-300 px-3 py-2">CCPA § 1798.130(a)(2)</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2">COPPA Violation Report</td>
                        <td className="border border-gray-300 px-3 py-2">24 hours response, 72h deletion</td>
                        <td className="border border-gray-300 px-3 py-2">15 U.S.C. § 6502</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">Security Incident</td>
                        <td className="border border-gray-300 px-3 py-2">24 hours (critical)</td>
                        <td className="border border-gray-300 px-3 py-2">Industry best practice</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2">Marketing Unsubscribe</td>
                        <td className="border border-gray-300 px-3 py-2">10 business days</td>
                        <td className="border border-gray-300 px-3 py-2">CAN-SPAM Act § 7704</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SECTION 16: Updates to Policy */}
              <section id="section-16" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200">
                  16. Updates to This Privacy Policy (Change Management)
                </h2>

                <div className="bg-orange-50 border-l-4 border-orange-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-orange-900 font-bold mb-3">🔄 POLICY AMENDMENT NOTICE</p>
                  <p className="text-sm text-orange-800 leading-relaxed mb-3">
                    Soma reserves the right to modify this Privacy Policy at any time to reflect changes in our data practices, legal requirements, technology, or business operations. We will notify you of material changes through multiple channels and provide you with an opportunity to review updated terms before they take effect.
                  </p>
                  <p className="text-xs text-orange-800 font-semibold">
                    Last Updated: {lastUpdated} | Effective Date: {effectiveDate} | Version: 1.0.0
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16.1 When We May Update This Policy</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">Reasons for Privacy Policy Changes:</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-blue-800">
                    <li><strong>New Legal Requirements:</strong> Compliance with new privacy laws (e.g., state privacy laws, GDPR amendments, CCPA regulations)</li>
                    <li><strong>New Features or Services:</strong> Introduction of new product features that involve data collection or processing</li>
                    <li><strong>Data Practice Changes:</strong> Changes to how we collect, use, share, or retain personal information</li>
                    <li><strong>Third-Party Integrations:</strong> Addition of new service providers or data processors</li>
                    <li><strong>Business Changes:</strong> Mergers, acquisitions, corporate restructuring, or ownership changes</li>
                    <li><strong>Security Improvements:</strong> Implementation of new security measures or data protection technologies</li>
                    <li><strong>Clarifications:</strong> Editorial updates to improve clarity, fix typos, or enhance readability (non-material changes)</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16.2 How We Notify You of Changes</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-4">Notification Methods (Material Changes):</p>
                  
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded border-l-4 border-green-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">1️⃣ Email Notification (Primary Method)</p>
                      <p className="text-xs text-gray-700">We will send an email to your registered email address at least 30 days before material changes take effect. Email subject: "Important Privacy Policy Update - Action Required"</p>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-blue-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">2️⃣ In-App Notification Banner</p>
                      <p className="text-xs text-gray-700">A prominent banner will appear at the top of the Soma app/website alerting you to policy updates. This banner remains visible until you acknowledge the changes.</p>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-purple-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">3️⃣ Login Prompt (Material Changes)</p>
                      <p className="text-xs text-gray-700">For material changes affecting your rights or data processing, you may be required to review and accept the updated policy before continuing to use Soma Services.</p>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-yellow-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">4️⃣ Website Posting</p>
                      <p className="text-xs text-gray-700">The updated Privacy Policy will be posted at <a href="https://soma.ai/legal/privacy-policy" className="text-blue-600 hover:underline">soma.ai/legal/privacy-policy</a> with a new "Last Updated" date at the top of the document.</p>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-red-400">
                      <p className="text-sm text-gray-900 font-semibold mb-2">5️⃣ Change Log (Transparency)</p>
                      <p className="text-xs text-gray-700">A detailed change log will be available at the bottom of the Privacy Policy summarizing what sections were modified and why (available upon request).</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16.3 Material vs. Non-Material Changes</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">What Constitutes a "Material Change"?</p>
                  
                  <p className="text-sm text-yellow-800 mb-3"><strong>Material Changes (Require 30-Day Notice):</strong></p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-yellow-800 mb-4">
                    <li>New categories of personal information collected</li>
                    <li>New purposes for data use (e.g., using data for advertising when previously not done)</li>
                    <li>Sharing data with new third parties or for new purposes</li>
                    <li>Changes to data retention periods (shorter or longer)</li>
                    <li>Reduction of user rights or privacy protections</li>
                    <li>Changes to data security practices or breach notification procedures</li>
                  </ul>

                  <p className="text-sm text-yellow-800 mb-3"><strong>Non-Material Changes (No Advance Notice Required):</strong></p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-yellow-800">
                    <li>Typo corrections, grammar fixes, formatting improvements</li>
                    <li>Updated contact information (email, phone, address)</li>
                    <li>Clarifications to existing language without changing substance</li>
                    <li>Addition of new examples or illustrations</li>
                    <li>Updates to legal citations or regulatory references</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16.4 Your Options When Policy Changes</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">If You Disagree with Changes:</p>
                  <p className="text-sm text-purple-800 mb-3">
                    You have THREE options if you do not agree with updated Privacy Policy terms:
                  </p>
                  <ol className="list-decimal pl-6 space-y-3 text-sm text-purple-800">
                    <li>
                      <strong>Object Before Effective Date:</strong>
                      <br />Contact us at <a href="mailto:privacy@soma.ai" className="text-purple-600 hover:underline">privacy@soma.ai</a> within the 30-day notice period to express concerns or objections. We will consider your feedback.
                    </li>
                    <li>
                      <strong>Delete Your Account:</strong>
                      <br />Request account deletion before the new policy takes effect (see Section 7.2 for CCPA deletion, Section 8.3 for GDPR erasure). This preserves your rights under the old policy.
                    </li>
                    <li>
                      <strong>Stop Using Soma:</strong>
                      <br />Discontinue use of Soma Services before the effective date. Your continued use after the effective date constitutes acceptance of the new policy.
                    </li>
                  </ol>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16.5 Continued Use = Acceptance</h3>
                <div className="bg-red-50 border border-red-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-red-900 font-semibold mb-3">⚠️ IMPORTANT LEGAL NOTICE</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-3">
                    By continuing to access or use Soma Services after the effective date of the updated Privacy Policy, you acknowledge that you have read, understood, and agree to be bound by the revised terms. Your continued use constitutes legally binding acceptance of the updated policy.
                  </p>
                  <p className="text-xs text-red-800 font-semibold">
                    If you do NOT agree with the updated Privacy Policy, you MUST immediately stop using Soma Services and request account deletion.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16.6 Version Control & Change History</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We maintain a version history of our Privacy Policy to provide transparency:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li><strong>Current Version:</strong> 1.0.0 - Comprehensive Privacy Policy (Effective: {effectiveDate})</li>
                  <li><strong>Previous Versions:</strong> Available upon request by emailing <a href="mailto:privacy@soma.ai" className="text-blue-600 hover:underline">privacy@soma.ai</a></li>
                  <li><strong>Change Summary:</strong> We will provide a summary of key changes between versions (available in email notifications or on request)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16.7 GDPR Article 13 & 14 Compliance</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">EU Data Protection Law Requirements:</p>
                  <p className="text-sm text-indigo-800 mb-3">
                    Under GDPR Articles 13 and 14, we are required to inform data subjects of any changes to information processing purposes or legal bases. We commit to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-indigo-800">
                    <li><strong>Transparency:</strong> Clearly identify what has changed and why</li>
                    <li><strong>Timely Notice:</strong> Provide reasonable advance notice (minimum 30 days for material changes)</li>
                    <li><strong>Accessible Format:</strong> Make updated policy available in concise, transparent, intelligible language</li>
                    <li><strong>Record Keeping:</strong> Maintain records of policy versions and user consent</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mt-8 border-2 border-gray-300">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">📋 Document Information</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>Document Title:</strong> Soma Privacy Policy - Comprehensive Data Protection & Privacy Notice
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Last Updated:</strong> {lastUpdated}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Effective Date:</strong> {effectiveDate}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Version:</strong> 1.0.0 - Initial Comprehensive Privacy Policy
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Jurisdiction:</strong> United States (with GDPR/CCPA compliance)
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Applicable Laws:</strong> CCPA, GDPR, COPPA, CAN-SPAM, DMCA, state privacy laws
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Document URL:</strong> <a href="https://soma.ai/legal/privacy-policy" className="text-blue-600 hover:underline">soma.ai/legal/privacy-policy</a>
                    </p>
                    <p className="text-xs text-gray-600 italic mt-4">
                      © 2025 Soma Inc. All rights reserved. This Privacy Policy is proprietary and may not be reproduced without permission. For licensing inquiries, contact <a href="mailto:legal@soma.ai" className="text-blue-600 hover:underline">legal@soma.ai</a>.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </motion.div>

        {/* Contact Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200"
        >
          <div className="flex items-start gap-4">
            <div className="bg-white rounded-full p-3 shadow-sm">
              <Mail className="text-green-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Privacy Questions?</h3>
              <p className="text-sm text-gray-700 mb-4">
                Contact our Privacy Office for questions about this Privacy Policy or to exercise your privacy rights.
              </p>
              <div className="text-sm">
                <a href="mailto:privacy@soma.ai" className="text-green-600 hover:underline flex items-center gap-1">
                  privacy@soma.ai <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
