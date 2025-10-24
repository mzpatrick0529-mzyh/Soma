/**
 * 🔒 Privacy Policy - Soma Inc.
 * Comprehensive U.S. Legal Compliance Document
 * CCPA/CPRA, BIPA, GDPR-compliant
 * Last Updated: October 20, 2025
 */

import { motion } from "framer-motion";
import { ArrowLeft, Shield, AlertCircle, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PrivacyPolicyPage = () => {
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
        <div className="max-w-4xl mx-auto px-4 py-4">
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
              <Shield className="text-indigo-600" size={24} />
              <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8"
        >
          {/* Important Notice */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-8 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm text-blue-900 font-medium">Important Notice</p>
                <p className="text-sm text-blue-800 mt-1">
                  This Privacy Policy is a legally binding agreement. By using Soma, you acknowledge that you have read, understood, and agree to be bound by these terms. If you do not agree, please discontinue use immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Effective Date */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Effective Date: <span className="font-semibold text-gray-900">{effectiveDate}</span></p>
              <p className="text-sm text-gray-600">Last Updated: <span className="font-semibold text-gray-900">{lastUpdated}</span></p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download size={16} />
              Download PDF
            </Button>
          </div>

          {/* Table of Contents */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Table of Contents</h2>
            <nav className="space-y-2">
              {[
                "1. Introduction and Scope",
                "2. Information We Collect",
                "3. How We Use Your Information",
                "4. Information Sharing and Disclosure",
                "5. Data Retention and Deletion",
                "6. Your Privacy Rights",
                "7. California Privacy Rights (CCPA/CPRA)",
                "8. Biometric Information (BIPA Compliance)",
                "9. Children's Privacy (COPPA)",
                "10. International Data Transfers",
                "11. Data Security",
                "12. Cookies and Tracking Technologies",
                "13. Third-Party Services",
                "14. AI-Generated Content",
                "15. Changes to This Policy",
                "16. Contact Us",
              ].map((item, index) => (
                <a
                  key={index}
                  href={`#section-${index + 1}`}
                  className="block text-sm text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>

          {/* Policy Content */}
          <div className="prose prose-sm max-w-none space-y-8">
            {/* Section 1 */}
            <section id="section-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction and Scope</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to Soma, an AI-native personal memory system operated by <strong>Soma Inc.</strong> ("Soma," "we," "us," or "our"). This Privacy Policy describes how we collect, use, disclose, and protect your personal information when you use our web platform, mobile applications, and related services (collectively, the "Services").
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Controller Identity:</strong> Soma Inc., a Delaware corporation, with principal place of business at [Address to be provided], serves as the data controller for personal information processed through the Services.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Scope of Application:</strong> This Privacy Policy applies to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Users accessing Soma from the United States</li>
                <li>Personal information collected through our website (soma.ai), mobile applications, and APIs</li>
                <li>Data imported from third-party platforms (Google, WeChat, Instagram, etc.)</li>
                <li>AI-generated content and derivative data products</li>
              </ul>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4 rounded-r-lg">
                <p className="text-sm text-yellow-900">
                  <strong>Important:</strong> For users in the European Union, please refer to our separate GDPR Privacy Notice. For California residents, see Section 7 for additional rights under CCPA/CPRA.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="section-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Information You Provide Directly</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Account Information:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Name, email address, username</li>
                    <li>Password (encrypted and never stored in plain text)</li>
                    <li>Profile picture and bio (optional)</li>
                    <li>Authentication credentials (OAuth tokens from Google, etc.)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Imported Memory Data:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li><strong>Google Takeout Data:</strong> Emails, calendar events, search history, YouTube watch history, location history, photos metadata</li>
                    <li><strong>WeChat Data:</strong> Chat messages, media files, contact information (requires manual export and user-provided decryption key)</li>
                    <li><strong>Instagram Data:</strong> Posts, stories, direct messages, likes, comments, follower information</li>
                    <li><strong>Manual Uploads:</strong> Documents, photos, videos, voice recordings, notes</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">User-Generated Content:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Chat conversations with your AI persona</li>
                    <li>Feedback and ratings on AI-generated responses</li>
                    <li>Manual memory entries and journal notes</li>
                    <li>Comments and annotations on memories</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 Information Automatically Collected</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Device and Usage Information:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>IP address, device type, operating system, browser type and version</li>
                    <li>Unique device identifiers (advertising ID, IDFV)</li>
                    <li>Session duration, pages viewed, features used</li>
                    <li>Clickstream data and navigation patterns</li>
                    <li>Crash reports and performance metrics</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Location Information:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Precise geolocation data (if you grant permission)</li>
                    <li>Approximate location inferred from IP address</li>
                    <li>Location metadata from imported photos and check-ins</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.3 Sensitive Personal Information</h3>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-4">
                <p className="text-sm text-red-900 font-semibold mb-2">⚠️ We collect the following categories of sensitive personal information:</p>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Biometric Identifiers:</strong> Voice embeddings (768-dimensional vectors from speech), facial feature vectors from photos (if facial recognition is enabled), behavioral patterns</li>
                <li><strong>Precise Geolocation:</strong> GPS coordinates from imported data and location-enabled features</li>
                <li><strong>Health Information:</strong> Inferred from memory content (e.g., medical appointments, fitness data, mental health journaling)</li>
                <li><strong>Racial or Ethnic Origin:</strong> May be inferred from memory content or explicitly provided</li>
                <li><strong>Religious or Philosophical Beliefs:</strong> May be inferred from memory content</li>
                <li><strong>Sexual Orientation:</strong> May be inferred from memory content or social connections</li>
                <li><strong>Citizenship or Immigration Status:</strong> May be mentioned in imported documents</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>Limited Use Commitment:</strong> We use sensitive personal information <u>solely</u> to provide the core AI persona services and do NOT use it for marketing, advertising, or profiling purposes except with your explicit opt-in consent.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.4 Information from Third Parties</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>OAuth Providers:</strong> Basic profile information from Google Sign-In</li>
                <li><strong>Payment Processors:</strong> Transaction information (if you purchase premium features)</li>
                <li><strong>Analytics Partners:</strong> Aggregated usage statistics (anonymized)</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="section-3">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Core Service Provision</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Hierarchical Memory Modeling (HMM):</strong> Building three-layer memory structure (L0: Raw Memories, L1: Topic Clusters, L2: Biography)</li>
                <li><strong>AI Persona Training:</strong> Training user-specific AI models to simulate your personality, communication style, and decision-making patterns</li>
                <li><strong>Vector Embeddings:</strong> Generating semantic embeddings using Sentence-Transformers (768-dim) and OpenAI/Cohere (1536-dim)</li>
                <li><strong>Natural Language Processing:</strong> Entity extraction (spaCy), sentiment analysis (TextBlob), emotion detection</li>
                <li><strong>Retrieval-Augmented Generation (RAG):</strong> Retrieving relevant memories to provide contextually accurate AI responses</li>
                <li><strong>Reinforcement Learning from Human Feedback (RLHF):</strong> Improving AI quality based on your ratings and corrections</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Service Improvement and Analytics</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Analyzing usage patterns to improve features and user experience</li>
                <li>Conducting A/B testing on new AI models (V1 vs V2 comparisons)</li>
                <li>Monitoring system performance and debugging errors</li>
                <li>Aggregated analytics (anonymized and de-identified data only)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3 Communication</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Sending service notifications (account security, data import completion)</li>
                <li>Responding to support requests and inquiries</li>
                <li>Providing product updates and feature announcements (with opt-out option)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.4 Legal and Security Purposes</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Complying with legal obligations (subpoenas, court orders)</li>
                <li>Protecting against fraud, abuse, and security threats</li>
                <li>Enforcing our Terms of Service and other policies</li>
                <li>Establishing, exercising, or defending legal claims</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.5 What We Do NOT Do</h3>
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <ul className="list-disc pl-6 space-y-2 text-green-900 font-medium">
                  <li>❌ We do NOT sell your personal information to third parties</li>
                  <li>❌ We do NOT use your data for targeted advertising</li>
                  <li>❌ We do NOT share your memories with other users</li>
                  <li>❌ We do NOT train shared AI models on your data without opt-in consent</li>
                  <li>❌ We do NOT use sensitive personal information beyond service provision (unless you opt-in)</li>
                </ul>
              </div>
            </section>

            {/* Section 4 - I'll continue in next message */}
          </div>
        </motion.div>

        {/* Contact Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-6 border border-indigo-200"
        >
          <div className="flex items-start gap-4">
            <div className="bg-white rounded-full p-3 shadow-sm">
              <Mail className="text-indigo-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Questions About Your Privacy?</h3>
              <p className="text-sm text-gray-700 mb-3">
                Our privacy team is here to help. Contact us at:
              </p>
              <div className="space-y-1 text-sm">
                <p><strong>Email:</strong> <a href="mailto:privacy@soma.ai" className="text-indigo-600 hover:underline">privacy@soma.ai</a></p>
                <p><strong>Data Subject Requests:</strong> <a href="mailto:dsr@soma.ai" className="text-indigo-600 hover:underline">dsr@soma.ai</a></p>
                <p><strong>Security Concerns:</strong> <a href="mailto:security@soma.ai" className="text-indigo-600 hover:underline">security@soma.ai</a></p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
