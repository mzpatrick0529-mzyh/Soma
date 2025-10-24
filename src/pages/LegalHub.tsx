/**
 * ⚖️ Legal Hub - Centralized Access to All Legal Documents
 * Soma Inc. Compliance Center
 */

import { motion } from "framer-motion";
import { Shield, FileText, AlertCircle, Scale, Download, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LegalHub = () => {
  const navigate = useNavigate();

  const legalDocuments = [
    {
      id: "privacy-policy",
      title: "Privacy Policy",
      description: "Comprehensive details on how we collect, use, and protect your personal information. CCPA/CPRA and BIPA compliant.",
      icon: Shield,
      iconColor: "text-indigo-600",
      bgColor: "from-indigo-50 to-blue-50",
      borderColor: "border-indigo-200",
      path: "/legal/privacy-policy",
      lastUpdated: "October 20, 2025",
      sections: [
        "Information Collection",
        "Data Usage", 
        "Your Privacy Rights",
        "California Residents (CCPA/CPRA)",
        "Biometric Data (BIPA)",
        "Data Security",
      ],
    },
    {
      id: "terms-of-service",
      title: "Terms of Service",
      description: "Legal agreement governing your use of Soma's services, including user responsibilities, limitations, and dispute resolution.",
      icon: FileText,
      iconColor: "text-purple-600",
      bgColor: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
      path: "/legal/terms-of-service",
      lastUpdated: "October 20, 2025",
      sections: [
        "Eligibility Requirements",
        "User Content Ownership",
        "Prohibited Conduct",
        "AI Disclaimers",
        "Limitation of Liability",
        "Arbitration Agreement",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-3">
              <Scale className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Legal Center</h1>
              <p className="text-gray-600 mt-1">Soma Inc. - Compliance & Legal Documentation</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-2xl mb-8"
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="text-blue-600 mt-1 flex-shrink-0" size={24} />
            <div>
              <h2 className="text-lg font-bold text-blue-900 mb-2">Legally Binding Agreements</h2>
              <p className="text-sm text-blue-800 leading-relaxed">
                The documents below constitute legally binding agreements between you and Soma Inc. By using our Services, you agree to comply with all terms and policies. Please read them carefully and contact us if you have any questions.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Legal Documents Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {legalDocuments.map((doc, index) => {
            const Icon = doc.icon;
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className={`bg-gradient-to-br ${doc.bgColor} border ${doc.borderColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <Icon className={doc.iconColor} size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{doc.title}</h3>
                    <p className="text-sm text-gray-600">Last Updated: {doc.lastUpdated}</p>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed mb-6">
                  {doc.description}
                </p>

                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Key Sections:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {doc.sections.map((section, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                        <CheckCircle className="text-green-600 flex-shrink-0" size={14} />
                        <span>{section}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate(doc.path)}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    Read Full Document
                    <ExternalLink className="ml-2" size={16} />
                  </Button>
                  <Button variant="outline" size="icon" className="flex-shrink-0">
                    <Download size={18} />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Legal Resources</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Acceptable Use Policy</h3>
              <p className="text-sm text-gray-600 mb-3">
                Guidelines for prohibited content and conduct on Soma platform.
              </p>
              <Button variant="link" className="px-0 text-indigo-600 hover:text-indigo-700">
                View Policy →
              </Button>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Copyright & DMCA</h3>
              <p className="text-sm text-gray-600 mb-3">
                Procedures for reporting copyright infringement and filing counter-notices.
              </p>
              <Button variant="link" className="px-0 text-indigo-600 hover:text-indigo-700">
                Learn More →
              </Button>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Community Guidelines</h3>
              <p className="text-sm text-gray-600 mb-3">
                Standards for respectful and safe interactions within our community.
              </p>
              <Button variant="link" className="px-0 text-indigo-600 hover:text-indigo-700">
                Read Guidelines →
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Compliance Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-600 mb-4">Soma Inc. is committed to legal compliance:</p>
          <div className="flex justify-center items-center gap-6 flex-wrap">
            <div className="bg-white px-6 py-3 rounded-full border border-gray-200 shadow-sm">
              <span className="text-sm font-semibold text-gray-900">CCPA/CPRA Compliant</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-full border border-gray-200 shadow-sm">
              <span className="text-sm font-semibold text-gray-900">BIPA Compliant (IL)</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-full border border-gray-200 shadow-sm">
              <span className="text-sm font-semibold text-gray-900">COPPA Compliant</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-full border border-gray-200 shadow-sm">
              <span className="text-sm font-semibold text-gray-900">DMCA Registered</span>
            </div>
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions or Concerns?</h2>
          <p className="text-gray-700 mb-6">
            Our legal and privacy teams are here to help. Contact us for any inquiries regarding these legal documents or your rights as a user.
          </p>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">General Legal</p>
              <a href="mailto:legal@soma.ai" className="text-sm text-indigo-600 hover:underline">
                legal@soma.ai
              </a>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">Privacy Inquiries</p>
              <a href="mailto:privacy@soma.ai" className="text-sm text-indigo-600 hover:underline">
                privacy@soma.ai
              </a>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">Data Requests (CCPA)</p>
              <a href="mailto:dsr@soma.ai" className="text-sm text-indigo-600 hover:underline">
                dsr@soma.ai
              </a>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">DMCA Notices</p>
              <a href="mailto:dmca@soma.ai" className="text-sm text-indigo-600 hover:underline">
                dmca@soma.ai
              </a>
            </div>
          </div>

          <p className="text-xs text-gray-600 mt-6 text-center">
            Soma Inc. | Delaware Corporation | Effective Date: October 20, 2025
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default LegalHub;
