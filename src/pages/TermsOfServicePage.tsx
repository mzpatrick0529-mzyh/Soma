/**
 * 📜 Terms of Service - Soma Inc.
 * Comprehensive U.S. Legal Agreement
 * Last Updated: October 20, 2025
 */

import { motion } from "framer-motion";
import { ArrowLeft, FileText, AlertTriangle, Scale, Download, Mail, ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";

const TermsOfServicePage = () => {
  const navigate = useNavigate();
  const lastUpdated = "October 20, 2025";
  const effectiveDate = "October 20, 2025";

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
              <FileText className="text-indigo-600" size={24} />
              <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
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
            {/* Critical Legal Notice */}
            <div className="bg-red-50 border-l-4 border-red-600 p-5 mb-8 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 mt-0.5 flex-shrink-0" size={24} />
                <div>
                  <p className="text-base text-red-900 font-bold mb-2">⚠️ IMPORTANT LEGAL AGREEMENT</p>
                  <p className="text-sm text-red-800 leading-relaxed">
                    PLEASE READ THESE TERMS OF SERVICE CAREFULLY BEFORE USING SOMA'S SERVICES. BY ACCESSING OR USING OUR SERVICES, YOU AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, YOU MAY NOT ACCESS OR USE THE SERVICES. THIS AGREEMENT CONTAINS AN ARBITRATION PROVISION AND CLASS ACTION WAIVER AS DESCRIBED IN SECTION 14 BELOW.
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
                <p className="text-xs text-gray-500 mt-2">Version 2.0.0</p>
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
                  "1. Agreement to Terms",
                  "2. Changes to Terms",
                  "3. Eligibility and Account Requirements",
                  "4. Description of Services",
                  "5. User Content and Intellectual Property",
                  "6. Prohibited Conduct",
                  "7. Third-Party Services and Data Import",
                  "8. AI-Generated Content Disclaimer",
                  "9. Privacy and Data Protection",
                  "10. Subscription and Payment Terms",
                  "11. Termination and Suspension",
                  "12. Disclaimers of Warranties",
                  "13. Limitation of Liability",
                  "14. Dispute Resolution and Arbitration",
                  "15. Indemnification",
                  "16. Governing Law and Jurisdiction",
                  "17. Miscellaneous Provisions",
                ].map((item, index) => (
                  <a
                    key={index}
                    href={`#section-${index + 1}`}
                    className="block text-sm text-indigo-600 hover:text-indigo-700 hover:underline transition-colors py-1"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="prose prose-gray max-w-none">
              
              {/* SECTION 1: Agreement to Terms */}
              <section id="section-1" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200 flex items-center gap-3">
                  <Scale className="text-indigo-600" size={32} />
                  1. Agreement to Terms
                </h2>
                
                <div className="bg-blue-50 border-l-4 border-blue-600 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-blue-900 font-bold mb-2">IMPORTANT NOTICE - PLEASE READ CAREFULLY</p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    These Terms of Service constitute a legally binding and enforceable contract. By accessing, browsing, or using any portion of the Soma platform, you acknowledge that you have read, understood, and agreed to be bound by all terms and conditions herein. If you do not accept all the terms and conditions of this Agreement, you must not access or use the Services.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">1.1 Parties to This Agreement</h3>
                
                <p className="text-gray-700 leading-relaxed mb-4">
                  These Terms of Service (collectively, the "<strong>Terms</strong>" or "<strong>Agreement</strong>") constitute a legally binding contract between:
                </p>

                <div className="space-y-3 mb-6">
                  <div className="border-l-4 border-indigo-400 pl-4">
                    <p className="text-sm"><span className="font-semibold text-gray-900">Service Provider:</span> <strong>Soma Inc.</strong>, a Delaware corporation with its principal place of business located in the United States ("<strong>Soma</strong>," "<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>")</p>
                  </div>
                  <div className="border-l-4 border-indigo-400 pl-4">
                    <p className="text-sm"><span className="font-semibold text-gray-900">User:</span> Any individual or entity accessing or using the Services ("<strong>you</strong>," "<strong>your</strong>," "<strong>User</strong>," or "<strong>End User</strong>")</p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">1.2 Scope - Services Covered</h3>
                
                <p className="text-gray-700 leading-relaxed mb-4">
                  These Terms govern your access to, use of, and participation in all of Soma's services, platforms, and properties, including but not limited to:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>Website and Web Application:</strong> The website and web application accessible at <a href="https://soma.ai" className="text-indigo-600 hover:underline">https://soma.ai</a> and all subdomains thereof</li>
                  <li><strong>Mobile Applications:</strong> Native applications for iOS and Android platforms, including all updates, upgrades, patches, and versions</li>
                  <li><strong>APIs and Developer Tools:</strong> Application Programming Interfaces (APIs), software development kits (SDKs), and associated documentation provided for integration purposes</li>
                  <li><strong>AI Services:</strong> All artificial intelligence and machine learning services, including but not limited to Hierarchical Memory Modeling (HMM), Persona Creation, and Retrieval-Augmented Generation (RAG)</li>
                  <li><strong>Content and Features:</strong> All content, features, functionalities, and services provided through any of the above (collectively, the "<strong>Services</strong>" or "<strong>Platform</strong>")</li>
                  <li><strong>Related Services:</strong> Customer support, community forums, documentation, and any other ancillary services offered by Soma</li>
                </ul>

                <p className="text-gray-700 leading-relaxed text-sm italic mb-4">
                  The Services may be updated, modified, enhanced, or discontinued at Soma's sole discretion, and these Terms shall apply to all versions unless explicitly superseded by a new agreement.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">1.3 Representations and Warranties of User</h3>
                
                <p className="text-gray-700 leading-relaxed mb-4">
                  By accepting these Terms and using the Services, you represent, warrant, and covenant that:
                </p>

                <div className="space-y-3 mb-6">
                  <div className="border-l-4 border-green-400 pl-4">
                    <p className="text-sm text-gray-700"><strong>Legal Capacity:</strong> You have the full legal capacity and authority to enter into this binding Agreement under the laws of your jurisdiction of domicile. You are not a minor or subject to any legal disability that would prevent your entry into this contract.</p>
                  </div>
                  <div className="border-l-4 border-green-400 pl-4">
                    <p className="text-sm text-gray-700"><strong>Authority to Bind:</strong> If you are representing an organization, business, or entity, you have the express authority to bind such entity to these Terms and are acting within the scope of that authorization.</p>
                  </div>
                  <div className="border-l-4 border-green-400 pl-4">
                    <p className="text-sm text-gray-700"><strong>Compliance with Law:</strong> You will comply with all applicable local, state, national, and international laws, regulations, statutes, ordinances, and rules in your jurisdiction, including without limitation data protection laws, export control regulations, and sanctions laws.</p>
                  </div>
                  <div className="border-l-4 border-green-400 pl-4">
                    <p className="text-sm text-gray-700"><strong>Accuracy of Information:</strong> All information you provide during registration and in your account profile is truthful, accurate, current, complete, and not misleading. You agree to update such information promptly if circumstances change.</p>
                  </div>
                  <div className="border-l-4 border-green-400 pl-4">
                    <p className="text-sm text-gray-700"><strong>No Conflicts:</strong> Entering into this Agreement does not violate any other agreement, obligation, or restriction to which you are subject or bound.</p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">1.4 Binding Nature and Modifications</h3>
                
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Binding Agreement:</strong> These Terms, together with any referenced policies and agreements, constitute the entire, final, and complete agreement between the parties concerning the subject matter hereof and supersede all prior negotiations, representations, understandings, and agreements, whether written or oral. This Agreement shall be binding upon and inure to the benefit of the parties and their respective successors and permitted assigns.
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Exclusive Method of Acceptance:</strong> There are no other terms, conditions, understandings, representations, or warranties, whether express or implied, oral or written, except as set forth herein. Any contrary terms presented by you or any third party are rejected and deemed void unless explicitly accepted in writing by Soma's authorized representative.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">1.5 Incorporation of Policies by Reference</h3>
                
                <p className="text-gray-700 leading-relaxed mb-4">
                  These Terms expressly incorporate by reference the following policies and agreements, each of which is legally binding and enforceable:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li><strong>Privacy Policy:</strong> Comprehensive disclosure of our data collection, use, storage, processing, and protection practices under CCPA, GDPR, COPPA, and other applicable privacy laws. Accessible at the footer of our website.</li>
                  <li><strong>Acceptable Use Policy:</strong> Detailed prohibitions on unlawful, harmful, and abusive content and conduct. Forms an integral part of your contractual obligations.</li>
                  <li><strong>DMCA Copyright Policy:</strong> Procedures for reporting and addressing copyright infringement claims, including notice and counter-notice requirements.</li>
                  <li><strong>Community Guidelines:</strong> Standards for respectful, civil discourse in community features, forums, and user-generated content areas.</li>
                  <li><strong>Data Processing Addendum (DPA):</strong> For users subject to GDPR, CCPA, or similar data protection regulations, the DPA governs data processing relationships.</li>
                </ul>

                <p className="text-gray-700 leading-relaxed text-sm">
                  In the event of any conflict between these Terms and any incorporated policy, the provision that provides greater protection to the User or Soma, as applicable, shall prevail. All policies are accessible on our website or upon request.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">1.6 No Waiver</h3>
                
                <p className="text-gray-700 leading-relaxed">
                  Soma's failure to enforce any provision of these Terms shall not constitute a waiver of such provision or the right to enforce it subsequently. The waiver of any breach of these Terms shall not constitute a waiver of any subsequent or other breach. No waiver shall be valid unless in writing and signed by an authorized representative of Soma.
                </p>
              </section>

              {/* SECTION 2: Changes to Terms */}
              <section id="section-2" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  2. Changes to Terms and Updates
                </h2>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.1 Modification and Amendment Authority</h3>
                
                <p className="text-gray-700 leading-relaxed mb-4">
                  Soma reserves the right, in its sole and absolute discretion, to modify, amend, supplement, revise, or change these Terms of Service, any related policies, or the Services themselves at any time without prior notice or obligation to you. Such changes shall be effective immediately upon posting to the Soma Platform and shall apply to all access and use of the Services after the date of such posting.
                </p>

                <div className="bg-yellow-50 border-l-4 border-yellow-600 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">⚠️ NOTICE OF MATERIAL CHANGES</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-2">
                    Soma will provide notice of <strong>material changes</strong> that adversely affect your rights or obligations through one or more of the following methods. Your failure to receive notice shall not excuse compliance with modified Terms:
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.2 Methods of Notification</h3>

                <div className="space-y-3 mb-6">
                  <div className="border-l-4 border-blue-400 pl-4">
                    <p className="text-sm"><strong>Email Notice:</strong> Notification to the email address registered with your account. You are responsible for maintaining accurate contact information.</p>
                  </div>
                  <div className="border-l-4 border-blue-400 pl-4">
                    <p className="text-sm"><strong>Website Banner/Pop-up:</strong> Prominent notice posted on the Soma website homepage or displayed as a pop-up notification upon login.</p>
                  </div>
                  <div className="border-l-4 border-blue-400 pl-4">
                    <p className="text-sm"><strong>In-App Notification:</strong> Notice displayed within the mobile or web application upon startup or during regular use.</p>
                  </div>
                  <div className="border-l-4 border-blue-400 pl-4">
                    <p className="text-sm"><strong>Push Notification:</strong> Push notification to your registered mobile device(s).</p>
                  </div>
                  <div className="border-l-4 border-blue-400 pl-4">
                    <p className="text-sm"><strong>Forced Re-acceptance:</strong> Requirement to affirmatively accept updated Terms before accessing the Services.</p>
                  </div>
                  <div className="border-l-4 border-blue-400 pl-4">
                    <p className="text-sm"><strong>Version History:</strong> Posting of updated Terms with a clear "Last Updated" date on our website and in-app.</p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.3 Advance Notice Requirement for Material Changes</h3>

                <div className="bg-red-50 border border-red-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-red-900 font-semibold mb-2">30-Day Advance Notice for Material Adverse Changes</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-3">
                    For material changes that <strong>materially adversely affect</strong> your rights or increase your obligations under these Terms (including but not limited to price increases for paid Services, material reduction of features, or changes to data usage), Soma shall provide <strong>no less than thirty (30) calendar days advance notice</strong> before the changes become effective.
                  </p>
                  <p className="text-sm text-red-800">
                    <strong>Examples of Material Adverse Changes:</strong> Price increases for paid Services; material reduction or elimination of features; changes in data retention policies; new payment methods or terms; changes to dispute resolution mechanisms.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.4 Changes Not Requiring Advance Notice</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  Notwithstanding the foregoing, Soma may implement changes immediately without advance notice in the following circumstances:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li><strong>Security-Related Changes:</strong> To address security vulnerabilities, data breaches, or potential harm to users or the platform</li>
                  <li><strong>Legal Compliance:</strong> To comply with new laws, regulations, government requests, or court orders</li>
                  <li><strong>Bug Fixes and Performance:</strong> To fix bugs, improve performance, or optimize functionality without materially limiting features</li>
                  <li><strong>Minor Updates:</strong> Non-material updates, clarifications, or formatting changes that do not affect user rights or obligations</li>
                  <li><strong>Emergency Maintenance:</strong> To maintain platform stability or prevent unauthorized access or fraud</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.5 Binding Effect of Continued Use</h3>

                <div className="bg-indigo-50 border-l-4 border-indigo-600 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-indigo-900 leading-relaxed mb-2">
                    <strong>Your continued access to or use of the Services after any change to these Terms shall constitute your binding acceptance and agreement to be bound by the modified Terms.</strong> This applies regardless of whether you have read the modifications or have been notified.
                  </p>
                  <p className="text-sm text-indigo-800 leading-relaxed">
                    If you do not agree to any modification of these Terms, your sole remedy is to cease using the Services and, if applicable, request account cancellation in accordance with Section 11.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.6 Version Control and Availability</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  Soma maintains version control of these Terms, including:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>Current version number and effective date clearly displayed at the top of this document</li>
                  <li>Version history log showing changes across all versions (available in the footer or upon request)</li>
                  <li>Archive of prior versions for reference (available for 5+ years)</li>
                  <li>Effective dates for each material change</li>
                </ul>

                <p className="text-gray-700 leading-relaxed text-sm">
                  To access version history or request prior versions of these Terms, email <a href="mailto:legal@soma.ai" className="text-indigo-600 hover:underline">legal@soma.ai</a> with the request and the specific version date you wish to review.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">2.7 Dispute Regarding Changes</h3>

                <p className="text-gray-700 leading-relaxed">
                  If you believe that a change to these Terms is unfair, unreasonable, or violates applicable law, you may submit a written objection to <a href="mailto:legal@soma.ai" className="text-indigo-600 hover:underline">legal@soma.ai</a> within fourteen (14) days of notification of the change. Soma will review your objection and respond in writing within thirty (30) days. Unresolved disputes regarding Terms changes shall be subject to the dispute resolution procedures in Section 14.
                </p>
              </section>

              {/* SECTION 3: Eligibility and Account Requirements */}
              <section id="section-3" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  3. Eligibility and Account Requirements
                </h2>

                <p className="text-gray-700 leading-relaxed mb-6">
                  Access to and use of Soma's Services is limited to individuals and entities that satisfy the eligibility criteria set forth in this Section 3. By accessing or using the Services, you represent, warrant, and covenant that you meet all eligibility requirements contained herein and that you will maintain such eligibility for the duration of your use. Any misrepresentation of eligibility status constitutes a material breach of these Terms and shall result in immediate account termination and potential legal action.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3.1 Age Requirements and Contractual Capacity</h3>
                
                <div className="bg-orange-50 border-l-4 border-orange-500 p-6 my-6 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-orange-600 flex-shrink-0 mt-1" size={22} />
                    <div>
                      <h4 className="font-semibold text-orange-900 mb-3">STRICT AGE VERIFICATION REQUIREMENTS</h4>
                      <p className="text-sm text-orange-800 leading-relaxed mb-3">
                        You must be at least <strong>eighteen (18) years of age</strong> or the legal age of majority in your jurisdiction, whichever is greater, to create an account and use Soma's Services. The following jurisdictions impose age requirements exceeding the federal minimum:
                      </p>
                      <div className="bg-white rounded p-4 mb-3">
                        <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                          <li><strong>Alabama & Nebraska:</strong> Minimum age <strong>19 years</strong> (pursuant to state law regarding contract formation)</li>
                          <li><strong>Mississippi:</strong> Minimum age <strong>21 years</strong> (per Miss. Code Ann. § 75-1-201 regarding capacity to contract)</li>
                          <li><strong>Illinois (BIPA Biometric Compliance):</strong> Minimum age <strong>18 years</strong> with verifiable consent; minors under 18 years require documented parental or guardian consent (per 815 ILCS 530/15)</li>
                          <li><strong>Wyoming (Digital Signature):</strong> Minimum age <strong>18 years</strong> for electronic consent formation (Wyo. Stat. § 34-12-105)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3.2 COPPA and Children's Privacy Protection</h3>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-6">
                  <div className="flex gap-3 mb-4">
                    <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={22} />
                    <h4 className="font-semibold text-red-900">Children Under 13 Years of Age - Prohibited</h4>
                  </div>
                  <p className="text-sm text-red-800 leading-relaxed mb-4">
                    Soma strictly complies with the Children's Online Privacy Protection Act of 1998, 15 U.S.C. § 6501 <em>et seq.</em> (COPPA). <strong>Soma's Services are not intended for, and are not knowingly offered to, any child under 13 years of age.</strong> We do not knowingly collect, use, or disclose personal information from children under 13 without verifiable parental consent as required by COPPA.
                  </p>
                  <div className="bg-white rounded p-4 space-y-3">
                    <h5 className="font-semibold text-sm text-gray-900">Our COPPA-Compliance Procedures:</h5>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                      <li><strong>Detection:</strong> If we identify an account created by a child under 13 years of age, we will immediately suspend the account and notify the account creator (or parent/guardian if identifiable) of the violation within 24 hours.</li>
                      <li><strong>Data Deletion:</strong> All personal information associated with the under-13 account, including but not limited to memories, communications, and identifiers, will be permanently deleted within 72 hours, unless retention is required by law.</li>
                      <li><strong>Parental Notification:</strong> If parental contact information is available, Soma will provide written notice of the violation and our remedial actions to the parent or guardian.</li>
                      <li><strong>Legal Cooperation:</strong> Soma reserves the right to preserve, disclose, and report information regarding potential COPPA violations to the Federal Trade Commission (FTC) at privacy.complaints@ftc.gov and to cooperate with law enforcement.</li>
                    </ul>
                  </div>
                  <p className="text-xs text-red-700 font-semibold mt-4 pt-4 border-t border-red-300">
                    ⚠️ PARENTAL RESPONSIBILITY: Parents and guardians are responsible for exercising appropriate control and supervision of children in their care and for ensuring that children do not access Soma without appropriate age verification and parental consent mechanisms.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3.3 Account Registration and Information Requirements</h3>

                <div className="space-y-4 my-6">
                  <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-blue-900 mb-3 text-sm">3.3.1 Mandatory Registration Information</h4>
                    <p className="text-sm text-blue-800 mb-3">To create and maintain an account, you must provide and maintain accurate, current, and complete information:</p>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                      <li><strong>Email Address:</strong> A valid, actively monitored email address that will serve as your primary account identifier and communication method. You must have exclusive control of this email address and must notify Soma within 48 hours if your email is compromised.</li>
                      <li><strong>Legal Full Name:</strong> Your legal name as it appears on government-issued identification, necessary for CCPA consumer rights verification and account recovery procedures.</li>
                      <li><strong>Secure Password:</strong> A password meeting minimum requirements: (a) at least 8 characters; (b) at least one uppercase letter (A-Z); (c) at least one lowercase letter (a-z); (d) at least one numerical digit (0-9); (e) at least one special character (!@#$%^&*).</li>
                      <li><strong>Terms Acceptance:</strong> Affirmative, documented acceptance of these Terms of Service and our Privacy Policy, with a timestamp recorded at the time of acceptance.</li>
                      <li><strong>Age Certification:</strong> For users in jurisdictions with enhanced age requirements, affirmative certification of compliance with jurisdictional age standards.</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-green-900 mb-3 text-sm">3.3.2 Your Account Security Obligations</h4>
                    <p className="text-sm text-green-800 mb-3">You assume full responsibility for all activities occurring under your account:</p>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                      <li>✅ <strong>Confidentiality:</strong> You shall maintain strict confidentiality of your account credentials (password, 2FA authentication codes, recovery tokens) and shall not disclose them to any third party under any circumstances.</li>
                      <li>✅ <strong>Activity Monitoring:</strong> You shall promptly monitor your account for any unauthorized activity and report suspicious access immediately to Soma.</li>
                      <li>✅ <strong>Two-Factor Authentication:</strong> You shall enable and actively maintain two-factor authentication (2FA) via email, SMS, or authenticator application when available, and shall update 2FA methods if primary methods become unavailable.</li>
                      <li>✅ <strong>Breach Notification:</strong> You shall notify Soma within 24 hours of discovering any unauthorized access, suspected account compromise, or suspected violation of password confidentiality by contacting security@soma.ai with details of the suspected breach.</li>
                      <li>✅ <strong>Safe Logout:</strong> You shall properly log out of your account before leaving unattended devices and shall not remain logged in on shared or public computers.</li>
                      <li>❌ <strong>No Account Sharing:</strong> You shall not share, loan, delegate, or permit any other person to use your account credentials or account access.</li>
                      <li>❌ <strong>No Account Transfer:</strong> You shall not transfer, sell, or license your account or account access to any other individual or entity.</li>
                      <li>❌ <strong>No Impersonation:</strong> You shall not use another person's account, access credentials, or account information at any time or for any purpose.</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-red-500 pl-4 bg-red-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-red-900 mb-3 text-sm">3.3.3 Account Information Accuracy and Updates</h4>
                    <p className="text-sm text-red-800 mb-3">
                      You have an affirmative, ongoing obligation to ensure that all account information remains accurate, current, and complete. You must update your account profile information within 30 days of any change. If your email address changes, you must update it in your account settings within 48 hours. Intentionally providing false, fraudulent, misleading, or inaccurate information is a material breach of these Terms and constitutes potential fraud. Consequences may include:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                      <li>Immediate account suspension or termination</li>
                      <li>Permanent ban from Soma services</li>
                      <li>Forfeiture of any credits, subscriptions, or premium features without refund</li>
                      <li>Civil liability for damages resulting from false account information</li>
                      <li>Criminal prosecution if identity fraud or related crimes are committed</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3.4 Geographic Restrictions and Export Compliance</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  Soma's Services are currently offered only to users physically located within the <strong>United States of America</strong>, including the 50 states, the District of Columbia, Puerto Rico, and other U.S. territories. By accessing or using Soma, you represent and warrant that:
                </p>

                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg mb-6">
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li><strong>(a) Physical Location:</strong> You are physically located within the United States at each moment of access and use. Sporadic or temporary travel outside the U.S. does not authorize continued access to Services; you must cease use when outside the U.S. border.</li>
                    <li><strong>(b) No Prohibited Jurisdictions:</strong> You are not located in, nor are you accessing from, any jurisdiction subject to U.S. trade embargoes or sanctions, including (but not limited to): Iran, North Korea, Syria, Cuba, Crimea, or the Donetsk and Luhansk regions of Ukraine.</li>
                    <li><strong>(c) Export Control Compliance:</strong> You will not use Soma in any manner that violates the Export Administration Regulations (EAR) codified at 15 C.F.R. Parts 730-774 or the International Traffic in Arms Regulations (ITAR) codified at 22 C.F.R. Parts 120-130.</li>
                    <li><strong>(d) No Sanctions List Parties:</strong> You are not a party to any U.S. governmental list of sanctioned parties, including (but not limited to): the Office of Foreign Assets Control (OFAC) Specially Designated Nationals List (SDN), the Entity List, the Denied Persons List, or similar lists maintained by other U.S. agencies.</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3.5 One Account Per Individual - Prohibition of Account Multiplication</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  Each user may create and maintain only <strong>one</strong> active account on Soma at any point in time. This one-account-per-person policy exists to:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>Prevent account duplication and fraud detection evasion</li>
                  <li>Ensure accurate user reporting and compliance metrics</li>
                  <li>Maintain the integrity and trust of the Soma community</li>
                  <li>Prevent circumvention of account suspensions, bans, or usage limitations</li>
                  <li>Ensure fair resource allocation and prevent system abuse</li>
                </ul>

                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6">
                  <h4 className="font-semibold text-yellow-900 mb-3">3.5.1 Prohibited Activities</h4>
                  <p className="text-sm text-yellow-800 mb-4">Creating, maintaining, or using multiple accounts is strictly prohibited, including but not limited to:</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                    <li>Creating secondary accounts to circumvent an account suspension or ban</li>
                    <li>Creating accounts under false names or identities to conceal your actual identity</li>
                    <li>Creating duplicate accounts to evade usage restrictions, rate limits, or content policies</li>
                    <li>Creating accounts with different email addresses for the same individual</li>
                    <li>Registering family members' accounts when you control the account activity, credentials, or access</li>
                    <li>Operating accounts on behalf of business entities while individually registered</li>
                  </ul>

                  <h4 className="font-semibold text-yellow-900 mb-3 mt-6">3.5.2 Consequences of Multiple Accounts</h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    Soma reserves the right, at its sole discretion, to investigate suspected account multiplication. Upon confirmation of multiple accounts by the same individual:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                    <li><strong>All accounts will be immediately terminated</strong> without notice and without refund</li>
                    <li><strong>All associated data will be permanently deleted</strong> from Soma servers</li>
                    <li><strong>The individual will be permanently banned</strong> from creating new Soma accounts</li>
                    <li><strong>The email address and associated identifiers</strong> will be blacklisted from future registration</li>
                    <li><strong>Payment methods</strong> and device identifiers may be flagged and blocked from future transactions</li>
                    <li><strong>Legal action</strong> may be pursued if fraud or intentional evasion of suspensions is determined</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">3.6 Right to Refuse Service and Account Eligibility Review</h3>

                <p className="text-gray-700 leading-relaxed">
                  Soma reserves the unconditional right to refuse service, deny account creation, or terminate existing accounts at any time without cause and without liability, in Soma's sole and absolute discretion. Soma may decline to provide Services to any individual or entity that Soma reasonably believes: (a) presents a fraud risk or reputational risk; (b) has engaged in prohibited activities; (c) has violated these Terms or other Soma policies; (d) poses a security or legal liability to Soma or other users; or (e) for any reason whatsoever. This right is not limited to individuals with prior violations and may be exercised for any reason. No prior notice is required, and Soma is under no obligation to explain its decision.
                </p>
              </section>

              {/* SECTION 4: Description of Services */}
              <section id="section-4" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  4. Description of Services
                </h2>

                <p className="text-gray-700 leading-relaxed mb-6">
                  Soma is an <strong>AI-native personal memory system</strong> designed to create a digital representation of your personality, memories, and communication patterns through advanced artificial intelligence and machine learning technologies.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Core Features</h3>

                <div className="space-y-4 my-6">
                  <div className="bg-white border border-indigo-200 rounded-lg p-5">
                    <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="text-indigo-600" size={20} />
                      Hierarchical Memory Modeling (HMM)
                    </h4>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                      <li><strong>Layer 0 (L0):</strong> Storage of raw memories from imported data sources (Google, WeChat, Instagram, manual uploads)</li>
                      <li><strong>Layer 1 (L1):</strong> Automatic clustering and topic extraction using HDBSCAN algorithms</li>
                      <li><strong>Layer 2 (L2):</strong> Biographical synthesis and personality profiling</li>
                    </ul>
                  </div>

                  <div className="bg-white border border-purple-200 rounded-lg p-5">
                    <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="text-purple-600" size={20} />
                      AI Persona Creation
                    </h4>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                      <li>Training of user-specific AI models to simulate your communication style, decision-making patterns, and personality traits</li>
                      <li>Generation of responses that mimic your language patterns, vocabulary, and tone</li>
                      <li>Continuous improvement through Reinforcement Learning from Human Feedback (RLHF)</li>
                    </ul>
                  </div>

                  <div className="bg-white border border-green-200 rounded-lg p-5">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="text-green-600" size={20} />
                      Memory Import and Integration
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">Supported data sources include:</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                      <li>Google Takeout (Gmail, Calendar, Photos, Search History, YouTube, Maps)</li>
                      <li>WeChat (requires manual export and user-provided decryption key)</li>
                      <li>Instagram (posts, stories, direct messages)</li>
                      <li>Manual file uploads (documents, photos, videos, audio)</li>
                    </ul>
                  </div>

                  <div className="bg-white border border-blue-200 rounded-lg p-5">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="text-blue-600" size={20} />
                      Retrieval-Augmented Generation (RAG)
                    </h4>
                    <p className="text-sm text-gray-700">
                      Context-aware AI responses powered by semantic search across your memory database, ensuring accurate and personally relevant outputs.
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4.2 Beta Status and Developmental Nature of Services</h3>
                
                <div className="bg-orange-50 border-l-4 border-orange-500 p-6 my-6 rounded-r-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="text-orange-600 flex-shrink-0 mt-1" size={22} />
                    <div>
                      <p className="text-base font-bold text-orange-900">⚠️ CRITICAL: BETA VERSION - NOT PRODUCTION-READY</p>
                    </div>
                  </div>

                  <p className="text-sm text-orange-800 leading-relaxed mb-4">
                    <strong>Soma is currently in active BETA testing</strong> and is offered on an experimental, developmental basis. You acknowledge that the Services are not production-ready, may contain significant defects, and are not suitable for critical or mission-critical applications. By accessing Soma during this BETA period, you expressly assume all risks associated with the use of developmental software.
                  </p>

                  <div className="bg-white rounded p-4 mb-4">
                    <h5 className="font-semibold text-sm text-gray-900 mb-3">Specific Beta Limitations and Risks:</h5>
                    <ul className="space-y-2 text-sm text-orange-800">
                      <li>🔴 <strong>Incomplete Features:</strong> Features may be incomplete, partially functional, unstable, or subject to discontinuation or radical change at any time without advance notice</li>
                      <li>🔴 <strong>Service Availability:</strong> Service interruptions, system downtime, and unavailability may occur with minimal warning or notification. We do not guarantee uptime or service continuity during BETA</li>
                      <li>🔴 <strong>Data Integrity Risks:</strong> Data loss, corruption, or unrecoverable deletion may occur. Bugs may cause permanent data damage. Backup failures may prevent recovery</li>
                      <li>🔴 <strong>AI Quality Disclaimers:</strong> AI-generated content (responses, summaries, inferences) may contain factual errors, inaccuracies, biased outputs, offensive content, or hallucinated information</li>
                      <li>🔴 <strong>Security Vulnerabilities:</strong> BETA software may contain unpatched security vulnerabilities. Data breaches or unauthorized access are possible</li>
                      <li>🔴 <strong>Performance Issues:</strong> System performance may be unreliable, with slow response times, timeouts, or crashed processes</li>
                      <li>🔴 <strong>API Instability:</strong> API endpoints, authentication mechanisms, and data formats may change without backward compatibility</li>
                      <li>🔴 <strong>Support Limitations:</strong> We provide limited support during BETA. Issues may not be resolved, and workarounds may not be available</li>
                      <li>🔴 <strong>Beta Access Revocation:</strong> Access to BETA Services may be revoked at any time, for any reason, without notice or liability. Your account may be deleted without recovery opportunity</li>
                    </ul>
                  </div>

                  <p className="text-xs text-orange-700 font-semibold border-t border-orange-300 pt-3">
                    CRITICAL RECOMMENDATION: Do NOT store critical, irreplaceable, or sensitive data in Soma during BETA. Maintain independent backups of all data. Do NOT rely on Soma for production use cases. Use at your own risk.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4.3 Detailed Service Components</h3>

                <div className="space-y-4 my-6">
                  <div className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-indigo-900 mb-2 text-sm">4.3.1 Data Import and Integration Module</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Soma provides secure mechanisms to import personal data from authorized third-party platforms:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                      <li><strong>Supported Sources:</strong> Google Takeout, WeChat message exports, Instagram data downloads, manual file uploads</li>
                      <li><strong>OAuth Authorization:</strong> Third-party imports require explicit user authorization via OAuth 2.0 or equivalent secure authentication protocols</li>
                      <li><strong>Data Validation:</strong> Imported data is validated for format, integrity, and compliance with privacy policies before ingestion</li>
                      <li><strong>Limitations:</strong> Some data formats or historical data may not be fully supported; Soma is not responsible for incomplete or partial imports</li>
                      <li><strong>Third-Party Compliance:</strong> Users are responsible for ensuring imports comply with third-party platform Terms of Service and privacy policies</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-purple-900 mb-2 text-sm">4.3.2 Hierarchical Memory Modeling (HMM)</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Soma's proprietary memory architecture processes your data through multiple abstraction layers:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                      <li><strong>Layer 0 (Raw Storage):</strong> Direct storage of imported source data in encrypted databases; original data remains queryable and unchanging</li>
                      <li><strong>Layer 1 (Topic Clustering):</strong> Unsupervised machine learning clustering using HDBSCAN and similar algorithms to identify thematic groups and discussion topics</li>
                      <li><strong>Layer 2 (Biographical Synthesis):</strong> AI-powered extraction of biographical facts, personality traits, communication patterns, and significant life events; degree of inference and interpretation may vary</li>
                      <li><strong>Advanced Features:</strong> Future layers may include relationship graphs, emotional trajectory analysis, pattern prediction; these are experimental and subject to change</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-blue-900 mb-2 text-sm">4.3.3 AI Persona Generation and Chat Interface</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Soma generates conversational AI personas trained on your personal communication data:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                      <li><strong>Persona Training:</strong> AI models are fine-tuned using your User Content to emulate your communication style, vocabulary, personality traits, and response patterns</li>
                      <li><strong>Chat Capabilities:</strong> Conversational interface allows you to have natural-language conversations with your AI persona</li>
                      <li><strong>Accuracy Disclaimer:</strong> AI responses are generated probabilistically and may not accurately reflect your actual thoughts, opinions, or responses; responses should not be treated as authoritative or infallible</li>
                      <li><strong>Sensitive Topics:</strong> For medical, legal, financial, or mental health matters, AI persona responses are for informational purposes only and should not replace professional consultation</li>
                      <li><strong>Bias and Hallucination Risks:</strong> AI models may exhibit biases present in training data or generate false information that sounds plausible</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-cyan-500 bg-cyan-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-cyan-900 mb-2 text-sm">4.3.4 Retrieval-Augmented Generation (RAG)</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Context-aware AI responses powered by semantic search and relevance ranking across your memory database:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                      <li><strong>Semantic Search:</strong> Advanced vector embeddings enable searching for memories by meaning and context, not just keyword matching</li>
                      <li><strong>Relevance Ranking:</strong> Retrieved memories are ranked by semantic relevance and recency to provide most pertinent context to AI responses</li>
                      <li><strong>Context Window Limitations:</strong> Due to computational constraints, only a limited number of most-relevant memories are included in each query context; comprehensive analysis across all data may not be possible</li>
                      <li><strong>Response Quality Variation:</strong> Response quality depends on data quality, completeness, and coherence of your memory database</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-emerald-900 mb-2 text-sm">4.3.5 Data Visualization and Analytics</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Soma provides dashboards, charts, and analytical views of your memory patterns:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                      <li><strong>Visualization Scope:</strong> Analytics cover communication frequency, topic distribution, sentiment trends, relationship patterns, and temporal activity</li>
                      <li><strong>Interpretive Guidance:</strong> Insights are generated algorithmically and may not reflect complete or accurate interpretation of your data</li>
                      <li><strong>Experimental Features:</strong> Certain analytics features are experimental and may provide unreliable or inaccurate information</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4.4 Limitations and Modifications to Services</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Soma reserves the right, at its sole and absolute discretion, to modify, suspend, discontinue, or fundamentally alter any aspect of the Services at any time, with or without advance notice or liability.</strong> Modifications include:
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✎ Adding, removing, or modifying features, functionalities, or service capabilities</li>
                    <li>✎ Changing pricing, pricing structures, billing methods, or subscription tiers for premium features</li>
                    <li>✎ Implementing usage quotas, rate limits, or resource allocation restrictions</li>
                    <li>✎ Discontinuing support for specific data sources, platforms, APIs, or integrations</li>
                    <li>✎ Updating, retraining, or replacing AI models, algorithms, or machine learning systems</li>
                    <li>✎ Changing data retention policies, deletion procedures, or archival mechanisms</li>
                    <li>✎ Modifying API specifications, authentication mechanisms, or technical interfaces</li>
                    <li>✎ Implementing new technical requirements, browser compatibility needs, or operating system dependencies</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
                  <p className="text-sm font-semibold text-yellow-900 mb-2">LIABILITY LIMITATION:</p>
                  <p className="text-sm text-yellow-800">
                    Soma is NOT liable for any loss, damage, service interruption, data loss, or adverse effects resulting from modifications, suspensions, or discontinuations of Services, except as specifically required by applicable law. Your exclusive remedy is cessation of use and account termination.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">4.5 No Guarantee of Continuous Operation</h3>

                <p className="text-gray-700 leading-relaxed">
                  During the BETA period and beyond, Soma does not guarantee: (a) continuous, uninterrupted access to the Services; (b) that all features will remain available; (c) that Services will meet your specific needs or expectations; (d) specific uptime percentages or availability windows; or (e) that errors or bugs will be promptly remedied. You assume all risks related to accessing and using the Services.
                </p>
              </section>

              {/* SECTION 5: User Content and Intellectual Property */}
              <section id="section-5" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  5. User Content and Intellectual Property
                </h2>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.1 User Ownership of User Content</h3>

                <div className="bg-green-50 border-l-4 border-green-600 p-6 my-6 rounded-r-lg">
                  <h4 className="font-semibold text-green-900 mb-3">✅ YOU RETAIN ALL OWNERSHIP RIGHTS</h4>
                  <p className="text-sm text-green-800 leading-relaxed mb-3">
                    <strong>Soma does not claim ownership of any User Content.</strong> You retain all ownership, intellectual property, and other rights to all content you upload, import, create, or submit through the Services, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                    <li>Imported data from third-party platforms (Google, WeChat, Instagram, etc.)</li>
                    <li>Manually uploaded files, documents, photos, or other materials</li>
                    <li>Chat messages, conversations, and communications created within Soma</li>
                    <li>Annotations, tags, and metadata you provide</li>
                    <li>Feedback, suggestions, and reports you submit</li>
                    <li>Any other content or information associated with your account</li>
                  </ul>
                  <p className="text-xs text-green-700 font-semibold mt-4 pt-4 border-t border-green-300">
                    This ownership right is perpetual, non-revocable, and independent of Soma's license to use the content as described herein.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.2 License Grant to Soma - Limited Scope</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>To provide the Services and perform our obligations, you grant Soma a limited, non-exclusive, revocable, non-transferable, non-sublicensable, worldwide license to your User Content.</strong> This license is limited specifically to:
                </p>

                <div className="space-y-4 my-6">
                  <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-blue-900 mb-2 text-sm">5.2.1 Permitted Uses</h4>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                      <li><strong>Processing and Storage:</strong> To process, analyze, store, and maintain your User Content on our secure servers</li>
                      <li><strong>Derivative Works for AI Training:</strong> To create derivative works including embeddings, vector representations, semantic clusters, topic summaries, and other machine-readable transformations necessary for providing the Services</li>
                      <li><strong>Model Training:</strong> To train, fine-tune, and optimize AI models specific to YOUR account that learn your communication style, personality patterns, and biographical information</li>
                      <li><strong>Service Delivery:</strong> To display, render, and present your User Content back to you through the Services interface and chatbot</li>
                      <li><strong>Technical Improvement:</strong> To perform technical maintenance, debugging, and optimization of your account and the Services (limited to the extent necessary)</li>
                      <li><strong>Legal Compliance:</strong> To comply with applicable laws, court orders, government requests, and our legal obligations</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-red-900 mb-2 text-sm">5.2.2 Explicitly Prohibited Uses - Non-Waivable</h4>
                    <p className="text-sm text-red-800 mb-3"><strong>THE FOLLOWING USES ARE PERMANENTLY PROHIBITED AND NON-NEGOTIABLE:</strong></p>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-red-800">
                      <li>❌ <strong>NO SALE TO THIRD PARTIES:</strong> Soma will NEVER sell, license, rent, or otherwise monetize your User Content with any third party, including advertisers, data brokers, or other entities</li>
                      <li>❌ <strong>NO PUBLIC DISCLOSURE:</strong> Soma will NEVER publicly display, broadcast, publish, or otherwise disclose your User Content to any person or entity outside of your account</li>
                      <li>❌ <strong>NO SHARING WITH OTHER USERS:</strong> Your memories, imported data, and User Content remain strictly private and will NEVER be shared with, displayed to, or accessed by other Soma users (unless you explicitly grant permission)</li>
                      <li>❌ <strong>NO SHARED MODEL TRAINING:</strong> Soma will NOT use your User Content to train shared, general-purpose AI models used by other users or the public without your explicit prior written opt-in consent via explicit setting in your account</li>
                      <li>❌ <strong>NO THIRD-PARTY ACCESS:</strong> Soma will NOT grant third parties access to your User Content unless required by law with a valid court order or legal process, in which case we will provide advance notice (where legally permissible)</li>
                      <li>❌ <strong>NO MARKETING USE:</strong> Soma will NOT use your User Content for marketing, advertising, promotional, or case study purposes without your explicit written consent</li>
                      <li>❌ <strong>NO AGGREGATION WITH OTHER DATA:</strong> Soma will NOT combine your User Content with data from other users in ways that could re-identify you or allow inference about your private information</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.3 License Termination and Data Deletion Procedures</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  The license granted to Soma terminates, and Soma's right to use your User Content ceases, under the following circumstances:
                </p>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">5.3.1 User-Initiated Deletion</h4>
                      <p className="text-sm text-gray-700">
                        When you delete specific User Content items from your account via the Soma interface, the license terminates for those items. Deleted content is removed from active systems within 24 hours.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">5.3.2 Full Account Termination Request</h4>
                      <p className="text-sm text-gray-700">
                        When you permanently terminate your account and request complete data deletion, ALL User Content associated with your account is deleted. The license terminates retroactively as of the termination date.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">5.3.3 Account Termination by Soma</h4>
                      <p className="text-sm text-gray-700">
                        When Soma terminates your account for violation of these Terms, material breach, or violation of law, Soma may retain User Content for purposes of legal compliance, dispute resolution, and enforcement of these Terms, but the general license terminates.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-orange-900 mb-3">Data Deletion Timeline and Procedures</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li><strong>Immediate Removal (24 hours):</strong> Deleted content is removed from active/production systems within 24 hours</li>
                    <li><strong>Backup Deletion (90 days):</strong> Deleted content is removed from backup, archival, and redundant systems within 90 days</li>
                    <li><strong>ML Model Deletion:</strong> Account-specific trained AI models are deleted within 7 days; trained model weights cannot be recovered or re-used</li>
                    <li><strong>Exception for Legal Holds:</strong> If Soma is subject to a legal hold, court order, or government request, deletion may be delayed or preserved as required by law</li>
                    <li><strong>Anonymization Option:</strong> If you request anonymization instead of deletion, identifiers are removed and data is de-identified to prevent re-identification</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.4 Your Representations and Warranties Regarding User Content</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>By uploading, importing, or otherwise providing User Content to Soma, you make the following representations, warranties, and covenants:</strong>
                </p>

                <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-4">
                  <div className="border-l-4 border-green-600 pl-4">
                    <h5 className="font-semibold text-gray-900 mb-1 text-sm">5.4.1 Ownership and Authority</h5>
                    <p className="text-sm text-gray-700">
                      You own or have obtained all necessary rights, licenses, and permissions to upload, import, and license the User Content to Soma. You have the full authority and legal right to enter into this license agreement regarding the User Content.
                    </p>
                  </div>

                  <div className="border-l-4 border-green-600 pl-4">
                    <h5 className="font-semibold text-gray-900 mb-1 text-sm">5.4.2 No Infringement</h5>
                    <p className="text-sm text-gray-700">
                      Your User Content does not infringe, dilute, violate, or misappropriate any third-party intellectual property rights, including copyrights, patents, trademarks, trade secrets, or moral rights. The User Content does not contain any protected material without authorization.
                    </p>
                  </div>

                  <div className="border-l-4 border-green-600 pl-4">
                    <h5 className="font-semibold text-gray-900 mb-1 text-sm">5.4.3 Privacy and Consent</h5>
                    <p className="text-sm text-gray-700">
                      For any User Content involving other individuals (messages, photos, personal information, etc.), you have obtained necessary consents, permissions, and authorizations from all individuals depicted or identified. You have the right to provide this content to Soma.
                    </p>
                  </div>

                  <div className="border-l-4 border-green-600 pl-4">
                    <h5 className="font-semibold text-gray-900 mb-1 text-sm">5.4.4 Legality</h5>
                    <p className="text-sm text-gray-700">
                      Your User Content complies with all applicable laws, regulations, and court orders. It does not contain illegal material, does not facilitate illegal activities, and does not violate any legal restrictions or prohibitions.
                    </p>
                  </div>

                  <div className="border-l-4 border-green-600 pl-4">
                    <h5 className="font-semibold text-gray-900 mb-1 text-sm">5.4.5 Accuracy</h5>
                    <p className="text-sm text-gray-700">
                      To the extent of your knowledge, the User Content is accurate, truthful, and not designed to deceive or mislead. Any factually inaccurate content is clearly identified as such.
                    </p>
                  </div>

                  <div className="border-l-4 border-red-600 pl-4">
                    <h5 className="font-semibold text-gray-900 mb-1 text-sm">5.4.6 Indemnification</h5>
                    <p className="text-sm text-gray-700">
                      <strong>You agree to indemnify, defend, and hold harmless Soma from any claims, damages, losses, or expenses (including attorneys' fees) arising from or related to breach of these warranties, including claims of infringement, privacy violations, or illegality.</strong>
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.5 Third-Party Platform Compliance and Responsibility</h3>

                <div className="bg-red-50 border-l-4 border-red-500 p-6 my-6 rounded-r-lg">
                  <p className="text-sm text-red-900 font-semibold mb-3">⚠️ CRITICAL: YOU BEAR FULL RESPONSIBILITY FOR THIRD-PARTY COMPLIANCE</p>
                  
                  <p className="text-sm text-red-800 leading-relaxed mb-4">
                    When you import or upload data from third-party platforms (including but not limited to Google, WeChat, Instagram, Gmail, Apple, Microsoft, Facebook, LinkedIn, Twitter/X), <strong>you are solely responsible for ensuring compliance with:</strong>
                  </p>

                  <ul className="list-disc pl-6 space-y-2 text-sm text-red-800 mb-4">
                    <li>Those platforms' Terms of Service and acceptable use policies</li>
                    <li>Those platforms' intellectual property policies and DMCA compliance procedures</li>
                    <li>Those platforms' privacy policies and data handling requirements</li>
                    <li>Any legal restrictions on exporting or re-using data from those platforms</li>
                    <li>Third-party copyright, privacy, and personality rights in the imported content</li>
                  </ul>

                  <div className="bg-white rounded p-4 mb-4">
                    <h5 className="font-semibold text-gray-900 mb-2 text-sm">Soma's Disclaimer of Responsibility:</h5>
                    <p className="text-sm text-gray-700 mb-2"><strong>Soma is NOT responsible for:</strong></p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                      <li>Violations of third-party platform Terms of Service resulting from your import or use of data</li>
                      <li>Takedown notices, legal actions, or account suspensions by third-party platforms</li>
                      <li>Copyright infringement claims related to third-party-owned content in your imported data</li>
                      <li>Privacy violations or claims by third-party individuals depicted in imported content</li>
                      <li>Breach of third-party platforms' intellectual property or data handling requirements</li>
                      <li>Any damages, losses, or liabilities resulting from your import of third-party data</li>
                    </ul>
                  </div>

                  <p className="text-xs text-red-700 font-semibold border-t border-red-300 pt-3">
                    If a third-party platform notifies Soma that you have violated their terms through your use of Soma, Soma may immediately remove the offending content and suspend your account.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.6 AI-Generated Content - Ownership, Copyright, and Limitations</h3>

                <div className="space-y-4 my-6">
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-purple-900 mb-2 text-sm">5.6.1 Assignment of Rights</h4>
                    <p className="text-sm text-purple-800">
                      <strong>Content generated, created, or synthesized by Soma's AI models based on your User Content ("AI-Generated Content")</strong> includes AI responses, summaries, persona outputs, and similar AI-created materials. To the maximum extent permitted by law, Soma assigns all rights it may have in AI-Generated Content to you, granting you ownership of the AI-Generated Content output.
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-300 rounded p-4">
                    <h4 className="font-semibold text-yellow-900 mb-3 text-sm">5.6.2 Copyright Uncertainty Disclaimer</h4>
                    <p className="text-sm text-yellow-800 mb-3">
                      <strong>IMPORTANT:</strong> The U.S. Copyright Office has determined that works generated solely by artificial intelligence without significant human authorship or creative direction may lack human authorship and therefore may not be eligible for copyright protection under current U.S. law (See Thaler v. U.S. Patent and Trademark Office, Telfer v. U.S. Copyright Office).
                    </p>
                    <p className="text-sm text-yellow-800 mb-3">
                      Accordingly, <strong>Soma cannot guarantee that AI-Generated Content is eligible for copyright protection</strong>, even though Soma assigns its rights to you. Third parties may contest your ownership or use of AI-Generated Content, particularly if commercialization is involved.
                    </p>
                    <p className="text-sm text-yellow-800">
                      <strong>If you intend to commercially exploit, publish, or license AI-Generated Content, we strongly recommend that you:</strong>
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-yellow-800 mt-2">
                      <li>Consult with an intellectual property attorney regarding copyrightability</li>
                      <li>Consider adding significant human creative contribution to the AI output to strengthen copyright claims</li>
                      <li>Understand that copyright protection may not be available</li>
                      <li>Review international copyright laws if publishing internationally</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 border border-orange-300 rounded p-4">
                    <h4 className="font-semibold text-orange-900 mb-2 text-sm">5.6.3 Accuracy and Attribution</h4>
                    <p className="text-sm text-orange-800">
                      AI-Generated Content may be inaccurate, biased, or contain false information generated by machine learning algorithms. <strong>You are responsible for independently verifying the accuracy of AI-Generated Content before relying on it or sharing it publicly.</strong> If you publish or distribute AI-Generated Content, you should consider disclosing that it was generated by AI.
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.7 Soma's Intellectual Property Rights</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Soma retains all rights, title, and interest in and to:</strong>
                </p>

                <div className="space-y-3 text-sm text-gray-700 mb-6">
                  <div className="flex gap-3">
                    <span className="font-bold text-indigo-600">©</span>
                    <span><strong>Platform and Software:</strong> The Soma website, mobile applications, software, technology stack, including source code, executable code, object code, and underlying technology</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-indigo-600">©</span>
                    <span><strong>Trademarks and Branding:</strong> "Soma" name, logo, trademark, service marks, trade dress, brand identity, and all associated intellectual property</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-indigo-600">©</span>
                    <span><strong>AI Models and Algorithms:</strong> Pre-trained machine learning models, algorithms, neural networks, and model architectures (excluding user-specific fine-tuned models derived from your data)</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-indigo-600">©</span>
                    <span><strong>Documentation and Materials:</strong> User guides, API documentation, tutorials, help text, training materials, and marketing materials</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-indigo-600">©</span>
                    <span><strong>Aggregated Data:</strong> Aggregated, anonymized, de-identified, and statistical data derived from usage patterns across all Soma users (not linkable to any individual)</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-indigo-600">©</span>
                    <span><strong>Improvements:</strong> Any improvements, modifications, or enhancements developed by Soma from feedback or suggestions you provide</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Limited License for Your Use:</strong> Subject to these Terms, Soma grants you a limited, non-exclusive, non-transferable, revocable license to access and use Soma solely for your personal, non-commercial purposes. You may not:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                    <li>Reproduce, copy, or duplicate Soma's intellectual property</li>
                    <li>Modify, adapt, or create derivative works</li>
                    <li>Reverse-engineer, decompile, or disassemble the software</li>
                    <li>Commercially exploit Soma's intellectual property</li>
                    <li>Use Soma's trademarks without written permission</li>
                    <li>Sublicense or transfer your license to others</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">5.8 DMCA Copyright Notice and Takedown Procedure</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  Soma respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA), 17 U.S.C. § 512. If you believe your copyrighted work has been infringed through Soma's Services, you may submit a DMCA infringement notice to our designated agent:
                </p>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="space-y-2 text-sm text-gray-700 font-mono">
                    <p><strong>Soma Inc. - DMCA Agent</strong></p>
                    <p>Attn: Copyright Agent</p>
                    <p>Email: <a href="mailto:dmca@soma.ai" className="text-indigo-600 hover:underline">dmca@soma.ai</a></p>
                    <p>Mail: [U.S. Physical Address - to be provided]</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">5.8.1 DMCA Notice Requirements (17 U.S.C. § 512(c)(3))</h4>
                  <p className="text-sm text-blue-800 mb-3">Your DMCA notice must include ALL of the following elements:</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                    <li>Your physical or electronic signature</li>
                    <li>Identification of the copyrighted work claimed to be infringed</li>
                    <li>Identification of the infringing material and information sufficient to locate it</li>
                    <li>Your contact information (name, address, phone, email)</li>
                    <li>Statement that you have good faith belief the use is not authorized</li>
                    <li>Statement under penalty of perjury that information is accurate and you are authorized to act</li>
                  </ul>
                  <p className="text-sm text-blue-800 mt-3">
                    <strong>Incomplete notices will not be processed.</strong> Notice to our DMCA agent constitutes notice to Soma.
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2 text-sm">5.8.2 Counter-Notification and Our Response</h4>
                  <p className="text-sm text-orange-800 mb-2">
                    Upon receiving a valid DMCA notice, Soma will remove or disable access to the allegedly infringing content and notify the user who uploaded it. Users whose content was removed may submit a counter-notification in accordance with 17 U.S.C. § 512(g).
                  </p>
                  <p className="text-sm text-orange-800">
                    <strong>Repeated Infringement:</strong> Users who are repeat infringers of copyright law will have their accounts terminated, and Soma may report the violation to law enforcement authorities.
                  </p>
                </div>
              </section>

              {/* SECTION 6: Prohibited Conduct */}
              <section id="section-6" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  6. Prohibited Conduct
                </h2>

                <p className="text-gray-700 leading-relaxed mb-6">
                  You agree NOT to engage in any of the following prohibited conduct while using the Services:
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">6.1 Illegal Activities and Criminal Conduct</h3>

                <div className="bg-red-50 border-l-4 border-red-500 p-6 my-6 rounded-r-lg">
                  <p className="text-sm text-red-900 font-semibold mb-3">🚫 ABSOLUTELY PROHIBITED - CRIMINAL LIABILITY</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-4">
                    <strong>You may NOT use Soma to engage in, facilitate, prepare, plan, or promote any illegal activities</strong> under federal law, state law, or international law. Prohibited illegal activities include, without limitation:
                  </p>
                  <div className="space-y-3">
                    <div className="border-l-4 border-red-700 pl-4">
                      <p className="text-sm font-semibold text-red-900">Financial Crimes</p>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-red-800 mt-1">
                        <li>Fraud, wire fraud, mail fraud, or securities fraud</li>
                        <li>Identity theft, account takeover, or credential theft</li>
                        <li>Money laundering or concealment of proceeds from crime (18 U.S.C. § 1956-1957)</li>
                        <li>Terrorist financing or support of designated terrorist organizations (31 U.S.C. § 5318)</li>
                        <li>Ponzi schemes, pyramid schemes, or advance-fee fraud</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-red-700 pl-4">
                      <p className="text-sm font-semibold text-red-900">Drug and Controlled Substance Offenses</p>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-red-800 mt-1">
                        <li>Manufacture, distribution, possession with intent to distribute, or sale of controlled substances</li>
                        <li>Coordination or solicitation of drug trafficking activities</li>
                        <li>Use of Soma to locate, contact, or facilitate transactions with drug suppliers</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-red-700 pl-4">
                      <p className="text-sm font-semibold text-red-900">Crimes Against Persons</p>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-red-800 mt-1">
                        <li>Human trafficking, sex trafficking, or labor trafficking (18 U.S.C. § 1591)</li>
                        <li>Child exploitation or production of child sexual abuse material (CSAM)</li>
                        <li>Threats, intimidation, stalking, or harassment</li>
                        <li>Impersonation for purposes of fraud or deception</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-red-700 pl-4">
                      <p className="text-sm font-semibold text-red-900">Intellectual Property and Computer Crimes</p>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-red-800 mt-1">
                        <li>Copyright or trademark infringement or counterfeiting</li>
                        <li>Trade secret theft or industrial espionage</li>
                        <li>Hacking, unauthorized computer access, or violations of the Computer Fraud and Abuse Act (18 U.S.C. § 1030)</li>
                        <li>Bypassing security measures or distributing hacking tools</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-xs text-red-700 font-semibold border-t border-red-300 pt-3 mt-4">
                    LEGAL CONSEQUENCE: Illegal activity may result in criminal prosecution, civil liability, account termination, data disclosure to law enforcement, and reporting to the FBI, Secret Service, DEA, ICE, and other federal agencies.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">6.2 Harmful Content - Zero Tolerance</h3>

                <div className="space-y-4 my-6">
                  <div className="bg-white border border-red-300 rounded-lg p-6">
                    <p className="text-sm text-gray-700 leading-relaxed mb-4 font-semibold">
                      <strong>Soma has a ZERO-TOLERANCE policy for harmful content. Prohibited content includes:</strong>
                    </p>

                    <div className="space-y-4">
                      <div className="border-l-4 border-red-600 pl-4 bg-red-50 p-4 rounded-r-lg">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Violence and Self-Harm</h4>
                        <p className="text-sm text-gray-700 mb-2">
                          Content that promotes, glorifies, encourages, provides instructions for, or celebrates:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                          <li>Physical violence, assault, or homicide</li>
                          <li>Self-harm, suicide, or suicide methods</li>
                          <li>Domestic violence or intimate partner abuse</li>
                          <li>Mass violence events or terrorism</li>
                          <li>Animal cruelty or animal abuse</li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-purple-600 pl-4 bg-purple-50 p-4 rounded-r-lg">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Hate Speech and Discrimination</h4>
                        <p className="text-sm text-gray-700 mb-2">
                          Content attacking individuals or groups based on protected characteristics:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                          <li>Race, ethnicity, or national origin</li>
                          <li>Religious belief or practice</li>
                          <li>Gender identity or sexual orientation</li>
                          <li>Disability (physical or mental)</li>
                          <li>Age, immigration status, or caste</li>
                          <li>Conspiracy theories targeting protected groups (antisemitism, QAnon, etc.)</li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-orange-600 pl-4 bg-orange-50 p-4 rounded-r-lg">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Child Exploitation</h4>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>MANDATORY REPORTING:</strong> Any content involving exploitation of minors will be immediately reported to the National Center for Missing & Exploited Children (NCMEC) and law enforcement:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                          <li>Child sexual abuse material (CSAM) or images depicting child sexual abuse</li>
                          <li>Child sexual exploitation or grooming content</li>
                          <li>Non-consensual intimate images of minors</li>
                          <li>Child trafficking content or evidence</li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-blue-600 pl-4 bg-blue-50 p-4 rounded-r-lg">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Non-Consensual Intimate Content</h4>
                        <p className="text-sm text-gray-700 mb-2">
                          Content of intimate nature shared without consent (revenge porn, deepfakes):
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                          <li>Non-consensual intimate photographs or videos</li>
                          <li>AI-generated intimate imagery (deepfakes) of real persons</li>
                          <li>Shared without explicit ongoing consent of individuals depicted</li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-amber-600 pl-4 bg-amber-50 p-4 rounded-r-lg">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Disinformation and Harmful Misinformation</h4>
                        <p className="text-sm text-gray-700 mb-2">
                          Deliberate false information designed to harm public health, safety, or democratic processes:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                          <li>Election fraud claims contradicted by courts and election officials</li>
                          <li>Health misinformation contradicting public health guidance (vaccine false claims, etc.)</li>
                          <li>Incitement to imminent lawless action or violence</li>
                          <li>False emergency alerts or disaster information</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">6.3 Abuse of Soma's Services and Systems</h3>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    <strong>Prohibited system abuse includes:</strong>
                  </p>
                  
                  <div className="space-y-3">
                    <div className="border-l-4 border-indigo-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">6.3.1 Security Circumvention</h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                        <li>Bypassing, circumventing, or disabling security measures, access controls, rate limits, or authentication mechanisms</li>
                        <li>Attempting unauthorized access to Soma systems, servers, or databases</li>
                        <li>Exploiting known security vulnerabilities without responsible disclosure</li>
                        <li>Intercepting or eavesdropping on network communications</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-indigo-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">6.3.2 Reverse Engineering and IP Theft</h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                        <li>Reverse-engineering, decompiling, disassembling, or attempting to derive Soma's source code, algorithms, or architecture</li>
                        <li>Extracting or stealing Soma's trade secrets, intellectual property, or proprietary models</li>
                        <li>Using extracted code or models to create competing products or services</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-indigo-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">6.3.3 Automated Data Scraping</h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                        <li>Automated scraping, crawling, harvesting, or bulk downloading of Soma content, code, or data</li>
                        <li>Using bots or automated tools to collect information from Soma</li>
                        <li>Circumventing robots.txt or other anti-scraping measures</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-indigo-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">6.3.4 Competitive Benchmarking</h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                        <li>Using Soma for benchmarking, competitive analysis, or market research for creating competing services</li>
                        <li>Testing Soma to inform development of competing AI or memory systems</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-indigo-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">6.3.5 Account Fraud</h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                        <li>Creating multiple accounts to evade suspensions, abuse free trial periods, or circumvent usage limits</li>
                        <li>Using fake or fraudulent identities during registration</li>
                        <li>Abusing promotional codes, discounts, or free credit offers</li>
                        <li>Selling or transferring account access to others</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-indigo-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">6.3.6 Malware and Denial of Service</h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                        <li>Uploading, distributing, or executing malware, viruses, worms, or harmful code through Soma</li>
                        <li>Launching distributed denial-of-service (DDoS) attacks, network flooding, or resource exhaustion attacks</li>
                        <li>Attempting to overload or crash Soma systems or infrastructure</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">6.4 Privacy and Security Violations</h3>

                <div className="bg-red-50 rounded-lg p-6 mb-6">
                  <p className="text-sm text-red-900 leading-relaxed mb-4">
                    <strong>Prohibited privacy and security violations:</strong>
                  </p>
                  
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <span className="font-bold text-red-600">•</span>
                      <span><strong>Doxxing:</strong> Publishing private personal information of others (name, address, phone, email, SSN, location) without consent with intent to harm</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-red-600">•</span>
                      <span><strong>Account Compromise:</strong> Attempting unauthorized access, gaining access through theft, or accessing another user's account without permission</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-red-600">•</span>
                      <span><strong>Phishing:</strong> Sending fake emails, messages, or websites impersonating Soma or trusted third parties to steal credentials or information</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-red-600">•</span>
                      <span><strong>Social Engineering:</strong> Manipulating Soma staff or users to divulge confidential information or bypass security measures</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-red-600">•</span>
                      <span><strong>Vulnerability Abuse:</strong> Discovering security flaws but disclosing them publicly or exploiting them without responsible disclosure</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-red-600">•</span>
                      <span><strong>Stalking and Harassment:</strong> Repeated unwanted contact, monitoring, surveillance, or harassment of individuals through Soma</span>
                    </li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">6.5 Enforcement Actions and Consequences</h3>

                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-4">⚠️ SOMA ENFORCEMENT AUTHORITY</p>
                  
                  <p className="text-sm text-yellow-800 leading-relaxed mb-4">
                    <strong>Soma has absolute discretion to enforce these Terms and may take any of the following actions (in any combination) for violations of Section 6, without prior notice:</strong>
                  </p>

                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex gap-2">
                      <span className="font-bold text-yellow-600">1.</span>
                      <span><strong>Content Removal:</strong> Immediate removal of prohibited content from your account</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-yellow-600">2.</span>
                      <span><strong>Account Suspension:</strong> Temporary suspension of your account and access to Soma services (24 hours to permanent)</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-yellow-600">3.</span>
                      <span><strong>Account Termination:</strong> Permanent closure of your account with no recovery opportunity</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-yellow-600">4.</span>
                      <span><strong>Data Deletion:</strong> Permanent deletion of all User Content and account data (may occur within 24 hours)</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-yellow-600">5.</span>
                      <span><strong>Payment Cancellation:</strong> Forfeiture and non-refund of any prepaid subscriptions, credits, or fees</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-yellow-600">6.</span>
                      <span><strong>Permanent Ban:</strong> Blacklisting of your email address, device ID, and payment methods to prevent future account creation</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-yellow-600">7.</span>
                      <span><strong>Law Enforcement Referral:</strong> Reporting violation to FBI, Secret Service, DEA, NCMEC, or other federal/state agencies</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-yellow-600">8.</span>
                      <span><strong>Legal Action:</strong> Pursuit of civil litigation for damages, injunctive relief, and recovery of attorneys' fees and costs</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-yellow-600">9.</span>
                      <span><strong>IP Address Blocking:</strong> Blocking of your IP address from accessing Soma</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-yellow-600">10.</span>
                      <span><strong>Public Notice:</strong> Disclosure of violations and enforcement actions to relevant parties (law enforcement, affected parties, etc.)</span>
                    </div>
                  </div>

                  <p className="text-xs text-yellow-700 font-semibold border-t border-yellow-300 pt-3 mt-4">
                    NO CURE PERIOD OR SECOND CHANCE: Soma may immediately enforce any action without offering opportunity to correct or cure violation. Termination is final and irreversible.
                  </p>
                </div>
              </section>

              {/* SECTION 7: Third-Party Services and Data Import */}
              <section id="section-7" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  7. Third-Party Services and Data Import
                </h2>

                <p className="text-gray-700 leading-relaxed mb-6">
                  <strong>Soma integrates with and links to third-party services, platforms, and external websites.</strong> This Section 7 governs your use of such integrations and your legal responsibility for imported data from external sources.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">7.1 Third-Party Service Integrations and Disclaimers</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  Soma may integrate with or provide links to external services and platforms, including:
                </p>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                      <h4 className="font-semibold mb-2">Communication Platforms:</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Google Workspace (Gmail, Calendar, Photos)</li>
                        <li>WeChat</li>
                        <li>WhatsApp</li>
                        <li>Instagram, Facebook, LinkedIn</li>
                        <li>Apple Mail, iCloud</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Payment & Infrastructure:</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Payment processors (Stripe, PayPal)</li>
                        <li>Cloud storage providers (AWS, Google Cloud)</li>
                        <li>AI/ML providers (Google, OpenAI)</li>
                        <li>Analytics services</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 my-6 rounded-r-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">7.1.1 No Endorsement or Affiliation</h4>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    <strong>Soma does NOT endorse, guarantee, or take responsibility for any Third-Party Services.</strong> Soma's inclusion or linking to a third-party service does not constitute an endorsement, warranty, or approval of that service. Soma's relationship with third-party providers is limited to technical integration only.
                  </p>
                  <p className="text-sm text-blue-800">
                    Third-party services are provided "AS-IS" by their respective operators. Soma has no control over their content, security, privacy practices, or service reliability.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">7.2 User Responsibility and Independent Assessment</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>By using any Third-Party Service through or in connection with Soma, you assume sole responsibility for:</strong>
                </p>

                <div className="space-y-3 my-6">
                  <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">7.2.1 Review and Acceptance of Third-Party Terms</h4>
                    <p className="text-sm text-gray-700">
                      You have read, understood, and agree to be bound by each Third-Party Service's Terms of Service, Privacy Policy, Acceptable Use Policy, and all other governing documents. You have the legal authority and capacity to accept these terms.
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">7.2.2 Ongoing Compliance Monitoring</h4>
                    <p className="text-sm text-gray-700">
                      You periodically review each Third-Party Service's terms for changes and ensure your ongoing use complies with the most current version. Changes to third-party terms may make your existing use non-compliant; you are solely responsible for stopping use if compliance becomes impossible.
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">7.2.3 Privacy and Data Handling</h4>
                    <p className="text-sm text-gray-700">
                      You acknowledge that third-party services may collect, use, and disclose your data in accordance with their privacy policies, which may differ significantly from Soma's practices. You have independently assessed the privacy risks of each third-party service.
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">7.2.4 Completeness and Accuracy of Data Export</h4>
                    <p className="text-sm text-gray-700">
                      Third-party services may not export your complete data or data may be corrupted or incomplete during export. Soma is not responsible for missing, incomplete, or inaccurate data from third-party exports. You maintain independent backups.
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">7.3 OAuth Authorization and Data Import Procedures</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  When importing data from Third-Party Services, Soma uses OAuth 2.0 or similar secure authentication protocols:
                </p>

                <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">7.3.1 Authorization Grant</h4>
                    <p className="text-sm text-gray-700">
                      You grant Soma limited authorization to access your account on the Third-Party Service solely for purposes of importing your data. This authorization is:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700 mt-2">
                      <li><strong>Scope-Limited:</strong> Access is limited to the minimum data categories necessary for import</li>
                      <li><strong>Time-Limited:</strong> Authorization may expire and require re-authorization</li>
                      <li><strong>Revocable:</strong> You may revoke authorization at any time (see Section 7.6)</li>
                      <li><strong>Non-Transferable:</strong> Authorization is personal to your account and cannot be transferred</li>
                    </ul>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">7.3.2 Representations During Authorization</h4>
                    <p className="text-sm text-gray-700">
                      By authorizing Soma to access your Third-Party Service account, you represent and warrant:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700 mt-2">
                      <li>You are the authorized account holder or have explicit permission to grant this authorization</li>
                      <li>You have the legal right to export the data from the Third-Party Service</li>
                      <li>Granting this authorization does not violate the Third-Party Service's terms</li>
                      <li>The data you authorize for import is your own or you have obtained necessary permissions</li>
                    </ul>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">7.3.3 Import Process Disclaimer</h4>
                    <p className="text-sm text-gray-700">
                      Soma makes no guarantee regarding:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700 mt-2">
                      <li>Complete or accurate import of all data</li>
                      <li>Preservation of data formatting, metadata, or relationships</li>
                      <li>Import completion if Third-Party Service changes its API or authentication</li>
                      <li>Real-time or continuous synchronization of data from Third-Party Services</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">7.4 WeChat Data Import - Special Considerations</h3>

                <div className="bg-orange-50 border-l-4 border-orange-500 p-6 my-6 rounded-r-lg">
                  <h4 className="font-semibold text-orange-900 mb-3">7.4.1 WeChat Encryption Architecture</h4>
                  <p className="text-sm text-orange-800 leading-relaxed mb-4">
                    WeChat uses client-side encryption for message storage. Messages are encrypted locally on your device and cannot be accessed by Soma without the device-specific decryption key. Soma does NOT have a separate relationship with WeChat or access to WeChat servers.
                  </p>

                  <h4 className="font-semibold text-orange-900 mb-2 text-sm">7.4.2 User-Provided Decryption Keys</h4>
                  <p className="text-sm text-orange-800 leading-relaxed mb-3">
                    To import WeChat data, <strong>you must manually extract and provide the decryption key from your device.</strong> This process:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-orange-800 mb-4">
                    <li><strong>Is Not Official WeChat Support:</strong> Soma does not partner with WeChat; this is a technical workaround for personal data export</li>
                    <li><strong>Requires Technical Knowledge:</strong> Key extraction may require access to device file systems and technical commands</li>
                    <li><strong>Carries Security Risks:</strong> Exposing your decryption key to Soma (or any third party) poses security and privacy risks</li>
                    <li><strong>May Violate WeChat Terms:</strong> WeChat's terms may prohibit exporting encrypted data; you are solely responsible for compliance</li>
                  </ul>

                  <h4 className="font-semibold text-orange-900 mb-2 text-sm">7.4.3 Soma's Limited Role in WeChat Decryption</h4>
                  <p className="text-sm text-orange-800 leading-relaxed mb-3">
                    <strong>Soma's role is strictly limited as follows:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-orange-800">
                    <li>Soma provides tools to assist in decryption and import</li>
                    <li>Soma does NOT validate, verify, or guarantee the security of the import process</li>
                    <li>Soma does NOT store, cache, or retain your decryption key after import completion</li>
                    <li>Soma does NOT assist with key extraction from your device (you do this independently)</li>
                  </ul>

                  <div className="bg-red-50 rounded p-4 mt-4 border border-red-200">
                    <p className="text-xs text-red-700 font-semibold mb-2">⚠️ CRITICAL SECURITY WARNING:</p>
                    <p className="text-xs text-red-700">
                      Never share your WeChat decryption key with anyone except Soma during import. Never use the key on untrusted computers. If you believe your key has been compromised, immediately change your WeChat password and remove WeChat from compromised devices.
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">7.5 User Warranty and Indemnification for Imported Data</h3>

                <div className="bg-red-50 border border-red-300 rounded-lg p-6">
                  <h4 className="font-semibold text-red-900 mb-3">7.5.1 Representations Regarding Import Legality</h4>
                  <p className="text-sm text-red-800 leading-relaxed mb-4">
                    <strong>You represent and warrant that all imported data:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-red-800 mb-4">
                    <li>You own or have obtained all necessary permissions and consents to export and import</li>
                    <li>Importing the data does not violate any Third-Party Service's terms or applicable law</li>
                    <li>The data does not infringe any third party's intellectual property, privacy, or personality rights</li>
                    <li>The data does not contain child sexual abuse material (CSAM), illegal content, or malware</li>
                    <li>You have obtained informed consent from all individuals whose personal information is included in the import</li>
                  </ul>

                  <h4 className="font-semibold text-red-900 mb-3">7.5.2 Indemnification Obligation</h4>
                  <p className="text-sm text-red-800 leading-relaxed">
                    <strong>You shall indemnify, defend, and hold harmless Soma from any and all claims, damages, losses, liabilities, costs, and expenses (including attorneys' fees) arising from or related to:</strong> (a) imported data in violation of third-party terms; (b) data that infringes intellectual property or privacy rights; (c) takedown notices or legal action by third parties related to imports; (d) your breach of any Third-Party Service terms in conducting the import; or (e) any illegal content in imported data.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">7.6 Third-Party Service Disruptions and Soma's Limited Liability</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Soma is NOT responsible for third-party service disruptions, including:</strong>
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex gap-3">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-sm text-gray-700"><strong>API Changes:</strong> Third-party services modifying, discontinuing, or breaking their APIs, causing import failures</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-sm text-gray-700"><strong>Authentication Changes:</strong> Changes to OAuth, login, or authentication mechanisms</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-sm text-gray-700"><strong>Service Outages:</strong> Temporary or permanent outages, downtime, or unavailability of Third-Party Services</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-sm text-gray-700"><strong>Account Suspension:</strong> Suspension or termination of your account by the Third-Party Service</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-sm text-gray-700"><strong>Data Loss:</strong> Data loss, corruption, or deletion by Third-Party Services</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-sm text-gray-700"><strong>Legal Action:</strong> Third-party platforms taking legal action against you for data export</span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">7.7 Revoking Third-Party Access</h3>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">7.7.1 Methods to Revoke Authorization</h4>
                  <p className="text-sm text-blue-800 leading-relaxed mb-4">
                    You may revoke Soma's access to any Third-Party Service at any time through any of these methods:
                  </p>
                  <div className="bg-white rounded p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Option 1: Through Soma Account Settings</p>
                      <p className="text-sm text-gray-700">Visit your Soma account dashboard → Connected Services → Disconnect [Service Name]</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Option 2: Through Third-Party Service Settings</p>
                      <p className="text-sm text-gray-700">Log into the Third-Party Service → Account Settings → Connected Apps → Revoke access for "Soma"</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Option 3: Direct Communication</p>
                      <p className="text-sm text-gray-700">Email <a href="mailto:support@soma.ai" className="text-indigo-600 hover:underline">support@soma.ai</a> with your request to revoke access</p>
                    </div>
                  </div>

                  <h4 className="font-semibold text-blue-900 mb-2 text-sm mt-4">7.7.2 Effect of Revoking Authorization</h4>
                  <p className="text-sm text-blue-800">
                    Revoking authorization will:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-blue-800 mt-2 mb-2">
                    <li>✓ Stop future data imports from that Third-Party Service</li>
                    <li>✓ Prevent Soma from accessing your Third-Party Service account in the future</li>
                  </ul>
                  <p className="text-sm text-blue-800">Revoking authorization will NOT:</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-blue-800 mt-1">
                    <li>✗ Delete previously imported data already stored in your Soma account</li>
                    <li>✗ Remove previously imported data from Soma's systems</li>
                  </ul>
                  <p className="text-xs text-blue-700 font-semibold mt-3 pt-3 border-t border-blue-300">
                    To delete previously imported data, you must manually delete items in your account or request full account deletion.
                  </p>
                </div>

              </section>

              {/* SECTION 8: AI-Generated Content Disclaimer */}
              <section id="section-8" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  8. AI-Generated Content Disclaimer and Limitations
                </h2>

                <p className="text-gray-700 leading-relaxed mb-6">
                  <strong>Soma's core functionality involves generating content through artificial intelligence and machine learning.</strong> This Section 8 establishes critical limitations, disclaimers, and user acknowledgments regarding AI-generated content. <strong>These disclaimers are non-waivable and material to your use of Soma.</strong>
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">8.1 Nature of AI-Generated Responses - Critical Understanding</h3>

                <div className="bg-red-50 border-l-4 border-red-500 p-6 my-6 rounded-r-lg">
                  <p className="text-sm text-red-900 font-semibold mb-3">⚠️ CRITICAL UNDERSTANDING - NOT SENTIENT INTERACTION</p>
                  
                  <p className="text-sm text-red-800 leading-relaxed mb-4">
                    <strong>Soma's AI generates responses based on statistical patterns learned from your User Content.</strong> You must understand that:
                  </p>

                  <div className="bg-white rounded p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">NOT Conscious or Sentient</p>
                      <p className="text-sm text-gray-700">AI does not possess consciousness, emotions, understanding, subjective experience, or sentience. Responses are generated through mathematical computations, not thought or feeling.</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">NOT Your Actual Personality</p>
                      <p className="text-sm text-gray-700">AI-generated responses resemble communication patterns but do not constitute true personality replication, reproduction of consciousness, or digital afterlife.</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">NOT Guaranteed Accurate</p>
                      <p className="text-sm text-gray-700">AI may generate plausible-sounding but factually incorrect information, known as "hallucinations." Even sophisticated AI systems produce errors regularly.</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">NOT a Substitute for Professionals</p>
                      <p className="text-sm text-gray-700">AI responses should NOT replace professional consultation for medical, legal, financial, psychological, or other consequential advice.</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">8.2 AI Accuracy and Reliability Limitations</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>You acknowledge that AI-Generated Content carries the following inherent limitations:</strong>
                </p>

                <div className="space-y-3 my-6">
                  <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">8.2.1 Factual Errors and Hallucinations</h4>
                    <p className="text-sm text-gray-700">
                      AI frequently generates confident but incorrect statements, including fabricated facts, dates, names, and quotations. These errors may appear realistic and go unnoticed. Accuracy is never guaranteed and may be 0% on unfamiliar topics.
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">8.2.2 Bias and Discriminatory Content</h4>
                    <p className="text-sm text-gray-700">
                      AI models reflect biases present in training data, including gender bias, racial bias, and stereotypes. Responses may be discriminatory, offensive, or reflect harmful cultural biases despite Soma's efforts to mitigate bias.
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">8.2.3 Non-Deterministic and Inconsistent Outputs</h4>
                    <p className="text-sm text-gray-700">
                      Identical inputs may produce different outputs at different times. AI responses are probabilistic, not deterministic. Consistency cannot be guaranteed even for the same query asked minutes apart.
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">8.2.4 Loss of Nuance, Context, and Subjectivity</h4>
                    <p className="text-sm text-gray-700">
                      AI cannot fully capture emotional nuance, contextual subtlety, sarcasm, humor, or subjective interpretation. Communication patterns may be mechanically reproduced without authentic understanding.
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">8.2.5 Data Quality and Quantity Dependency</h4>
                    <p className="text-sm text-gray-700">
                      AI accuracy depends on the quality, quantity, and diversity of training data. Limited data, poor data quality, or unrepresentative data will produce poor results. User content volume directly impacts AI quality.
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">8.2.6 Knowledge Cutoff and Outdated Information</h4>
                    <p className="text-sm text-gray-700">
                      AI models have knowledge cutoff dates; information beyond the cutoff date is unavailable. AI may provide outdated or superseded information without indication that the information is stale.
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">8.3 Persona Replication Limitations and Psychological Considerations</h3>

                <div className="bg-purple-50 border border-purple-300 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-purple-900 mb-3">8.3.1 Limits of Personality Replication</h4>
                  <p className="text-sm text-purple-800 leading-relaxed mb-4">
                    While Soma aims to create a realistic digital representation of communication style and personality patterns:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                    <li><strong>AI Cannot Replicate Consciousness:</strong> AI cannot replicate consciousness, subjective experience, or the phenomenological reality of being human</li>
                    <li><strong>Anthropomorphization Warning:</strong> Do not anthropomorphize AI as possessing understanding, sentience, emotion, or agency</li>
                    <li><strong>Variability in Perception:</strong> Different users may perceive AI responses as more or less realistic based on personal factors, familiarity, and emotional state</li>
                    <li><strong>Personality vs. Pattern Matching:</strong> Reproduced communication patterns are mathematically optimized outputs, not expressions of authentic personality</li>
                  </ul>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg mb-6">
                  <h4 className="font-semibold text-red-900 mb-3">8.3.2 Grief Support - NOT a Substitute for Professional Help</h4>
                  <p className="text-sm text-red-800 leading-relaxed mb-4">
                    <strong>Soma is designed to assist individuals processing grief.</strong> However:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-red-800">
                    <li>AI interaction is <strong>NOT a substitute</strong> for grief counseling, therapy, or mental health treatment</li>
                    <li>AI cannot provide personalized mental health care, diagnosis, or treatment</li>
                    <li>Continued reliance on AI interactions without professional support may hinder healthy grief processing</li>
                    <li>Interactions with AI representations of deceased individuals may inhibit acceptance and movement through grief stages</li>
                    <li><strong>Seek professional help if grief intensifies, becomes complicated, or prevents daily functioning</strong></li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">8.4 User Responsibility for AI-Generated Content Decisions</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Soma assumes NO responsibility for any decisions or actions you take based on AI-Generated Content.</strong>
                </p>

                <div className="space-y-3 my-6">
                  <div className="bg-orange-50 rounded p-4 border-l-4 border-orange-500">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Financial and Investment Decisions</h4>
                    <p className="text-sm text-gray-700">
                      Do NOT rely on AI investment advice, stock recommendations, or financial planning guidance. Always consult a qualified financial advisor. Soma is not a financial advisor and provides no financial advice.
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded p-4 border-l-4 border-orange-500">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Medical and Health Decisions</h4>
                    <p className="text-sm text-gray-700">
                      Do NOT use AI-generated responses for medical diagnosis, treatment, medication decisions, or health advice. Always consult qualified healthcare providers. AI is not a doctor or medical professional.
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded p-4 border-l-4 border-orange-500">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Legal Decisions</h4>
                    <p className="text-sm text-gray-700">
                      Do NOT rely on AI for legal advice, contract interpretation, compliance guidance, or legal strategy. Always consult a qualified attorney. AI is not a lawyer.
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded p-4 border-l-4 border-orange-500">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Relationship, Personal, and Consequential Decisions</h4>
                    <p className="text-sm text-gray-700">
                      Do NOT rely on AI for relationship decisions, parenting advice, career choices, or other consequential personal decisions. Always seek guidance from trusted individuals, professionals, or mentors.
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-300 rounded-lg p-4 my-6">
                  <p className="text-sm text-red-800 font-semibold">
                    🔴 CRITICAL: If you make important life decisions based on AI-generated content and those decisions result in harm, loss, or damage, Soma is NOT responsible and you assume full responsibility for the consequences.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">8.5 Mental Health and Emotional Crisis Support</h3>

                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
                  <h4 className="font-semibold text-red-900 mb-3">8.5.1 Not Emergency Mental Health Support</h4>
                  <p className="text-sm text-red-800 leading-relaxed mb-4">
                    <strong>Soma is NOT a crisis support service, mental health platform, or emergency service.</strong> If you are experiencing a mental health crisis:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-red-800">
                    <li><strong>Suicidal Ideation:</strong> If you have thoughts of suicide, immediately contact emergency services (911 in US) or the National Suicide Prevention Lifeline (988)</li>
                    <li><strong>Self-Harm Urges:</strong> Seek immediate professional help from a mental health crisis team</li>
                    <li><strong>Severe Mental Health Symptoms:</strong> Contact a mental health professional, hospital emergency department, or crisis line</li>
                    <li><strong>Substance Use Crisis:</strong> Contact poison control (1-800-222-1222) or emergency services</li>
                  </ul>

                  <div className="bg-white rounded p-4 mt-4 space-y-2 text-sm text-gray-700">
                    <p className="font-semibold">Crisis Resources (United States):</p>
                    <p>🆘 National Suicide Prevention Lifeline: <strong>988</strong> (call or text, 24/7)</p>
                    <p>💬 Crisis Text Line: Text <strong>HOME</strong> to <strong>741741</strong> (24/7)</p>
                    <p>🚑 Emergency Services: <strong>911</strong></p>
                    <p>☠️ Poison Control: <strong>1-800-222-1222</strong></p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">8.6 AI Model Updates and Version Changes</h3>

                <p className="text-gray-700 leading-relaxed mb-4">
                  Soma's AI models may be updated, retrained, replaced, or discontinued at any time without notice. Version changes will result in:
                </p>

                <div className="space-y-3 my-6">
                  <div className="flex gap-3">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-sm text-gray-700"><strong>Different Responses:</strong> Identical queries may produce different outputs after model updates</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-sm text-gray-700"><strong>Quality Variations:</strong> Response quality may improve, degrade, or change in unpredictable ways</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-sm text-gray-700"><strong>Feature Changes:</strong> Capabilities, response length, formatting, or output types may change</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-sm text-gray-700"><strong>No Backward Compatibility:</strong> Soma does not guarantee backward compatibility or preservation of behavior</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 italic">
                  Soma provides no guarantees regarding continuity of AI behavior between versions or updates.
                </p>

              </section>

              {/* SECTION 9: Privacy and Data Protection */}
              <section id="section-9" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  9. Privacy and Data Protection
                </h2>

                <p className="text-gray-700 leading-relaxed mb-6">
                  Our collection, use, and protection of your personal information is governed by our Privacy Policy. This section provides key highlights relevant to these Terms.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">9.1 Applicable Privacy Laws and Framework</h3>

                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-6 mb-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-4">Soma operates under the following legal frameworks:</p>
                  
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded border-l-4 border-indigo-500">
                      <p className="font-semibold text-sm text-gray-900">California Consumer Privacy Act (CCPA)</p>
                      <p className="text-xs text-gray-600">Cal. Civil Code § 1798.100 et seq. - Provides California residents with specific rights regarding personal information</p>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-indigo-500">
                      <p className="font-semibold text-sm text-gray-900">General Data Protection Regulation (GDPR)</p>
                      <p className="text-xs text-gray-600">EU Regulation (EU) 2016/679 - Protects personal data of EU residents with comprehensive rights</p>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-indigo-500">
                      <p className="font-semibold text-sm text-gray-900">Children's Online Privacy Protection Act (COPPA)</p>
                      <p className="text-xs text-gray-600">15 U.S.C. § 6501 et seq. - Protects personal information of children under 13</p>
                    </div>

                    <div className="bg-white p-4 rounded border-l-4 border-indigo-500">
                      <p className="font-semibold text-sm text-gray-900">State Privacy Laws</p>
                      <p className="text-xs text-gray-600">Including California, Virginia, Colorado, Connecticut, Utah and emerging state privacy legislation</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">9.2 Data Collection and Processing Practices</h3>

                <h4 className="font-semibold text-gray-900 text-sm mt-4 mb-3">9.2.1 Data Categories Collected</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  Soma collects the following categories of information:
                </p>

                <div className="space-y-2 mb-6">
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p className="font-semibold text-gray-900">Account Information</p>
                    <p className="text-gray-700">Name, email address, password (hashed), phone number, profile information</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p className="font-semibold text-gray-900">User Content</p>
                    <p className="text-gray-700">Messages, documents, photos, videos, and other content you upload or import</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p className="font-semibold text-gray-900">Third-Party Integrated Data</p>
                    <p className="text-gray-700">Data imported from Google, Instagram, WeChat, and other third-party services via OAuth or authorized integrations</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p className="font-semibold text-gray-900">Usage Data</p>
                    <p className="text-gray-700">IP address, device information, browser type, pages visited, features used, interaction patterns, timestamps</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p className="font-semibold text-gray-900">Communication Data</p>
                    <p className="text-gray-700">Messages to support, feedback, survey responses, error logs from service interactions</p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p className="font-semibold text-gray-900">Derived Data</p>
                    <p className="text-gray-700">AI model parameters, persona profiles, inferred communication patterns, behavioral analytics</p>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">9.2.2 Lawful Basis for Processing</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  Soma processes personal data under the following lawful bases:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li><strong>Contractual Necessity:</strong> Data processing required to provide services under these Terms</li>
                  <li><strong>User Consent:</strong> Explicit user permission for specific processing activities (e.g., WeChat data import)</li>
                  <li><strong>Legitimate Interests:</strong> Soma's business interests (fraud prevention, service improvement, analytics)</li>
                  <li><strong>Legal Obligation:</strong> Compliance with law enforcement requests, court orders, or regulatory requirements</li>
                  <li><strong>Vital Interests:</strong> Protecting health and safety (emergency situations, crisis prevention)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">9.3 User Data Rights and Consumer Rights Requests</h3>

                <div className="bg-blue-50 border border-blue-300 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-3 text-sm">9.3.1 Your Privacy Rights</h4>
                  <p className="text-sm text-blue-800 leading-relaxed mb-4">
                    Subject to applicable law and legal exceptions, you have the following rights:
                  </p>

                  <div className="space-y-3">
                    <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                      <p className="font-semibold text-gray-900 text-sm">✓ Right of Access</p>
                      <p className="text-gray-700 text-xs mt-1">Obtain a copy of your personal data held by Soma in a portable, structured format. CCPA § 1798.100; GDPR Article 15</p>
                    </div>

                    <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                      <p className="font-semibold text-gray-900 text-sm">✓ Right to Correction/Rectification</p>
                      <p className="text-gray-700 text-xs mt-1">Correct inaccurate or incomplete personal data. CCPA § 1798.110; GDPR Article 16</p>
                    </div>

                    <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                      <p className="font-semibold text-gray-900 text-sm">✓ Right to Erasure ("Right to be Forgotten")</p>
                      <p className="text-gray-700 text-xs mt-1">Request deletion of personal data (subject to legal retention exceptions). CCPA § 1798.105; GDPR Article 17</p>
                    </div>

                    <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                      <p className="font-semibold text-gray-900 text-sm">✓ Right to Data Portability</p>
                      <p className="text-gray-700 text-xs mt-1">Receive personal data in structured, machine-readable format to transfer to another service. CCPA § 1798.100(d); GDPR Article 20</p>
                    </div>

                    <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                      <p className="font-semibold text-gray-900 text-sm">✓ Right to Opt-Out of Sale or Sharing</p>
                      <p className="text-gray-700 text-xs mt-1">Opt out of personal information sales or sharing. CCPA § 1798.120 and § 1798.140(ah)</p>
                    </div>

                    <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                      <p className="font-semibold text-gray-900 text-sm">✓ Right to Restrict Processing</p>
                      <p className="text-gray-700 text-xs mt-1">Request limiting how personal data is used. GDPR Article 18</p>
                    </div>

                    <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                      <p className="font-semibold text-gray-900 text-sm">✓ Right to Objection</p>
                      <p className="text-gray-700 text-xs mt-1">Object to specific processing activities, including direct marketing. GDPR Article 21</p>
                    </div>

                    <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                      <p className="font-semibold text-gray-900 text-sm">✓ Right to Non-Discrimination</p>
                      <p className="text-gray-700 text-xs mt-1">No discrimination for exercising privacy rights. CCPA § 1798.125</p>
                    </div>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">9.3.2 How to Exercise Privacy Rights</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  To exercise any privacy right, submit a verifiable consumer request by:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 mb-4">
                  <li><strong>Email:</strong> privacy@soma.app with "Privacy Request" in subject line</li>
                  <li><strong>Through Account Settings:</strong> Use the "Data Privacy" settings within your Soma account</li>
                  <li><strong>Phone:</strong> Contact Soma support team at [Phone Number]</li>
                </ul>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg text-sm mb-6">
                  <p className="text-yellow-900 font-semibold mb-2">Request Requirements:</p>
                  <ul className="list-disc pl-6 space-y-1 text-yellow-800 text-xs">
                    <li>Sufficient information to identify you and verify you are the account holder</li>
                    <li>Clear description of the specific right being exercised</li>
                  </ul>
                </div>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">9.3.3 Response Timeline</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Soma will respond to verifiable privacy requests:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 mt-3 mb-6">
                  <li><strong>CCPA Requests:</strong> Within 45 calendar days (extendable 45 days for complex requests)</li>
                  <li><strong>GDPR Requests:</strong> Within 30 calendar days (extendable 60 days for complex requests)</li>
                  <li><strong>Other Jurisdictions:</strong> Within timelines required by applicable law or 60 days, whichever is shorter</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">9.4 Data Retention and Deletion</h3>

                <div className="space-y-3 mb-6">
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">9.4.1 Active Account - Retention Periods</h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      While your account is active, Soma retains all User Content indefinitely to provide continuous services. You may delete specific content at any time through account settings.
                    </p>
                  </div>

                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">9.4.2 Account Deletion - Retention Periods</h4>
                    <p className="text-xs text-gray-700 leading-relaxed mb-2">
                      Upon account deletion:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-xs text-gray-700">
                      <li><strong>User Content Permanent Deletion:</strong> User Content deleted immediately from primary systems</li>
                      <li><strong>Backup/Archive Deletion:</strong> Retained for up to 90 days in backup systems for disaster recovery</li>
                      <li><strong>Account Metadata:</strong> Email, username retained for 7 years for legal compliance (tax, audit, fraud prevention)</li>
                      <li><strong>Usage Analytics:</strong> De-identified usage data retained indefinitely</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">9.4.3 Legal Hold and Litigation Hold</h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Data may be retained longer if required by court order, government investigation, or legal proceedings. Soma will notify you of any legal hold affecting your data when permitted by law.
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">9.5 Data Security and Breach Notification</h3>

                <h4 className="font-semibold text-gray-900 text-sm mt-4 mb-3">9.5.1 Security Measures</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  Soma implements reasonable security measures to protect personal data:
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex gap-2 text-sm">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-gray-700"><strong>Encryption:</strong> Data encrypted in transit (TLS 1.2+) and at rest (AES-256)</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-gray-700"><strong>Access Controls:</strong> Role-based access control, multi-factor authentication, IP whitelisting</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-gray-700"><strong>Monitoring:</strong> Continuous security monitoring, intrusion detection, threat detection</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-gray-700"><strong>Compliance:</strong> ISO 27001, SOC 2 Type II, GDPR/CCPA compliance audits</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="font-bold text-gray-600">•</span>
                    <span className="text-gray-700"><strong>Incident Response:</strong> 24/7 incident response team and procedures</span>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">9.5.2 Data Breach Notification</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  <strong>In the event of a confirmed security breach affecting personal data, Soma will:</strong>
                </p>

                <div className="bg-red-50 border border-red-300 rounded-lg p-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="font-bold text-red-600">1.</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Investigate and Assess</p>
                        <p className="text-xs text-gray-700">Immediately investigate the breach to determine scope, data affected, and users impacted (within 24 hours)</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="font-bold text-red-600">2.</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Notify Affected Users</p>
                        <p className="text-xs text-gray-700">Notify affected users via email or account notification within applicable legal timeframes:
                          <ul className="list-disc pl-6 mt-2 text-xs text-gray-700">
                            <li><strong>CCPA/CPRA (California):</strong> Without unreasonable delay (typically 30 days)</li>
                            <li><strong>GDPR (EU/UK):</strong> Without undue delay, as soon as practicable (typically 30 days)</li>
                            <li><strong>Other States:</strong> Within 30-90 days depending on state law</li>
                          </ul>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="font-bold text-red-600">3.</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Provide Credit Monitoring</p>
                        <p className="text-xs text-gray-700">For breaches involving sensitive personal information (SSN, financial data), offer free credit monitoring and identity theft protection services for 12-24 months</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="font-bold text-red-600">4.</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Notify Authorities</p>
                        <p className="text-xs text-gray-700">Where required by law, notify applicable government agencies (California AG, FTC, state attorney generals)</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="font-bold text-red-600">5.</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Remediation Actions</p>
                        <p className="text-xs text-gray-700">Implement remediation steps: password resets, account freezing, access revocation, enhanced monitoring</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="font-bold text-red-600">6.</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Post-Incident Review</p>
                        <p className="text-xs text-gray-700">Conduct root cause analysis and implement preventive measures to avoid similar breaches</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-4 italic">
                  Note: Soma will not provide unreasonable notification timelines that delay notification due to investigation needs. Investigation must not exceed 60 days from discovery of breach.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">9.6 Data Sharing and Third Parties</h3>

                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  <strong>Soma's Data Sharing Principle:</strong> We do not sell your personal data. However, we may share data with third parties under these circumstances:
                </p>

                <div className="space-y-3 mb-6">
                  <div className="bg-gray-50 p-4 rounded border-l-4 border-gray-400">
                    <p className="font-semibold text-gray-900 text-sm">Service Providers</p>
                    <p className="text-xs text-gray-700 mt-1">Third-party vendors (cloud hosting, payment processing, analytics, security) receive data only as necessary to provide services. Contracts require CCPA/GDPR compliance.</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded border-l-4 border-gray-400">
                    <p className="font-semibold text-gray-900 text-sm">Legal Obligations</p>
                    <p className="text-xs text-gray-700 mt-1">Law enforcement, courts, government agencies may receive data pursuant to valid legal process (subpoena, warrant, court order).</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded border-l-4 border-gray-400">
                    <p className="font-semibold text-gray-900 text-sm">Business Transfers</p>
                    <p className="text-xs text-gray-700 mt-1">In event of merger, acquisition, bankruptcy, or sale of assets, your data may transfer to acquirer subject to this Privacy Policy or new privacy notice.</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded border-l-4 border-gray-400">
                    <p className="font-semibold text-gray-900 text-sm">De-Identified Data</p>
                    <p className="text-xs text-gray-700 mt-1">Anonymized, de-identified data may be shared for research, analytics, and business purposes without restrictions.</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded border-l-4 border-gray-400">
                    <p className="font-semibold text-gray-900 text-sm">Consent</p>
                    <p className="text-xs text-gray-700 mt-1">With explicit user consent, data may be shared for specific purposes you authorize.</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
                  <p className="text-xs text-red-900 font-semibold">NO SALE OF PERSONAL DATA: Soma does NOT sell personal data. We do NOT share data with data brokers, advertisers, or marketing firms.</p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">9.7 International Data Transfers</h3>

                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  Soma's infrastructure may be located in the United States. If you are located outside the US:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li><strong>Data Transfer Acknowledgment:</strong> You acknowledge that transferring data to the US constitutes a transfer of data to a jurisdiction with different privacy laws</li>
                  <li><strong>Data Transfer Mechanisms:</strong> Soma uses EU Standard Contractual Clauses (SCCs), Data Transfer Impact Assessments, and other mechanisms compliant with GDPR</li>
                  <li><strong>Adequacy Decisions:</strong> Where applicable, transfers rely on EU adequacy decisions or supplementary measures</li>
                  <li><strong>Your Consent:</strong> By using Soma, you consent to data transfer to the United States subject to this Privacy Policy</li>
                </ul>

                <p className="text-sm text-gray-600 italic">
                  For full privacy details, please see our <Link to="/legal/privacy-policy" className="text-blue-600 hover:underline font-semibold">Privacy Policy</Link>.
                </p>
              </section>

              {/* SECTION 10: Subscription and Payment Terms */}
              <section id="section-10" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  10. Subscription and Payment Terms
                </h2>

                <p className="text-gray-700 leading-relaxed mb-6">
                  <strong>This Section 10 establishes the terms governing subscriptions, recurring billing, payments, refunds, and billing-related disputes.</strong> Payment processing is governed by Stripe and PayPal terms of service in addition to these Terms.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">10.1 Subscription Plans and Pricing</h3>

                <h4 className="font-semibold text-gray-900 text-sm mt-4 mb-3">10.1.1 Available Subscription Tiers</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  Soma offers the following subscription tiers (pricing in USD):
                </p>

                <div className="space-y-2 mb-6">
                  <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
                    <p className="font-semibold text-gray-900 text-sm">Free Tier - $0/month</p>
                    <p className="text-xs text-gray-700">Limited access to core features, 5 GB storage, 1 import per month, community support only, optional upgrade path</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
                    <p className="font-semibold text-gray-900 text-sm">Pro Tier - $15/month (or $150/year with 20% discount)</p>
                    <p className="text-xs text-gray-700">Advanced AI personalization, unlimited imports, 100 GB storage, priority email support, custom data exports, API access</p>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded border-l-4 border-indigo-500">
                    <p className="font-semibold text-gray-900 text-sm">Enterprise Tier - $49/month (or $490/year with 20% discount)</p>
                    <p className="text-xs text-gray-700">All Pro features, 1 TB storage, 24/7 phone/chat support, dedicated account manager, SLA guarantee (99.9% uptime), advanced analytics, compliance audit support</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-2">⚠️ Important Pricing Note:</p>
                  <p className="text-xs text-yellow-800">All prices are in US dollars and subject to change with 30 calendar days written notice. Continued use after notice period constitutes acceptance of new pricing.</p>
                </div>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">10.1.2 Free Trial Offers</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  Soma may offer free trial periods for new users. Trial terms:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li>Trial period duration determined at sign-up (typically 7-30 days)</li>
                  <li>No payment required during trial unless explicitly authorized</li>
                  <li>Automatic conversion to paid subscription unless cancelled before trial end</li>
                  <li>Cancellation available anytime through account settings; no penalty</li>
                  <li>User will receive email reminder 3 days before trial expiration</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">10.2 Billing and Payment Processing</h3>

                <h4 className="font-semibold text-gray-900 text-sm mt-4 mb-3">10.2.1 Payment Authorization and Methods</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  By subscribing, you authorize Soma to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li>Charge your selected payment method on file recurring subscription fees on the billing anniversary date</li>
                  <li>Process payments through Stripe, PayPal, or other PCI-DSS compliant payment processors</li>
                  <li>Update billing information from payment processors as needed</li>
                  <li>Contact your financial institution for payment authorization</li>
                  <li>Reauthorize payment methods as required by payment networks (e.g., 3-D Secure verification)</li>
                </ul>

                <p className="text-sm text-gray-700 leading-relaxed mb-6">
                  Accepted payment methods include major credit cards (Visa, Mastercard, American Express, Discover), debit cards, PayPal, and Apple Pay. Soma stores payment information with PCI Level 1 compliant processors; Soma does NOT store full credit card numbers.
                </p>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">10.2.2 Billing Cycles and Renewal</h4>

                <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6 space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Annual Billing</p>
                    <p className="text-xs text-gray-700">If you select annual billing, you will be charged the full annual fee ($150 Pro, $490 Enterprise) on the billing anniversary. 20% discount applied to annual plans.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Monthly Billing</p>
                    <p className="text-xs text-gray-700">If you select monthly billing, you will be charged monthly ($15 Pro, $49 Enterprise) on the same calendar day each month.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Billing Timing and Notices</p>
                    <p className="text-xs text-gray-700">You will receive a renewal invoice via email at least 7 days before your billing anniversary. If payment information has changed, you will be prompted to update it.</p>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">10.2.3 Failed Payments and Retry Logic</h4>

                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg mb-6">
                  <p className="text-sm text-orange-900 font-semibold mb-3">Payment Failure Procedure:</p>
                  <ol className="list-decimal pl-6 space-y-2 text-sm text-orange-800">
                    <li><strong>Initial Failure:</strong> Payment fails at billing time; email notification sent immediately</li>
                    <li><strong>Retry Day 3:</strong> Automatic retry 3 days after initial failure</li>
                    <li><strong>Retry Day 5:</strong> Automatic retry 5 days after initial failure</li>
                    <li><strong>Retry Day 7:</strong> Final automatic retry 7 days after initial failure</li>
                    <li><strong>After Final Failure:</strong> Account suspended 24 hours after final retry failure; data retained for 90 days</li>
                    <li><strong>Manual Update:</strong> Update payment information in account settings to resume service immediately</li>
                  </ol>
                </div>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">10.2.4 Taxes and Transaction Fees</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-6">
                  You are responsible for paying all applicable sales, use, GST/HST, VAT, and other taxes except income taxes. Soma will:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li>Add applicable sales tax to invoices based on billing address for US states with sales tax</li>
                  <li>Add applicable VAT/GST for EU and non-US jurisdictions based on verified address</li>
                  <li>Calculate tax based on your billing address at time of purchase</li>
                  <li>Provide tax invoices/receipts upon request for business purposes</li>
                </ul>

                <p className="text-sm text-gray-600">
                  <strong>No Responsibility for Bank/Card Fees:</strong> Soma is not responsible for any fees charged by your bank, credit card company, or payment processor (overdraft fees, foreign transaction fees, etc.).
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">10.3 Refunds and Cancellation Policy</h3>

                <h4 className="font-semibold text-gray-900 text-sm mt-4 mb-3">10.3.1 Non-Refundable Subscription Model</h4>

                <div className="bg-red-50 border border-red-300 rounded-lg p-6 mb-6">
                  <p className="text-sm text-red-900 font-semibold mb-3">⚠️ NO REFUNDS POLICY</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-3">
                    <strong>Subscriptions are non-refundable.</strong> By subscribing, you acknowledge that Soma is a digital service with immediate access and no refunds can be issued once service begins. This includes:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-red-800">
                    <li>No refunds for partial months or unused time</li>
                    <li>No refunds for early cancellation</li>
                    <li>No refunds for change of mind or change in circumstances</li>
                    <li>No refunds for voluntary account deletion</li>
                    <li>No proration of annual subscriptions if cancelled mid-year</li>
                  </ul>
                </div>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">10.3.2 Limited Exceptions to No-Refund Policy</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  Refunds may be considered in these limited circumstances (no guarantee):
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li><strong>Duplicate Charges:</strong> Accidental double-charge within 30 days (full refund of duplicate charge)</li>
                  <li><strong>Technical Failure:</strong> Soma billing system error causing incorrect charge (refund of overcharge amount)</li>
                  <li><strong>Unauthorized Charges:</strong> Confirmed fraudulent transaction (full refund)</li>
                  <li><strong>Payment Processing Error:</strong> Error by payment processor (dispute with processor; Soma cooperation)</li>
                </ul>

                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  Refund requests must be submitted within 30 days of charge. Requests submitted after 30 days are unlikely to be approved. Contact legal@soma.app with proof of error.
                </p>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">10.3.3 Cancellation Process</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  To cancel your subscription:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li>Log in to your Soma account</li>
                  <li>Navigate to Settings → Billing & Subscription</li>
                  <li>Click "Cancel Subscription"</li>
                  <li>Select reason for cancellation (optional feedback)</li>
                  <li>Confirm cancellation</li>
                  <li>You will receive confirmation email within 24 hours</li>
                  <li>Cancellation effective at end of current billing cycle</li>
                </ol>

                <p className="text-sm text-gray-700 leading-relaxed mb-6">
                  <strong>Downgrade Upon Cancellation:</strong> Upon cancellation of Pro or Enterprise tier, your account automatically downgrades to Free tier on the renewal date. Your User Content and account data remain accessible unless separately deleted.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">10.4 Subscription Price Changes</h3>

                <h4 className="font-semibold text-gray-900 text-sm mt-4 mb-3">10.4.1 Notice of Price Changes</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  Soma may change subscription pricing at any time with 30 calendar days' advance written notice. Notice will be provided via:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700 mb-6">
                  <li>Email to the address associated with your account</li>
                  <li>In-app notification displayed prominently in account settings</li>
                  <li>Updated pricing page at soma.app/pricing</li>
                </ul>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">10.4.2 Effective Date and Acceptance</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  <strong>Price changes apply only to NEW renewal periods.</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li>Current billing cycle continues at old price</li>
                  <li>New price takes effect on your next billing anniversary</li>
                  <li>Pre-notice cancellation: Cancel before price increase takes effect to avoid new price</li>
                  <li>Acceptance by continued use: Continuing subscription after price increase notice date constitutes acceptance of new pricing</li>
                  <li>Right to cancel: You may cancel anytime to avoid new price, effective end of current cycle</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">10.5 Add-On Purchases and Enhanced Services</h3>

                <h4 className="font-semibold text-gray-900 text-sm mt-4 mb-3">10.5.1 Optional Add-On Features</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  Soma offers optional add-ons for additional fees:
                </p>

                <div className="space-y-2 mb-6">
                  <div className="bg-white border border-gray-300 p-3 rounded">
                    <p className="font-semibold text-sm text-gray-900">Voice Cloning Module - $29/month</p>
                    <p className="text-xs text-gray-700">Advanced voice synthesis with persona-specific voice replication, unlimited generation minutes, high-quality audio output</p>
                  </div>

                  <div className="bg-white border border-gray-300 p-3 rounded">
                    <p className="font-semibold text-sm text-gray-900">Memory Books (Printed) - $49 per book</p>
                    <p className="text-xs text-gray-700">Custom printed memory book with selected conversations and photos, 8x10 hardcover format, 100-300 pages depending on content</p>
                  </div>

                  <div className="bg-white border border-gray-300 p-3 rounded">
                    <p className="font-semibold text-sm text-gray-900">Advanced Analytics - $19/month</p>
                    <p className="text-xs text-gray-700">Detailed conversation analytics, communication pattern insights, sentiment analysis, usage trends</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 italic">
                  Add-on purchases are separate from subscription, subject to same non-refund policy, and may be cancelled independently through account settings.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">10.6 Invoices and Billing Records</h3>

                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  <strong>Invoice Generation and Retention:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li>Invoices generated automatically upon successful payment and available in account settings</li>
                  <li>Electronic invoices are legal and binding (UCC § 2-201 where applicable)</li>
                  <li>Invoices retained for 7 years for tax and audit compliance</li>
                  <li>VAT invoices provided for EU transactions upon request</li>
                  <li>You may request invoices via billing@soma.app</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">10.7 Dispute Resolution for Billing</h3>

                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  <strong>Billing Disputes:</strong> If you believe you have been incorrectly charged:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li>Contact Soma at billing@soma.app with description of disputed charge and supporting evidence</li>
                  <li>Include transaction date, amount, and order number</li>
                  <li>Soma will investigate within 5 business days</li>
                  <li>If error confirmed, Soma will process refund within 10 business days</li>
                  <li>For credit card disputes, you may file chargeback with your credit card company</li>
                  <li>Frequent chargebacks may result in account termination</li>
                </ol>

                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                  <p className="text-sm text-blue-900 font-semibold mb-2">Consumer Rights Notice (Telemarketing Sales Rule):</p>
                  <p className="text-xs text-blue-800">You have the right to charge back recurring billing disputes with your credit card company within 120 days of charge. Your credit card issuer may limit your liability for unauthorized charges to $50.</p>
                </div>
              </section>

              {/* SECTION 11: Termination and Suspension */}
              <section id="section-11" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  11. Termination and Suspension
                </h2>

                <p className="text-gray-700 leading-relaxed mb-6">
                  <strong>This Section 11 governs the termination and suspension of accounts and Services, including grounds for termination, procedures, data handling, and appeal rights.</strong>
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">11.1 User-Initiated Account Termination</h3>

                <h4 className="font-semibold text-gray-900 text-sm mt-4 mb-3">11.1.1 Termination Right and Procedure</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  <strong>You may terminate your account at any time without penalty or cause.</strong> To terminate:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li>Log into your Soma account</li>
                  <li>Navigate to Settings → Account Management → Delete Account</li>
                  <li>Read and acknowledge the termination warning</li>
                  <li>Select data handling option (see 11.1.2 below)</li>
                  <li>Enter your password to confirm</li>
                  <li>Click "Permanently Delete Account" to complete</li>
                  <li>Confirmation email sent to your registered email address</li>
                </ol>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">11.1.2 Data Handling Options Upon User Termination</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  When terminating your account, you must select a data handling option:
                </p>

                <div className="space-y-3 mb-6">
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 text-sm mb-2">Option 1: Soft Delete (Data Recovery Period)</h5>
                    <p className="text-xs text-gray-700 leading-relaxed mb-2">
                      Your account and data are immediately deactivated but retained for 30 days in Soma's systems for recovery purposes.
                    </p>
                    <div className="bg-white rounded p-2 text-xs text-gray-700 space-y-1">
                      <p><strong>During 30-day period:</strong></p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Account cannot be accessed; no login possible</li>
                        <li>Data not visible to you or other users</li>
                        <li>You may contact support@soma.app to cancel deletion and restore account</li>
                      </ul>
                      <p className="mt-2"><strong>After 30 days:</strong></p>
                      <ul className="list-disc pl-6">
                        <li>Data permanently deleted; account cannot be recovered</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 text-sm mb-2">Option 2: Permanent Immediate Delete</h5>
                    <p className="text-xs text-gray-700 leading-relaxed mb-2">
                      Your account and User Content are immediately and permanently deleted. <strong>This action is irreversible.</strong>
                    </p>
                    <div className="bg-white rounded p-2 text-xs text-gray-700 space-y-1">
                      <p><strong>Immediate effects:</strong></p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Account data deleted from production systems immediately</li>
                        <li>Account credentials invalidated; cannot login</li>
                        <li>User Content inaccessible to you and other users</li>
                        <li>No recovery or restoration possible</li>
                      </ul>
                      <p className="mt-2"><strong>Backup retention:</strong></p>
                      <ul className="list-disc pl-6">
                        <li>Data may remain in backup systems for 90 days (disaster recovery only)</li>
                        <li>Backup data not accessible to you; automatically deleted after 90 days</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">11.1.3 Effect on Subscription and Billing</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  Upon account termination:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li>Any active subscription automatically cancelled at end of current billing cycle</li>
                  <li>No refund issued for subscription fees already paid</li>
                  <li>Recurring charges immediately stopped</li>
                  <li>Outstanding balance (if any) remains due</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">11.2 Soma-Initiated Suspension</h3>

                <h4 className="font-semibold text-gray-900 text-sm mt-4 mb-3">11.2.1 Temporary Suspension - Grounds and Procedure</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  Soma may temporarily suspend your account (7-30 days) for:
                </p>

                <div className="space-y-2 mb-6">
                  <div className="border-l-4 border-orange-500 bg-orange-50 p-3 rounded-r-lg">
                    <p className="font-semibold text-gray-900 text-xs">Minor Terms Violations</p>
                    <p className="text-xs text-gray-700">First-time or non-critical violations of these Terms</p>
                  </div>

                  <div className="border-l-4 border-orange-500 bg-orange-50 p-3 rounded-r-lg">
                    <p className="font-semibold text-gray-900 text-xs">Non-Payment</p>
                    <p className="text-xs text-gray-700">Failed subscription payment after retry procedure complete</p>
                  </div>

                  <div className="border-l-4 border-orange-500 bg-orange-50 p-3 rounded-r-lg">
                    <p className="font-semibold text-gray-900 text-xs">Investigation Needs</p>
                    <p className="text-xs text-gray-700">Temporary freeze while investigating potential violations</p>
                  </div>

                  <div className="border-l-4 border-orange-500 bg-orange-50 p-3 rounded-r-lg">
                    <p className="font-semibold text-gray-900 text-xs">Account Security</p>
                    <p className="text-xs text-gray-700">Suspected unauthorized access or compromised credentials</p>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">11.2.2 Permanent Termination - Grounds and Immediate Termination</h4>

                <div className="bg-red-50 border border-red-300 rounded-lg p-6 mb-6">
                  <p className="text-sm text-red-900 font-semibold mb-3">⚠️ IMMEDIATE TERMINATION WITHOUT NOTICE</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-3">
                    Soma may immediately and permanently terminate your account without notice for:
                  </p>

                  <div className="space-y-2 text-sm text-red-800">
                    <div>
                      <p className="font-semibold">🔴 Severe Legal Violations:</p>
                      <ul className="list-disc pl-6 text-xs mt-1">
                        <li>Child exploitation content (CSAM), child grooming, or child abuse material</li>
                        <li>Illegal activity, criminal conduct, or regulatory violations</li>
                        <li>Threats of violence, terrorism, or armed insurrection</li>
                        <li>Human trafficking, forced labor, or modern slavery</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold">🔴 Terms Violations:</p>
                      <ul className="list-disc pl-6 text-xs mt-1">
                        <li>Violation of Section 3 (Eligibility) - Age requirements, COPPA violations</li>
                        <li>Violation of Section 6 (Prohibited Conduct) - Illegal activity, harmful content, abuse</li>
                        <li>Violation of Section 7 (Third-Party Services) - Unauthorized data access, credential sharing</li>
                        <li>Multiple suspensions for repeated violations</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold">🔴 Fraud and Abuse:</p>
                      <ul className="list-disc pl-6 text-xs mt-1">
                        <li>Account fraud, identity fraud, or payment fraud</li>
                        <li>Repeated chargebacks or disputes</li>
                        <li>System abuse (scraping, API abuse, reverse engineering)</li>
                        <li>Multiple account creation to evade suspensions</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold">🔴 Security Threats:</p>
                      <ul className="list-disc pl-6 text-xs mt-1">
                        <li>Hacking attempts or security exploitation</li>
                        <li>Malware distribution or ransomware</li>
                        <li>Botnet activity or automated abuse</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">11.3 Suspension vs. Termination Comparison</h3>

                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="p-3 text-left font-semibold">Aspect</th>
                        <th className="p-3 text-left font-semibold">Temporary Suspension</th>
                        <th className="p-3 text-left font-semibold">Permanent Termination</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3"><strong>Duration</strong></td>
                        <td className="p-3">7-30 days (Soma discretion)</td>
                        <td className="p-3">Permanent; irreversible</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3"><strong>Data Access</strong></td>
                        <td className="p-3">Account locked; data retained</td>
                        <td className="p-3">Data deleted (or recoverable for 30 days with soft delete)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3"><strong>Recovery</strong></td>
                        <td className="p-3">Automatic or upon appeal approval</td>
                        <td className="p-3">Possible only within 30 days if soft delete option chosen</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3"><strong>Appeal Right</strong></td>
                        <td className="p-3">Full appeal available</td>
                        <td className="p-3">Limited to legal/procedural grounds only</td>
                      </tr>
                      <tr>
                        <td className="p-3"><strong>Notice Required</strong></td>
                        <td className="p-3">Usually 24 hours before suspension</td>
                        <td className="p-3">No notice required (immediate termination)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">11.4 Data Recovery After Account Termination</h3>

                <h4 className="font-semibold text-gray-900 text-sm mt-4 mb-3">11.4.1 Permanent Delete Option - No Recovery</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-6">
                  <strong>If you selected "Permanent Immediate Delete," data recovery is not possible.</strong> Data is irreversibly destroyed and cannot be recovered for any reason.
                </p>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">11.4.2 Soft Delete Option - 30-Day Recovery Window</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  If you selected "Soft Delete," you may recover your data within 30 days:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li>Contact support@soma.app with subject "Account Recovery Request"</li>
                  <li>Provide your registered email or phone number</li>
                  <li>Verify account ownership via confirmation link</li>
                  <li>Soma will restore account within 24 business hours</li>
                  <li>All data restored; account active again</li>
                </ol>

                <p className="text-sm text-gray-600 italic">
                  After 30 days, recovery is not possible under any circumstances. Plan data exports or recovery requests within the 30-day window.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">11.5 Effects of Termination or Suspension</h3>

                <h4 className="font-semibold text-gray-900 text-sm mt-4 mb-3">11.5.1 Immediate Effects</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  Upon account suspension or termination:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700 mb-6">
                  <li>✗ Account credentials immediately invalidated; cannot login</li>
                  <li>✗ User Content inaccessible to you and other users</li>
                  <li>✗ Subscription automatically cancelled</li>
                  <li>✗ Any active OAuth integrations immediately revoked</li>
                  <li>✗ API keys and access tokens deactivated</li>
                  <li>✗ Any pending data exports cancelled</li>
                </ul>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">11.5.2 Surviving Obligations</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  The following obligations survive termination and remain in effect:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700 mb-6">
                  <li>Payment obligations for fees already incurred</li>
                  <li>Indemnification obligations (Section 15)</li>
                  <li>Limitation of liability (Section 13)</li>
                  <li>Governing law and arbitration (Sections 14 & 16)</li>
                  <li>Confidentiality obligations regarding Soma intellectual property</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">11.6 Appeal and Review Process</h3>

                <h4 className="font-semibold text-gray-900 text-sm mt-4 mb-3">11.6.1 Suspension Appeal Process</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  If your account is suspended, you may appeal within 14 calendar days:
                </p>

                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6 space-y-2">
                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600">1.</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Submit Appeal</p>
                      <p className="text-xs text-gray-700">Email appeals@soma.ai with subject "Account Suspension Appeal" within 14 days of suspension notice</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600">2.</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Provide Evidence</p>
                      <p className="text-xs text-gray-700">Include detailed explanation of why suspension is in error, supporting documents, screenshots, or other evidence</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600">3.</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Soma Review</p>
                      <p className="text-xs text-gray-700">Soma will investigate your appeal and respond within 7 business days</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600">4.</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Appeal Decision</p>
                      <p className="text-xs text-gray-700">Suspension will be lifted, maintained, or converted to termination based on investigation findings</p>
                    </div>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 text-sm mt-6 mb-3">11.6.2 Termination Appeal Limitations</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  For permanent termination, appeals are very limited:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700 mb-6">
                  <li>Appeals accepted only if you can demonstrate clear mistaken identity or account hacking</li>
                  <li>Appeals for severe violations (CSAM, illegal activity) will be automatically denied</li>
                  <li>Appeals for repeated violations after suspension unlikely to succeed</li>
                  <li>Submit appeals to appeals@soma.ai with proof of error; respond within 14 days</li>
                </ul>

                <p className="text-sm text-gray-600 italic">
                  Soma reserves the right to deny appeals in its sole discretion. Appeal process does not guarantee account restoration.
                </p>
              </section>

              {/* SECTION 12: Disclaimers of Warranties */}
              <section id="section-12" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  12. Disclaimers of Warranties and Service Limitations
                </h2>

                <p className="text-gray-700 leading-relaxed mb-6">
                  <strong>This Section 12 establishes that Soma provides services "AS-IS" without warranties. These disclaimers are critical and legally binding.</strong>
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">12.1 "AS-IS" AND "AS-AVAILABLE" Disclaimer</h3>

                <div className="bg-red-50 border border-red-300 rounded-lg p-6 mb-6">
                  <p className="text-sm text-red-900 font-bold mb-3">⚠️ CRITICAL LEGAL NOTICE - READ CAREFULLY</p>
                  <p className="text-sm text-red-800 leading-relaxed font-semibold mb-4">
                    THE SERVICES AND ALL CONTENT, FEATURES, AND FUNCTIONALITY (INCLUDING USER CONTENT, AI-GENERATED CONTENT, AND THIRD-PARTY INTEGRATIONS) ARE PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                  </p>
                  <p className="text-sm text-red-800 leading-relaxed mb-3">
                    Soma expressly disclaims, and you acknowledge, that:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-red-800">
                    <li>Services may contain errors, bugs, interruptions, or failures</li>
                    <li>Services may be unavailable at any time for maintenance, updates, or emergencies</li>
                    <li>Services are not error-free or completely reliable</li>
                    <li>Services may not be suitable for your specific needs or purposes</li>
                    <li>Services may contain viruses, malware, or harmful code despite security efforts</li>
                    <li>Data transmission may be intercepted or corrupted</li>
                    <li>Third-party services may be unavailable or unreliable</li>
                    <li>AI-generated content may be inaccurate, harmful, biased, or unsuitable</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">12.2 Disclaimer of Implied Warranties</h3>

                <div className="bg-orange-50 border border-orange-300 rounded-lg p-6 mb-6">
                  <p className="text-sm text-orange-900 font-semibold mb-3">NO IMPLIED WARRANTIES</p>
                  <p className="text-sm text-orange-800 leading-relaxed mb-3">
                    SOMA DISCLAIMS ALL IMPLIED WARRANTIES TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, INCLUDING:
                  </p>

                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded border-l-4 border-orange-500">
                      <p className="font-semibold text-gray-900 text-sm">1. Merchantability</p>
                      <p className="text-xs text-gray-700">The Services are not warranted to be fit for sale, resale, or general use in commerce</p>
                    </div>

                    <div className="bg-white p-3 rounded border-l-4 border-orange-500">
                      <p className="font-semibold text-gray-900 text-sm">2. Fitness for a Particular Purpose</p>
                      <p className="text-xs text-gray-700">The Services may not be suitable for your specific intended purposes, uses, or business needs</p>
                    </div>

                    <div className="bg-white p-3 rounded border-l-4 border-orange-500">
                      <p className="font-semibold text-gray-900 text-sm">3. Non-Infringement</p>
                      <p className="text-xs text-gray-700">The Services do not warrant freedom from third-party intellectual property claims or infringement</p>
                    </div>

                    <div className="bg-white p-3 rounded border-l-4 border-orange-500">
                      <p className="font-semibold text-gray-900 text-sm">4. Title and Ownership</p>
                      <p className="text-xs text-gray-700">Soma does not warrant clear title to or rightful ownership of any content in the Services</p>
                    </div>

                    <div className="bg-white p-3 rounded border-l-4 border-orange-500">
                      <p className="font-semibold text-gray-900 text-sm">5. Quiet Enjoyment</p>
                      <p className="text-xs text-gray-700">Soma does not warrant uninterrupted use or freedom from interference or third-party claims</p>
                    </div>

                    <div className="bg-white p-3 rounded border-l-4 border-orange-500">
                      <p className="font-semibold text-gray-900 text-sm">6. Accuracy and Completeness</p>
                      <p className="text-xs text-gray-700">The Services do not warrant accuracy, completeness, reliability, or truthfulness of any content or data</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">12.3 AI-Generated Content - Specific Disclaimers</h3>

                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  <strong>Regarding AI-Generated Content, Soma makes NO warranties for:</strong>
                </p>

                <div className="space-y-2 mb-6">
                  <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
                    <p className="font-semibold text-gray-900 text-sm">Accuracy or Truthfulness</p>
                    <p className="text-xs text-gray-700">AI may generate false, misleading, or completely fabricated information. AI outputs are not fact-checked and may contain "hallucinations."</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
                    <p className="font-semibold text-gray-900 text-sm">Personality Fidelity or Authenticity</p>
                    <p className="text-xs text-gray-700">AI-generated responses may not accurately represent actual personality, communication style, or authentic expression.</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
                    <p className="font-semibold text-gray-900 text-sm">Consistency</p>
                    <p className="text-xs text-gray-700">Identical inputs may produce different outputs at different times. AI behavior is probabilistic, not deterministic.</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
                    <p className="font-semibold text-gray-900 text-sm">Absence of Bias or Harmful Content</p>
                    <p className="text-xs text-gray-700">AI may generate biased, discriminatory, offensive, or otherwise harmful outputs despite Soma's mitigation efforts.</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
                    <p className="font-semibold text-gray-900 text-sm">Suitability for Consequential Decisions</p>
                    <p className="text-xs text-gray-700">AI responses are not suitable for medical, legal, financial, psychological, or other critical decisions. Consult professionals.</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
                    <p className="font-semibold text-gray-900 text-sm">Sentiment or Emotional Authenticity</p>
                    <p className="text-xs text-gray-700">AI-generated expressions of emotion, sentiment, or connection are mathematically optimized patterns, not authentic feelings.</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
                    <p className="font-semibold text-gray-900 text-sm">Privacy of Imported Data</p>
                    <p className="text-xs text-gray-700">Soma does not warrant that imported third-party data was legitimately acquired or does not violate third-party rights.</p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">12.4 No Professional Services or Advice</h3>

                <div className="bg-blue-50 border border-blue-300 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-3 text-sm">Soma is NOT:</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2 text-sm">
                      <span className="text-blue-600 font-bold">✗</span>
                      <span className="text-blue-800"><strong>Medical Provider:</strong> Not a doctor, psychiatrist, psychologist, or mental health professional. AI responses are not medical advice. Consult physicians for health concerns.</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-blue-600 font-bold">✗</span>
                      <span className="text-blue-800"><strong>Legal Counsel:</strong> Not a lawyer. AI responses are not legal advice, legal opinions, or attorney-client communications. Consult attorneys for legal matters.</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-blue-600 font-bold">✗</span>
                      <span className="text-blue-800"><strong>Financial Advisor:</strong> Not a certified financial planner, investment advisor, or securities professional. AI responses are not financial advice. Consult financial professionals.</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-blue-600 font-bold">✗</span>
                      <span className="text-blue-800"><strong>Therapist/Counselor:</strong> Not a licensed therapist or grief counselor. AI cannot provide therapy or mental health treatment. Seek professional mental health support.</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-blue-600 font-bold">✗</span>
                      <span className="text-blue-800"><strong>Crisis Support:</strong> Not a crisis line or emergency service. For emergencies, contact 911 or crisis services: 988 (US Suicide Prevention Lifeline).</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">12.5 Third-Party Services - No Warranties</h3>

                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  <strong>Soma does not provide warranties for any third-party services, including:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li><strong>Google Services:</strong> Gmail, Google Drive, Google Photos - Soma not responsible for Google availability, data integrity, or compliance</li>
                  <li><strong>Instagram Integration:</strong> Soma not responsible for Instagram data exports, accuracy, or Instagram service reliability</li>
                  <li><strong>WeChat Integration:</strong> Soma not responsible for WeChat decryption accuracy, completeness, or WeChat service changes</li>
                  <li><strong>Payment Processors:</strong> Soma not responsible for Stripe/PayPal service availability, payment security, or processor actions</li>
                  <li><strong>Cloud Infrastructure:</strong> Soma not responsible for AWS/cloud provider downtime, data loss, or service issues</li>
                  <li><strong>Third-Party APIs:</strong> No warranty for reliability, availability, or compliance of third-party APIs integrated into Services</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">12.6 Data Security - Limited Warranty</h3>

                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 mb-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">⚠️ Data Security Limitations</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-3">
                    While Soma implements industry-standard security measures (encryption, access controls, audits):
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-yellow-800">
                    <li><strong>No Guarantee of Invulnerability:</strong> NO security system is 100% secure or impenetrable</li>
                    <li><strong>Breach Risk Acknowledgment:</strong> You acknowledge the inherent risks of internet-based systems and data breaches</li>
                    <li><strong>No Insurance Against Loss:</strong> Soma does not guarantee against data loss, theft, corruption, or unauthorized access</li>
                    <li><strong>Best Efforts Only:</strong> Soma uses reasonable security; breach does not automatically indicate negligence</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">12.7 User Content - No Quality Warranty</h3>

                <p className="text-sm text-gray-700 leading-relaxed mb-6">
                  Soma does not warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700 mb-6">
                  <li>Imported User Content is complete, accurate, or uncorrupted during import</li>
                  <li>Formatting, metadata, or special characters are preserved during import</li>
                  <li>Data export quality meets specific technical requirements</li>
                  <li>Third-party data imports maintain all original features or attributes</li>
                  <li>User-uploaded content will be permanently preserved or not lost due to system failure</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">12.8 Service Availability and Uptime - No Guarantee</h3>

                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  <strong>Except for Enterprise tier (which includes a 99.9% SLA), Soma makes no uptime or availability guarantees.</strong>
                </p>
                <div className="space-y-2 mb-6">
                  <div className="bg-white border border-gray-300 p-3 rounded">
                    <p className="font-semibold text-gray-900 text-sm">Free and Pro Tiers</p>
                    <p className="text-xs text-gray-700">No uptime guarantee; services available on best-effort basis; Soma may conduct maintenance with or without notice</p>
                  </div>

                  <div className="bg-white border border-gray-300 p-3 rounded">
                    <p className="font-semibold text-gray-900 text-sm">Enterprise Tier SLA</p>
                    <p className="text-xs text-gray-700">Enterprise tier includes written SLA with 99.9% uptime guarantee (8.76 hours downtime per year); see separate SLA document</p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">12.9 Disclaimer of Warranties - Summary and Integration</h3>

                <div className="bg-red-50 border border-red-300 rounded-lg p-6">
                  <p className="text-sm text-red-900 font-semibold mb-3">COMPLETE DISCLAIMER</p>
                  <p className="text-sm text-red-800 leading-relaxed">
                    TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SOMA DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. THESE TERMS, TOGETHER WITH OUR PRIVACY POLICY, CONSTITUTE YOUR COMPLETE AND EXCLUSIVE AGREEMENT WITH SOMA REGARDING THE SERVICES, AND SUPERSEDE ALL PRIOR OR CONTEMPORANEOUS AGREEMENTS, REPRESENTATIONS, AND WARRANTIES.
                  </p>
                </div>
              </section>

              {/* SECTION 13: Limitation of Liability */}
              <section id="section-13" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  13. Limitation of Liability and Damages Exclusion
                </h2>

                <div className="bg-red-50 border-l-4 border-red-600 p-6 my-6 rounded-r-lg">
                  <p className="text-sm text-red-900 font-bold mb-3">⚠️ CRITICAL: LIMITATION OF LIABILITY</p>
                  <p className="text-sm text-red-800 leading-relaxed">
                    THIS SECTION SIGNIFICANTLY LIMITS SOMA'S LIABILITY AND YOUR REMEDIES. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, INCLUDING CALIFORNIA, NEW YORK, TEXAS, AND DELAWARE LAW, SOMA'S AGGREGATE LIABILITY FOR ALL CLAIMS AGAINST SOMA RESULTING FROM THESE TERMS OF SERVICE OR YOUR USE OF THE SERVICES SHALL NOT EXCEED THE AMOUNT SPECIFIED IN SECTION 13.1 BELOW, REGARDLESS OF THE LEGAL BASIS FOR THE CLAIM.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13.1 Cap on Direct Damages and Liability Threshold</h3>
                <div className="bg-red-50 border-l-4 border-red-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-red-900 font-bold mb-3">AGGREGATE LIABILITY CAP</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-4">
                    SOMA'S TOTAL CUMULATIVE LIABILITY FOR ALL CLAIMS ARISING FROM OR RELATED TO THESE TERMS, YOUR USE OF THE SERVICES, OR ANY SOMA SERVICES SHALL NOT EXCEED THE GREATER OF:
                  </p>
                  <ol className="list-decimal pl-6 space-y-2 text-sm text-red-800 mb-4">
                    <li>The total amount of fees paid by you to Soma in the 12 months immediately preceding the claim (including Free tier valued at $0); or</li>
                    <li>$100 USD</li>
                  </ol>
                  <p className="text-sm text-red-800 leading-relaxed mb-3 font-semibold">
                    IMPORTANT: This liability cap is the maximum recovery for:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-red-800">
                    <li>All contract claims, including breach of warranty, breach of service level agreements (SLAs)</li>
                    <li>All tort claims, including negligence, gross negligence, and strict liability (to the extent not prohibited by law)</li>
                    <li>All statutory claims, including violation of consumer protection laws</li>
                    <li>All indirect, consequential, and special damages</li>
                    <li>All third-party claims brought through you</li>
                  </ul>
                  <p className="text-xs text-red-700 mt-3 italic">
                    This limitation applies regardless of whether Soma has been advised of the possibility of such damages or whether such damages are foreseeable.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13.2 Exclusion of Consequential, Incidental, and Indirect Damages</h3>
                <div className="bg-red-50 border-l-4 border-red-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-red-900 font-bold mb-3">EXCLUDED DAMAGES CATEGORIES</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-4">
                    IN NO EVENT SHALL SOMA BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, EXEMPLARY, OR TREBLE DAMAGES, OR FOR LOST PROFITS, LOST REVENUE, OR LOST DATA, REGARDLESS OF THE CAUSE OF ACTION (WHETHER IN CONTRACT, TORT, STRICT LIABILITY, OR OTHERWISE), EVEN IF SOMA HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                  </p>
                  <p className="text-sm text-red-800 leading-relaxed font-semibold mb-3">
                    Excluded damages specifically include, but are not limited to:
                  </p>
                  <div className="space-y-2 text-sm text-red-800">
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Loss of Profits:</strong> Any reduction in business revenue, anticipated earnings, expected returns, or economic gains</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Loss of Revenue:</strong> Any reduction in income, billing, sales, or other revenue streams</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Loss of Data:</strong> Deletion, corruption, or unavailability of User Content, regardless of cause</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Loss of Use:</strong> Inability to use the Services or any features thereof</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Loss of Goodwill:</strong> Damage to reputation, brand value, or business relationships</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Loss of Customers:</strong> Loss of business opportunities or customer relationships</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Business Interruption:</strong> Any disruption or cessation of normal business operations</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Cost of Substitute Services:</strong> Costs incurred to obtain alternative services or solutions</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Bodily Injury or Emotional Distress:</strong> Even if caused by Soma's negligence (except as limited by law)</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Punitive or Exemplary Damages:</strong> Damages intended to punish Soma's conduct</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13.3 Damages Exclusion Applies Independently</h3>
                <div className="bg-orange-50 border border-orange-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-orange-900 font-semibold mb-3">Independent Bases for Exclusion</p>
                  <p className="text-sm text-orange-800 leading-relaxed mb-3">
                    The exclusion of damages in Section 13.2 is INDEPENDENT of the liability cap in Section 13.1. This means:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-orange-800">
                    <li>Even if the liability cap does not apply to your claim, the damages exclusions in 13.2 still apply</li>
                    <li>You may not recover excluded damages even if they are your only available remedy</li>
                    <li>The cap and exclusion together ensure you cannot recover for indirect/consequential losses under any theory</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13.4 Exceptions to Liability Limitations (Limited)</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">Cases Where Limitations May Not Apply</p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    NOTWITHSTANDING SECTIONS 13.1 AND 13.2, THESE LIABILITY LIMITATIONS DO NOT APPLY TO:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-blue-800">
                    <li><strong>Personal Injury and Death:</strong> Claims for death, bodily injury, or physical property damage caused by Soma's gross negligence or willful misconduct (to the extent not prohibited by law)</li>
                    <li><strong>Fraudulent Misrepresentation:</strong> Liability arising from Soma's fraud, willful deception, or intentional misrepresentation</li>
                    <li><strong>Intentional Torts:</strong> Liability for intentional infliction of emotional distress or other intentional torts</li>
                    <li><strong>Indemnification Obligations:</strong> Soma's obligations to indemnify you under Section 15 (but only for third-party claims you are legally entitled to indemnification for)</li>
                    <li><strong>Breach of Confidentiality:</strong> Unauthorized use or disclosure of your confidential information (where legally actionable)</li>
                    <li><strong>Non-Waivable Statutory Rights:</strong> Liability that cannot be waived under applicable consumer protection laws (e.g., certain CCPA rights, state-specific protections)</li>
                    <li><strong>Injunctive Relief:</strong> Injunctions to prevent infringement of intellectual property or other equitable remedies (which have no monetary cap)</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13.5 State-Specific Limitations and Applicability</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">Variation by Jurisdiction</p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-3">
                    The limitations in this Section 13 are provided to the maximum extent permitted by applicable law. Your state or country may have restrictions on liability limitations. Therefore:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                    <li><strong>California Users:</strong> Notwithstanding California Civil Code § 1668, Soma's liability is limited as stated above. California users waive their statutory right to unlimited damages for non-personal injury claims (to the extent permitted by law)</li>
                    <li><strong>New York Users:</strong> Notwithstanding N.Y. Gen. Oblig. Law § 5-101 and related provisions, liability limitations apply (to the extent permitted under CPLR § 1501 et seq.)</li>
                    <li><strong>Texas Users:</strong> Texas law permits limitation of liability except for gross negligence or willful misconduct causing death or bodily injury. Our limitations comply with this standard</li>
                    <li><strong>EU/GDPR Users:</strong> GDPR does not restrict contractual liability limitations. However, if you are in an EU member state with statutory protections, those protections apply to the extent not waivable</li>
                    <li><strong>Illinois BIOMETRIC DATA:</strong> If you are an Illinois user under BIPA (Biometric Information Privacy Act), liability limitations on biometric data claims are limited to the extent BIPA allows</li>
                  </ul>
                  <p className="text-sm text-purple-800 leading-relaxed mt-3 italic">
                    If any provision of this Section 13 is found unenforceable for your jurisdiction, it shall be reformed to the maximum enforceable extent.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13.6 Data Loss and Backup Responsibility</h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-yellow-900 font-bold mb-2">CRITICAL: Your Responsibility for Data Security and Backup</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-4">
                    YOU ACKNOWLEDGE THAT YOU ARE SOLELY RESPONSIBLE FOR MAINTAINING INDEPENDENT BACKUPS OF ALL YOUR USER CONTENT. Soma provides the Services on an "as-is" basis and is not a backup or archival service. You are NOT responsible for relying on Soma's storage for your only copy of important data.
                  </p>
                  <p className="text-sm text-yellow-800 leading-relaxed font-semibold mb-3">
                    Soma is NOT liable for, and you assume all risk of:
                  </p>
                  <ol className="list-decimal pl-6 space-y-1 text-sm text-yellow-800">
                    <li>Accidental, negligent, or intentional deletion of User Content</li>
                    <li>Data loss due to Service outages, server failures, or data center incidents</li>
                    <li>Ransomware attacks, security breaches, hacking, or unauthorized access</li>
                    <li>Loss or corruption of data during account suspension or termination</li>
                    <li>Inability to access User Content due to any technical failure or Service interruption</li>
                    <li>Data loss arising from third-party integrations or API failures</li>
                    <li>Data loss for any reason, including force majeure events</li>
                  </ol>
                  <p className="text-sm text-yellow-800 leading-relaxed mt-4">
                    <strong>Required Action:</strong> We strongly recommend implementing a backup strategy that includes regular exports of your data, third-party backup services, or redundant storage. For critical data, maintain at least two independent copies stored in geographically separate locations.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13.7 Essential Terms and Acknowledgment</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">Your Acknowledgment of These Limitations</p>
                  <p className="text-sm text-indigo-800 leading-relaxed mb-3">
                    You acknowledge and agree that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-indigo-800">
                    <li>These liability limitations are essential terms of our agreement without which Soma would not provide the Services</li>
                    <li>You have had the opportunity to negotiate these limitations or to seek alternative services</li>
                    <li>The pricing and terms of the Services reflect these liability limitations</li>
                    <li>You are not relying on any promises of compensation beyond the caps stated in Section 13.1</li>
                    <li>You understand the risk allocation in these Terms and voluntarily accept it</li>
                  </ul>
                  <p className="text-xs text-indigo-700 mt-3 italic">
                    These limitations are fundamental to our relationship and cannot be modified in Soma's sole discretion. If you do not accept these terms, you must not use the Services.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13.8 Cumulative Nature and Exclusive Remedy</h3>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-gray-900 font-semibold mb-3">Exclusive Remedy Structure</p>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    The remedies in these Terms (including limitations, exclusions, and indemnification) are:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
                    <li><strong>Cumulative:</strong> Sections 13.1, 13.2, and other remedies work together to limit your recovery</li>
                    <li><strong>Exclusive:</strong> These are your sole and exclusive remedy for damages arising from these Terms or the Services</li>
                    <li><strong>Non-Substitutable:</strong> You may not combine these limitations with other legal theories or remedies to increase your recovery</li>
                  </ul>
                </div>
              </section>

              {/* SECTION 14: Dispute Resolution and Arbitration */}
              <section id="section-14" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  14. Dispute Resolution, Arbitration, and Class Action Waiver
                </h2>

                <div className="bg-red-50 border-l-4 border-red-600 p-6 my-6 rounded-r-lg">
                  <p className="text-sm text-red-900 font-bold mb-3">⚠️ CRITICAL NOTICE: BINDING ARBITRATION AND CLASS ACTION WAIVER</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-3">
                    THESE TERMS REQUIRE ALL DISPUTES TO BE RESOLVED THROUGH BINDING ARBITRATION ON AN INDIVIDUAL BASIS. BY USING SOMA, YOU WAIVE YOUR RIGHT TO SUE IN COURT AND YOUR RIGHT TO PARTICIPATE IN CLASS ACTIONS. PLEASE READ THIS SECTION CAREFULLY BEFORE AGREEING TO THESE TERMS.
                  </p>
                  <p className="text-sm text-red-800 leading-relaxed">
                    This arbitration agreement applies to disputes between you and Soma. It does not apply to small claims court disputes (if permitted in your jurisdiction) or disputes involving intellectual property infringement.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.1 Scope of Arbitration Agreement</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">Disputes Subject to Arbitration</p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    This arbitration agreement applies to ALL DISPUTES, CLAIMS, AND CONTROVERSIES, WHETHER IN CONTRACT, TORT, STATUTE, OR OTHERWISE (including claims arising from these Terms, your use of the Services, third-party services, or any product or service related to Soma), arising between:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-blue-800">
                    <li>You and Soma (and its officers, directors, employees, and agents)</li>
                    <li>You and Soma's service providers or partners (where Soma is the agreed dispute resolver)</li>
                    <li>You and anyone acting on behalf of Soma</li>
                  </ul>
                  <p className="text-sm text-blue-800 leading-relaxed mt-3 font-semibold">
                    Disputes include:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-blue-800">
                    <li>Contract disputes (breach of these Terms or other agreements)</li>
                    <li>Tort disputes (negligence, fraud, intentional infliction of emotional distress, etc.)</li>
                    <li>Statutory disputes (violation of consumer protection laws, employment laws, discrimination laws)</li>
                    <li>Intellectual property disputes (except as excluded below)</li>
                    <li>Claims arising from third-party services integrated with Soma</li>
                    <li>Claims based on any regulatory violation or public policy</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.2 Informal Resolution (Mandatory Pre-Arbitration Requirement)</h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-yellow-900 font-bold mb-3">Informal Dispute Resolution Process</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-4">
                    BEFORE INITIATING ARBITRATION OR LEGAL PROCEEDINGS, YOU AND SOMA AGREE TO ATTEMPT INFORMAL RESOLUTION. THIS PROCESS IS MANDATORY AND A PREREQUISITE TO ARBITRATION.
                  </p>
                  <p className="text-sm text-yellow-800 leading-relaxed font-semibold mb-3">
                    Step-by-step informal resolution procedure:
                  </p>
                  <ol className="list-decimal pl-6 space-y-3 text-sm text-yellow-800">
                    <li>
                      <strong>Send Notice of Dispute:</strong> Send written notice describing the dispute, your claim, and requested remedy to disputes@soma.ai with subject line "NOTICE OF DISPUTE." Include:
                      <ul className="list-disc pl-6 mt-1 space-y-1 text-xs">
                        <li>Your full name and account email address</li>
                        <li>Detailed description of the dispute and facts</li>
                        <li>Specific provision(s) of these Terms you believe Soma violated (if applicable)</li>
                        <li>Requested remedy (refund, specific performance, damages, etc.)</li>
                        <li>Amount claimed (if monetary)</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Soma's Response:</strong> Within 30 calendar days of receiving your notice, Soma will respond with:
                      <ul className="list-disc pl-6 mt-1 space-y-1 text-xs">
                        <li>Its position on the dispute</li>
                        <li>Proposed resolution or explanation of why it disagrees</li>
                        <li>If applicable, alternative remedies or compromise offer</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Negotiation Period:</strong> Within 60 days of Soma's response, you and Soma agree to engage in good faith negotiation to resolve the dispute. Either party may propose a reasonable settlement conference via phone, video, or in person.
                    </li>
                    <li>
                      <strong>Escalation (if unresolved):</strong> If unresolved after 60 days, either party may initiate arbitration as described below.
                    </li>
                  </ol>
                  <p className="text-xs text-yellow-700 mt-3 italic">
                    Failure to follow this informal process may be raised as a defense in arbitration and may affect the arbitrator's award of costs.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.3 Binding Arbitration Agreement</h3>
                <div className="bg-red-50 border-l-4 border-red-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-red-900 font-bold mb-3">AGREEMENT TO ARBITRATE</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-4">
                    IF INFORMAL RESOLUTION FAILS, YOU AND SOMA AGREE THAT ALL DISPUTES SHALL BE RESOLVED BY FINAL AND BINDING ARBITRATION. YOU WAIVE YOUR RIGHT TO:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-red-800 mb-4">
                    <li>Sue Soma in court or before any government agency</li>
                    <li>Have a jury trial or judge-tried case</li>
                    <li>Participate in a class action or class arbitration</li>
                    <li>Have discovery as broad as permitted in court</li>
                    <li>Have an appeal to a higher court (except as permitted by AAA rules)</li>
                  </ul>
                  <p className="text-sm text-red-800 leading-relaxed">
                    Arbitration is a faster, less formal alternative to court litigation. Soma and you each pay an arbitrator to decide your dispute instead of a judge or jury.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.4 Arbitration Procedures Under AAA Consumer Arbitration Rules</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">Detailed Arbitration Process</p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    Arbitration will be administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules and the Supplementary Procedures for Consumer Arbitration (effective December 1, 2022), as modified by these Terms.
                  </p>
                  
                  <div className="space-y-4 mt-4">
                    <div className="border-l-4 border-blue-400 pl-4">
                      <p className="font-semibold text-sm text-blue-900">Arbitrator Selection and Qualifications</p>
                      <p className="text-sm text-blue-800 mt-1">
                        A single neutral arbitrator will be selected under AAA rules. The arbitrator must:
                      </p>
                      <ul className="list-disc pl-6 mt-1 space-y-1 text-xs text-blue-800">
                        <li>Be a retired judge or experienced attorney</li>
                        <li>Have no conflicts of interest with either party</li>
                        <li>Be bound by the arbitrator's oath of confidentiality</li>
                        <li>Have authority to award all remedies available in court under applicable law</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-blue-400 pl-4">
                      <p className="font-semibold text-sm text-blue-900">Location and Format</p>
                      <p className="text-sm text-blue-800 mt-1">
                        Arbitration will be conducted:
                      </p>
                      <ul className="list-disc pl-6 mt-1 space-y-1 text-xs text-blue-800">
                        <li><strong>Location:</strong> In the county where you reside (or where you primarily work), or online via video if agreed by both parties</li>
                        <li><strong>Format:</strong> Hearing may be conducted by telephone, video conference, or in-person, as agreed</li>
                        <li><strong>Rules:</strong> AAA Consumer Arbitration Rules will apply, unless these Terms provide different rules</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-blue-400 pl-4">
                      <p className="font-semibold text-sm text-blue-900">Costs and Fee Allocation</p>
                      <p className="text-sm text-blue-800 mt-1">
                        <strong>For Claims Under $75,000:</strong>
                      </p>
                      <ul className="list-disc pl-6 mt-1 space-y-1 text-xs text-blue-800">
                        <li>Soma will pay the AAA filing fee, all arbitrator fees, and all AAA administrative costs</li>
                        <li>You will pay your own attorney's fees (unless you prevail and applicable law permits recovery)</li>
                        <li>Either party may recover reasonable attorney's fees if authorized by applicable law</li>
                      </ul>
                      <p className="text-sm text-blue-800 mt-2">
                        <strong>For Claims Over $75,000:</strong>
                      </p>
                      <ul className="list-disc pl-6 mt-1 space-y-1 text-xs text-blue-800">
                        <li>Costs will be allocated pursuant to AAA Consumer Arbitration Rules</li>
                        <li>Soma will not require you to pay Soma's share of costs or fees in advance</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-blue-400 pl-4">
                      <p className="font-semibold text-sm text-blue-900">Arbitrator's Authority and Remedies</p>
                      <p className="text-sm text-blue-800 mt-1">
                        The arbitrator may:
                      </p>
                      <ul className="list-disc pl-6 mt-1 space-y-1 text-xs text-blue-800">
                        <li>Award any remedy that would be available under applicable law (contract damages, tort damages, statutory damages)</li>
                        <li>Award attorney's fees and costs if authorized by applicable law</li>
                        <li>Award injunctive relief to prevent infringement or misuse</li>
                        <li>But the arbitrator may NOT:</li>
                        <li className="ml-6">Consolidate claims of multiple parties</li>
                        <li className="ml-6">Proceed on a class-wide or representative basis</li>
                        <li className="ml-6">Award punitive damages beyond what applicable law permits</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-blue-400 pl-4">
                      <p className="font-semibold text-sm text-blue-900">Discovery and Evidence</p>
                      <p className="text-sm text-blue-800 mt-1">
                        Discovery will be limited as follows (per AAA Consumer Rules):
                      </p>
                      <ul className="list-disc pl-6 mt-1 space-y-1 text-xs text-blue-800">
                        <li>Each party may request production of relevant documents and written interrogatories</li>
                        <li>Depositions permitted only with arbitrator approval (limited to 2 per side)</li>
                        <li>Subpoena power available to compel witness testimony</li>
                        <li>Discovery is narrower and faster than in civil litigation</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-blue-400 pl-4">
                      <p className="font-semibold text-sm text-blue-900">Arbitration Award and Finality</p>
                      <p className="text-sm text-blue-800 mt-1">
                        <strong>Award:</strong> The arbitrator will issue a written award stating the reasoning and award. The award is binding and final.
                      </p>
                      <p className="text-sm text-blue-800 mt-2">
                        <strong>Judgment:</strong> Either party may enter judgment on the arbitration award in any court of competent jurisdiction.
                      </p>
                      <p className="text-sm text-blue-800 mt-2">
                        <strong>Limited Appeal:</strong> An arbitration award may be vacated only on very limited grounds under the Federal Arbitration Act (9 U.S.C. § 10) or applicable state arbitration law.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.5 Class Action Waiver</h3>
                <div className="bg-red-50 border-l-4 border-red-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-red-900 font-bold mb-3">CRITICAL: YOU WAIVE THE RIGHT TO PARTICIPATE IN CLASS ACTIONS</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-4">
                    YOU AGREE THAT ARBITRATION SHALL BE CONDUCTED ON AN INDIVIDUAL BASIS ONLY. YOU EXPRESSLY WAIVE ANY RIGHT TO:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-red-800 mb-4">
                    <li>Participate in class actions or collective actions against Soma</li>
                    <li>Participate in class arbitrations or collective arbitrations</li>
                    <li>Participate in representative actions authorized by law (e.g., PAGA claims in California)</li>
                    <li>Join as a claimant with other users' claims</li>
                    <li>Consolidate your claim with other claims in arbitration</li>
                    <li>Participate in any proceeding where you are not a named individual party</li>
                  </ul>
                  <div className="bg-red-100 border-l-4 border-red-600 p-3 my-3 rounded-r">
                    <p className="text-xs text-red-900 font-semibold">
                      What This Means: Even if Soma's conduct affects thousands of users, each user must pursue their individual claim separately. You cannot join a class action lawsuit against Soma. This waiver applies to all claims, regardless of potential damages.
                    </p>
                  </div>
                  <p className="text-sm text-red-800 leading-relaxed mt-3">
                    <strong>Severability of Class Waiver:</strong> If a court or arbitrator finds this class action waiver unenforceable or invalid, the entire arbitration agreement shall be unenforceable, and your dispute will proceed in court (not arbitration) on an individual basis.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.6 Exceptions to Arbitration (Limited)</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">Disputes NOT Subject to Arbitration</p>
                  <p className="text-sm text-green-800 leading-relaxed mb-3">
                    The following disputes MAY be brought in court rather than arbitration:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                    <li><strong>Small Claims Court (where available):</strong> Individual claims for amounts less than $5,000 may be brought in small claims court at your election (but not if arbitration would be more convenient or cost-effective). However, if the claim exceeds small claims jurisdiction, it must proceed to arbitration.</li>
                    <li><strong>Intellectual Property Infringement (Limited Exception):</strong> Claims alleging direct infringement of Soma's intellectual property rights (not your User Content) may proceed in court for injunctive relief purposes, but damage claims must still be arbitrated.</li>
                    <li><strong>Emergency Injunctive Relief:</strong> Either party may seek provisional injunctive relief in court to prevent irreparable harm while the arbitration is pending (e.g., to prevent data deletion or misuse). The court may grant injunctive relief pending arbitration resolution.</li>
                    <li><strong>Collection Actions by Soma:</strong> Soma may pursue collection of unpaid subscription fees and other payment obligations in court without first arbitrating (but you may still counterclaim and request arbitration of related disputes).</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.7 Governing Law and Arbitration Venue</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">Applicable Law and Arbitration Authority</p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-3">
                    <strong>Governing Law:</strong> These Terms and all disputes arising from them shall be governed by the laws of the State of Delaware, without regard to conflict of law principles. Delaware law will apply to interpretation of the Terms and the arbitration agreement.
                  </p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-3">
                    <strong>Arbitration Authority:</strong> This arbitration agreement is governed by the Federal Arbitration Act (FAA), 9 U.S.C. §§ 1-16, which applies to all transactions affecting interstate commerce. The FAA preempts conflicting state law.
                  </p>
                  <p className="text-sm text-purple-800 leading-relaxed">
                    <strong>Arbitrator's Authority:</strong> The arbitrator shall apply applicable substantive law (including Delaware law) to the merits of any claim. The arbitrator is not bound by judicial precedent but shall respect applicable law.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.8 Modification and Severability of Arbitration Clause</h3>
                <div className="bg-orange-50 border border-orange-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-orange-900 font-semibold mb-3">Scope of Severability</p>
                  <p className="text-sm text-orange-800 leading-relaxed mb-3">
                    <strong>If Arbitration Clause is Unenforceable:</strong> If a court or arbitrator finds any portion of Section 14 unenforceable:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-orange-800">
                    <li><strong>Partial Severability:</strong> The unenforceable portion shall be severed, and the remainder of the arbitration clause remains in effect (e.g., if class action waiver is invalid, individual arbitration remains)</li>
                    <li><strong>Complete Severability:</strong> If the entire arbitration clause is found unenforceable, your dispute shall proceed in court under Section 14.7 (Delaware law, federal jurisdiction)</li>
                    <li><strong>Reformation:</strong> If any provision is found unenforceable, it shall be reformed to the maximum extent permitted by applicable law</li>
                  </ul>
                  <p className="text-sm text-orange-800 leading-relaxed mt-3 italic">
                    Important: If the class action waiver is found invalid and unenforceable, the arbitration clause itself becomes unenforceable, and all disputes will proceed in court on an individual basis.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14.9 Your Acknowledgment and Consent</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">Critical Acknowledgment</p>
                  <p className="text-sm text-indigo-800 leading-relaxed mb-3">
                    By using Soma, you acknowledge that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-indigo-800">
                    <li>You understand this arbitration agreement and the class action waiver</li>
                    <li>You understand you are waiving important rights (jury trial, court litigation, class action participation)</li>
                    <li>You have had the opportunity to consult with an attorney before agreeing</li>
                    <li>You voluntarily and knowingly agree to arbitration and the class action waiver</li>
                    <li>These terms are essential to Soma's willingness to provide the Services</li>
                    <li>You are not relying on any promises outside these Terms</li>
                  </ul>
                </div>
              </section>

              {/* SECTION 15: Indemnification */}
              <section id="section-15" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  15. Indemnification and Compensation of Losses
                </h2>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">15.1 Your Indemnification Obligation to Soma</h3>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-6 my-6 rounded-r-lg">
                  <p className="text-sm text-orange-900 font-bold mb-3">YOU AGREE TO INDEMNIFY, DEFEND, AND HOLD HARMLESS SOMA</p>
                  <p className="text-sm text-orange-800 leading-relaxed mb-4">
                    YOU AGREE TO INDEMNIFY, DEFEND (AT SOMA'S OPTION, AT YOUR EXPENSE), AND HOLD HARMLESS SOMA INC. AND ITS AFFILIATES, AND THEIR RESPECTIVE OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, SUCCESSORS, AND ASSIGNS FROM AND AGAINST ANY AND ALL CLAIMS, LIABILITIES, DAMAGES, LOSSES, COSTS, AND EXPENSES (INCLUDING REASONABLE ATTORNEYS' FEES, COURT COSTS, AND EXPERT FEES) ARISING FROM OR RELATED TO:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-orange-800 mb-4">
                    <li><strong>Your Violation of These Terms:</strong> Your breach of any provision, representation, or warranty in these Terms of Service</li>
                    <li><strong>Your Violation of Law:</strong> Your violation of any applicable law, statute, ordinance, regulation, or rule</li>
                    <li><strong>Your Violation of Third-Party Rights:</strong> Your violation of any intellectual property rights, privacy rights, publicity rights, or other rights of any third party</li>
                    <li><strong>Your User Content:</strong> Your creation, upload, or transmission of User Content, including any harmful, defamatory, infringing, or illegal content</li>
                    <li><strong>Your Use of the Services:</strong> Your use or misuse of the Services, including your access methods and data usage</li>
                    <li><strong>Your Disputes with Third Parties:</strong> Your disputes, conflicts, or claims involving other users, third parties, or third-party services</li>
                    <li><strong>Your Intellectual Property Claims:</strong> Any claim that your User Content infringes intellectual property rights, violates privacy, or breaches confidentiality</li>
                    <li><strong>Your Account Activities:</strong> Activities conducted on or through your account, regardless of whether authorized by you</li>
                    <li><strong>Data Integration and APIs:</strong> Your use of third-party integrations, APIs, or data connections through Soma</li>
                    <li><strong>Payment Disputes:</strong> Your payment disputes, chargebacks, or payment authorization issues</li>
                  </ul>
                  <p className="text-sm text-orange-800 leading-relaxed italic">
                    This indemnification obligation survives termination of these Terms and your use of the Services.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">15.2 Indemnification Process and Procedures</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">How Indemnification Works</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-3">
                    If a third party brings a claim against Soma covered by Section 15.1, the following procedures apply:
                  </p>
                  <ol className="list-decimal pl-6 space-y-2 text-sm text-yellow-800">
                    <li>
                      <strong>Notice:</strong> Soma will provide prompt written notice to you of the claim (unless prevented by law). Failure to provide prompt notice does not release your indemnification obligation, except to the extent you are materially prejudiced.
                    </li>
                    <li>
                      <strong>Control:</strong> Soma has the sole right to control the defense and settlement of the claim. You may participate in the defense with counsel of your choice at your own expense.
                    </li>
                    <li>
                      <strong>Cooperation:</strong> You agree to fully cooperate with Soma in the defense, including providing documents, evidence, and testimony as requested.
                    </li>
                    <li>
                      <strong>Settlement:</strong> You may not settle any claim without Soma's prior written consent (not to be unreasonably withheld). Soma will not settle in a manner that admits liability on your behalf without your consent (which may be withheld in your sole discretion).
                    </li>
                    <li>
                      <strong>Payment:</strong> You will pay all costs of the defense, including Soma's reasonable attorneys' fees, court costs, and expert fees, either in advance or within 30 days of invoice.
                    </li>
                  </ol>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">15.3 Exclusions from Indemnification</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">You Are NOT Required to Indemnify Soma For:</p>
                  <p className="text-sm text-green-800 leading-relaxed mb-3">
                    You are NOT required to indemnify Soma to the extent any claim arises from:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                    <li><strong>Soma's Gross Negligence or Willful Misconduct:</strong> Claims directly caused by Soma's gross negligence, recklessness, or intentional misconduct</li>
                    <li><strong>Soma's Breach of These Terms:</strong> Claims arising solely from Soma's material breach of these Terms (not your breach)</li>
                    <li><strong>Soma's Violation of Law:</strong> Claims arising solely from Soma's violation of applicable law</li>
                    <li><strong>Soma's Violation of Third-Party Rights:</strong> Claims that Soma violated intellectual property, privacy, or other rights (except as you directed Soma to act)</li>
                    <li><strong>Soma's Modification of Your Content:</strong> Claims arising from Soma's unauthorized modification, deletion, or use of your User Content</li>
                    <li><strong>Soma's Comparative Negligence:</strong> To the extent the claim is caused by Soma's ordinary negligence or comparative fault</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">15.4 Scope of Indemnification and Limitation</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">Important Limitations</p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-3">
                    <strong>Indemnification is Your Sole Remedy:</strong> Your indemnification obligation is your sole and exclusive remedy for third-party claims covered by Section 15.1. You waive any claim against Soma for defense costs or attorney's fees not covered by your indemnification obligation.
                  </p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-3">
                    <strong>No Waiver of Liability Limits:</strong> Your indemnification obligation does not waive Section 13 (Limitation of Liability). Indemnification obligations are in addition to, not in lieu of, other remedies and limitations.
                  </p>
                  <p className="text-sm text-purple-800 leading-relaxed">
                    <strong>Insurance:</strong> You agree to maintain appropriate insurance coverage (including professional liability, cyber liability, or general liability as applicable) with limits no less than $1,000,000 per occurrence. Upon request, you will provide proof of insurance.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">15.5 Third-Party Claims and Indemnification Triggers</h3>
                <div className="bg-red-50 border border-red-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-red-900 font-semibold mb-3">Examples of Indemnifiable Claims</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-3">
                    The following are examples of claims that would trigger your indemnification obligation:
                  </p>
                  <div className="space-y-2 text-sm text-red-800">
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Copyright Infringement Claim:</strong> A third party claims your User Content infringes their copyright</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Trademark Infringement Claim:</strong> A third party claims your use of a trademark in Soma violates their rights</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Defamation Claim:</strong> A third party sues Soma for defamatory content you posted</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Privacy Violation Claim:</strong> A third party claims you violated their privacy through Soma</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Contract Breach Claim:</strong> A third party claims you breached an agreement through your use of Soma</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Consumer Protection Claim:</strong> A regulatory agency or consumer sues over your business practices using Soma</p>
                    </div>
                    <div className="border-l-4 border-red-300 pl-3 py-1">
                      <p><strong>Payment Chargeback Claim:</strong> A third party initiates a chargeback or disputes a payment you made through Soma</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">15.6 Your Acknowledgment</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">Critical Acknowledgment</p>
                  <p className="text-sm text-indigo-800 leading-relaxed mb-3">
                    You acknowledge and agree that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-indigo-800">
                    <li>You understand the broad scope of your indemnification obligation</li>
                    <li>This indemnification obligation may require you to pay substantial amounts for Soma's defense</li>
                    <li>You are responsible for your User Content and activities on Soma</li>
                    <li>You have the financial means or insurance to cover potential indemnification claims</li>
                    <li>You will not use Soma for any unlawful or harmful purposes</li>
                    <li>This indemnification obligation is essential to Soma's decision to provide the Services</li>
                  </ul>
                </div>
              </section>

              {/* SECTION 16: Governing Law and Jurisdiction */}
              <section id="section-16" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  16. Governing Law, Jurisdiction, and Venue
                </h2>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16.1 Governing Law</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">Delaware Law Governs</p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-4">
                    These Terms of Service and all related agreements, disputes, and claims shall be governed by and construed in accordance with the laws of the STATE OF DELAWARE, WITHOUT REGARD TO ITS CONFLICT OF LAW PRINCIPLES OR PROVISIONS.
                  </p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-3 font-semibold">
                    Why Delaware Law?
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                    <li>Delaware has a well-developed and predictable body of contract law</li>
                    <li>Delaware's Uniform Commercial Code (UCC) provides clear, established precedent</li>
                    <li>Delaware courts have extensive experience with technology and commercial disputes</li>
                    <li>Delaware law is neutral and business-friendly</li>
                  </ul>
                  <p className="text-sm text-purple-800 leading-relaxed mt-3 italic">
                    Note: This choice of law provision is separate from the arbitration agreement in Section 14. The arbitrator will apply Delaware law to resolve disputes.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16.2 Conflict of Law Principles Excluded</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">No Choice of Law Exceptions</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-3">
                    Delaware law shall apply REGARDLESS OF YOUR LOCATION OR WHERE THE DISPUTE AROSE. This includes conflicts of law principles that might otherwise direct a court to apply another jurisdiction's laws. Specifically:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-yellow-800">
                    <li><strong>No Forum Non Conveniens:</strong> Even if Delaware is inconvenient, you cannot ask a court to apply another jurisdiction's law based on convenience</li>
                    <li><strong>No Choice of Law Based on Location:</strong> Your residence in California, New York, Texas, or any other state does not trigger that state's law</li>
                    <li><strong>No Renvoi:</strong> Delaware's conflict of law principles will not refer the dispute to another state's courts or laws</li>
                    <li><strong>Manifestly Mandatory Rules Excepted:</strong> Manifestly mandatory rules of another jurisdiction (e.g., GDPR consumer protections, state-specific fraud statutes) may apply to the extent required by law</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16.3 Arbitration Governs Dispute Resolution</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">Arbitration, Not Court Litigation</p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    Subject to Section 14 (Dispute Resolution and Arbitration), disputes arising from these Terms shall be resolved through binding arbitration, NOT in court. This means:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-blue-800">
                    <li>You waive your right to sue in Delaware courts or any other court (except as exceptions in Section 14 permit)</li>
                    <li>An arbitrator, not a judge or jury, will resolve your dispute</li>
                    <li>The arbitrator will apply Delaware law as directed in Section 16.1</li>
                    <li>Delaware law will be applied unless Section 14 permits an exception</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16.4 Exclusive Court Jurisdiction (If Arbitration Fails)</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">Fallback Jurisdiction (If Arbitration Is Unenforceable)</p>
                  <p className="text-sm text-indigo-800 leading-relaxed mb-3">
                    IF THE ARBITRATION AGREEMENT IN SECTION 14 IS FOUND UNENFORCEABLE OR INAPPLICABLE, you and Soma agree that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-indigo-800">
                    <li><strong>Exclusive Jurisdiction:</strong> Any lawsuit or claim shall be brought exclusively in the Delaware Court of Chancery (or, if federal jurisdiction is available, the U.S. District Court for the District of Delaware)</li>
                    <li><strong>Exclusive Venue:</strong> Venue shall be exclusively in Wilmington, Delaware (or other Delaware location as court rules provide)</li>
                    <li><strong>Non-Exclusive Federal Jurisdiction:</strong> Federal courts have concurrent jurisdiction over federal claims (e.g., COPPA violations, Copyright claims)</li>
                    <li><strong>No Other Courts:</strong> You expressly waive jurisdiction and venue in any other court (state or federal, U.S. or foreign)</li>
                  </ul>
                  <p className="text-sm text-indigo-800 leading-relaxed mt-3 italic">
                    This ensures that even if arbitration is unavailable, disputes are resolved in a single, predictable jurisdiction.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16.5 Waiver of Jury Trial</h3>
                <div className="bg-red-50 border-l-4 border-red-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-red-900 font-bold mb-3">NO JURY TRIAL</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-3">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, YOU AND SOMA EACH WAIVE THE RIGHT TO A JURY TRIAL IN ANY LAWSUIT, CLAIM, OR PROCEEDING ARISING FROM THESE TERMS. This waiver applies whether the matter is brought in:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-red-800 mb-3">
                    <li>Delaware courts</li>
                    <li>Federal courts</li>
                    <li>Any other court with jurisdiction</li>
                  </ul>
                  <p className="text-sm text-red-800 leading-relaxed">
                    <strong>What This Means:</strong> Any lawsuit will be decided by a judge alone, not a jury. This waiver is independently given and is not part of the arbitration agreement.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16.6 International Users and Mandatory Local Laws</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">Mandatory Local Law Protections</p>
                  <p className="text-sm text-green-800 leading-relaxed mb-3">
                    While Delaware law governs, users in certain jurisdictions have mandatory legal protections that cannot be waived:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                    <li><strong>GDPR Compliance (EU):</strong> If you are in the EU, GDPR rights cannot be waived. GDPR will apply to your personal data regardless of Delaware law choice</li>
                    <li><strong>COPPA Compliance (US):</strong> If you are under 13 in the US, COPPA 15 U.S.C. § 6501 applies despite Delaware law choice</li>
                    <li><strong>CCPA Rights (California):</strong> If you are a California resident, CCPA §1798.100-125 consumer rights apply</li>
                    <li><strong>State Consumer Protection Laws:</strong> State-specific consumer protection laws apply where explicitly made mandatory by statute (e.g., Illinois BIPA, Virginia VCDPA)</li>
                    <li><strong>Non-Waivable Statutory Rights:</strong> Any law that expressly prohibits waiver of statutory rights (e.g., certain employment laws) will apply</li>
                  </ul>
                  <p className="text-sm text-green-800 leading-relaxed mt-3 italic">
                    To the extent any mandatory law conflicts with Delaware law, the mandatory law prevails for that specific matter, but Delaware law applies to all other aspects.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">16.7 Federal Preemption and Arbitration Act</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">Federal Arbitration Act Preemption</p>
                  <p className="text-sm text-purple-800 leading-relaxed">
                    The Federal Arbitration Act (FAA), 9 U.S.C. §§ 1-16, preempts any state law that would prohibit or invalidate the arbitration agreement in Section 14. To the extent state law conflicts with the FAA, the FAA applies. This ensures your arbitration agreement is enforceable even if state law might otherwise disfavor arbitration.
                  </p>
                </div>
              </section>

              {/* SECTION 17: Miscellaneous Provisions */}
              <section id="section-17" className="mb-12 scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-200">
                  17. Miscellaneous Provisions and Final Clauses
                </h2>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">17.1 Entire Agreement and Supersession</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-blue-900 font-semibold mb-3">Complete Integration</p>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    These Terms of Service, together with our Privacy Policy and any other policies referenced or incorporated (each as amended from time to time), constitute the ENTIRE AGREEMENT AND COMPLETE UNDERSTANDING between you and Soma regarding:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-blue-800 mb-3">
                    <li>The Services and your use thereof</li>
                    <li>Your relationship with Soma</li>
                    <li>All rights, obligations, and remedies</li>
                  </ul>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3 font-semibold">
                    This agreement SUPERSEDES AND REPLACES:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-blue-800">
                    <li>All prior agreements between you and Soma (written or oral)</li>
                    <li>All course of dealing, course of performance, or trade usage</li>
                    <li>All contemporaneous communications or representations</li>
                    <li>Any terms contained in purchase orders, invoices, or other user documents</li>
                  </ul>
                  <p className="text-sm text-blue-800 leading-relaxed mt-3 italic">
                    If there is a conflict between these Terms and our Privacy Policy, the Privacy Policy governs matters of data privacy; these Terms govern all other matters.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">17.2 Severability and Reformation</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-yellow-900 font-semibold mb-3">Partial Invalidity Procedure</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-3">
                    If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court, arbitrator, or other authority:
                  </p>
                  <ol className="list-decimal pl-6 space-y-2 text-sm text-yellow-800">
                    <li><strong>Reformation:</strong> That provision will be reformed to the minimum extent necessary to make it valid and enforceable</li>
                    <li><strong>Severance:</strong> If reformation is not possible, that provision will be severed</li>
                    <li><strong>Preservation:</strong> All remaining provisions will remain in full force and effect</li>
                    <li><strong>Efficacy:</strong> The intent of this agreement will be preserved to the maximum extent possible</li>
                  </ol>
                  <p className="text-sm text-yellow-800 leading-relaxed mt-3 font-semibold">
                    Special Rule for Arbitration: If the class action waiver in Section 14 is found unenforceable, the entire arbitration clause in Section 14 shall be void (not severed), and disputes will proceed in court under Section 16.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">17.3 Waiver and Reinstatement</h3>
                <div className="bg-orange-50 border border-orange-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-orange-900 font-semibold mb-3">No Waiver Without Writing</p>
                  <p className="text-sm text-orange-800 leading-relaxed mb-3">
                    <strong>No Waiver by Conduct:</strong> Soma's failure to enforce any right or provision of these Terms does NOT constitute a waiver of that right or provision. No failure or delay by Soma in exercising any right creates a waiver of future enforcement.
                  </p>
                  <p className="text-sm text-orange-800 leading-relaxed mb-3">
                    <strong>Waiver Must Be Written:</strong> Any waiver of a provision in these Terms must be:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-orange-800 mb-3">
                    <li>In writing (email to legal@soma.ai is acceptable)</li>
                    <li>Signed (electronically acceptable) by an authorized representative of Soma</li>
                    <li>Specifically stating which provision is waived</li>
                  </ul>
                  <p className="text-sm text-orange-800 leading-relaxed">
                    <strong>Isolated Waiver:</strong> Any waiver applies only to the specific instance and does not waive any other violation or provision. Each case must be considered separately.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">17.4 Assignment and Delegation</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">Restrictions on Assignment</p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-4">
                    <strong>Your Assignment Prohibited:</strong> You may NOT assign, transfer, or delegate any of your rights or obligations under these Terms without Soma's prior written consent (which Soma may grant or withhold in its sole discretion). Any attempted assignment without consent is void.
                  </p>
                  <p className="text-sm text-purple-800 leading-relaxed mb-4 font-semibold">
                    Soma's Assignment Permitted: Soma may freely assign these Terms or any of its rights hereunder to any successor, affiliate, or third party, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-purple-800 mb-4">
                    <li>In connection with a merger, acquisition, or sale of substantially all assets</li>
                    <li>To an affiliate or subsidiary</li>
                    <li>To a successor-in-interest</li>
                    <li>Without your consent or notice (except as required by law)</li>
                  </ul>
                  <p className="text-sm text-purple-800 leading-relaxed">
                    <strong>Binding Effect:</strong> Upon any assignment by Soma, the assignee becomes bound by these Terms as if it were Soma.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">17.5 Notices and Communications</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">How to Send Notice</p>
                  <p className="text-sm text-indigo-800 leading-relaxed mb-3">
                    All notices, demands, and communications required under these Terms must be:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-indigo-800 mb-3">
                    <li><strong>In Writing:</strong> Email, certified mail, overnight courier, or personal delivery</li>
                    <li><strong>To Soma:</strong> Address must be to Soma Inc., legal department</li>
                    <li><strong>To You:</strong> Address must be to the email address registered with your account or other contact information you provided</li>
                  </ul>
                  <p className="text-sm text-indigo-800 leading-relaxed mb-3 font-semibold">
                    Notice to Soma:
                  </p>
                  <div className="bg-white rounded p-3 mb-3 text-xs text-indigo-800">
                    <p><strong>General Legal:</strong> <a href="mailto:legal@soma.ai" className="text-indigo-600 hover:underline">legal@soma.ai</a></p>
                    <p><strong>Privacy/GDPR:</strong> <a href="mailto:privacy@soma.ai" className="text-indigo-600 hover:underline">privacy@soma.ai</a></p>
                    <p><strong>DMCA:</strong> <a href="mailto:dmca@soma.ai" className="text-indigo-600 hover:underline">dmca@soma.ai</a></p>
                    <p><strong>Disputes:</strong> <a href="mailto:disputes@soma.ai" className="text-indigo-600 hover:underline">disputes@soma.ai</a></p>
                  </div>
                  <p className="text-sm text-indigo-800 leading-relaxed">
                    <strong>Effective Date:</strong> Notice is effective when sent for email (when recipient server receives), or upon receipt for physical mail.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">17.6 Feedback License and Suggestions</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">Ownership of Feedback and Suggestions</p>
                  <p className="text-sm text-green-800 leading-relaxed mb-3">
                    If you provide feedback, suggestions, improvements, feature requests, or other comments regarding Soma or the Services:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-green-800 mb-3">
                    <li>You grant Soma an irrevocable, worldwide, royalty-free license to use, reproduce, modify, distribute, and exploit such feedback</li>
                    <li>Soma may use your feedback without attribution, compensation, or acknowledgment</li>
                    <li>Soma has no obligation to implement your suggestion or acknowledge your feedback</li>
                    <li>You retain no rights to your feedback once provided</li>
                    <li>You represent that your feedback does not violate anyone else's intellectual property rights</li>
                  </ul>
                  <p className="text-sm text-green-800 leading-relaxed italic">
                    This license survives termination of these Terms and your relationship with Soma.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">17.7 Survival of Provisions</h3>
                <div className="bg-red-50 border border-red-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-red-900 font-semibold mb-3">Provisions That Continue After Termination</p>
                  <p className="text-sm text-red-800 leading-relaxed mb-3">
                    The following sections survive termination or expiration of these Terms and your account:
                  </p>
                  <div className="space-y-1 text-sm text-red-800">
                    <p><strong>Section 5:</strong> Intellectual Property Rights (perpetual)</p>
                    <p><strong>Section 6:</strong> Prohibited Conduct and Consequences (perpetual)</p>
                    <p><strong>Section 12:</strong> Disclaimers of Warranties (perpetual)</p>
                    <p><strong>Section 13:</strong> Limitation of Liability (perpetual)</p>
                    <p><strong>Section 14:</strong> Arbitration and Dispute Resolution (perpetual)</p>
                    <p><strong>Section 15:</strong> Indemnification (perpetual and indefinite)</p>
                    <p><strong>Section 16:</strong> Governing Law and Jurisdiction (perpetual)</p>
                    <p><strong>Sections 17.1-17.8:</strong> Miscellaneous Provisions (perpetual)</p>
                  </div>
                  <p className="text-sm text-red-800 leading-relaxed mt-3 italic">
                    These provisions remain in effect indefinitely unless expressly modified by Soma in writing.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">17.8 Amendment and Modification</h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 my-6 rounded-r-lg">
                  <p className="text-sm text-yellow-900 font-bold mb-3">How Soma May Change These Terms</p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-3">
                    Soma may amend these Terms at any time by posting the updated Terms at soma.ai/legal/terms or notifying you via email. Your continued use of Soma after amendment constitutes your acceptance of the new Terms.
                  </p>
                  <p className="text-sm text-yellow-800 leading-relaxed mb-3 font-semibold">
                    Material changes require:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-yellow-800 mb-3">
                    <li>30 days advance notice for changes that materially restrict your rights</li>
                    <li>Email notice to your registered email address</li>
                    <li>Option to terminate if you disagree (unless the change is required by law)</li>
                  </ul>
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    <strong>No Individual Negotiation:</strong> These Terms are non-negotiable. We do not modify or waive provisions for individual users.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">17.9 Interpretation and Construction</h3>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-purple-900 font-semibold mb-3">How to Read These Terms</p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-purple-800">
                    <li><strong>No Headings:</strong> Section headings are for convenience only and do not affect interpretation</li>
                    <li><strong>Singular/Plural:</strong> References to singular include plural and vice versa</li>
                    <li><strong>Inclusive "Or":</strong> "Or" means inclusive unless context requires exclusive</li>
                    <li><strong>Shall/Will:</strong> "Shall" and "will" are mandatory</li>
                    <li><strong>May:</strong> "May" means optional or permissive</li>
                    <li><strong>No Contra Proferentem:</strong> These Terms will not be construed against Soma merely because Soma drafted them</li>
                    <li><strong>Ambiguity Resolution:</strong> Ambiguities will not be interpreted against either party based on drafting</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">17.10 Technology and Electronic Agreements</h3>
                <div className="bg-green-50 border border-green-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-green-900 font-semibold mb-3">Electronic Signature and Formation</p>
                  <p className="text-sm text-green-800 leading-relaxed mb-3">
                    By clicking "I Agree" or otherwise accessing Soma, you acknowledge that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-green-800">
                    <li>You agree to conduct business electronically</li>
                    <li>Your electronic click/acceptance constitutes a valid and binding signature</li>
                    <li>These Terms constitute a valid and binding agreement</li>
                    <li>You have the legal authority to enter into this agreement</li>
                    <li>You may print or save a copy of these Terms for your records</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">17.11 Contact Information and Support</h3>
                <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-5 my-6">
                  <p className="text-sm text-indigo-900 font-semibold mb-3">Soma Legal Department Contact</p>
                  <div className="space-y-2 text-sm text-indigo-800">
                    <p><strong>Website:</strong> <a href="https://soma.ai" className="text-indigo-600 hover:underline">soma.ai</a></p>
                    <p><strong>General Legal:</strong> <a href="mailto:legal@soma.ai" className="text-indigo-600 hover:underline">legal@soma.ai</a></p>
                    <p><strong>Privacy & GDPR:</strong> <a href="mailto:privacy@soma.ai" className="text-indigo-600 hover:underline">privacy@soma.ai</a></p>
                    <p><strong>DMCA & Copyright:</strong> <a href="mailto:dmca@soma.ai" className="text-indigo-600 hover:underline">dmca@soma.ai</a></p>
                    <p><strong>Disputes & Complaints:</strong> <a href="mailto:disputes@soma.ai" className="text-indigo-600 hover:underline">disputes@soma.ai</a></p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mt-8 border border-gray-200">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Last Updated:</strong> {lastUpdated}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Version:</strong> 4.0.0 - Enterprise-Grade Legal Document
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Compliance:</strong> CCPA § 1798.100-125, GDPR Articles 15-22, COPPA 15 U.S.C. § 6501, DMCA 17 U.S.C. § 512, Federal Arbitration Act 9 U.S.C. § 1-16
                  </p>
                  <p className="text-xs text-gray-600 italic">
                    © 2025 Soma Inc. All rights reserved. This document contains legally binding provisions that affect your rights and remedies. Please read carefully before using Soma.
                  </p>
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
          className="mt-8 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-6 border border-indigo-200"
        >
          <div className="flex items-start gap-4">
            <div className="bg-white rounded-full p-3 shadow-sm">
              <Mail className="text-indigo-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Legal Questions or Concerns?</h3>
              <p className="text-sm text-gray-700 mb-4">
                Contact our legal team for questions about these Terms of Service.
              </p>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">General Legal Inquiries</p>
                  <a href="mailto:legal@soma.ai" className="text-indigo-600 hover:underline flex items-center gap-1">
                    legal@soma.ai <ExternalLink size={14} />
                  </a>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">DMCA Copyright Notices</p>
                  <a href="mailto:dmca@soma.ai" className="text-indigo-600 hover:underline flex items-center gap-1">
                    dmca@soma.ai <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default TermsOfServicePage;
term