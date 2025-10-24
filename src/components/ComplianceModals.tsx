/**
 * ⚖️ Compliance Modals for Data Import
 * Data Import Compliance Modal Component
 */

import { useState } from "react";
import {
  AlertTriangle,
  Shield,
  CheckCircle2,
  X,
  FileWarning,
  MessageSquare,
  Camera,
  Mic,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

// ========== WeChat Disclaimer Modal ==========

interface WeChatDisclaimerModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const WeChatDisclaimerModal = ({
  open,
  onAccept,
  onDecline,
}: WeChatDisclaimerModalProps) => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (!accepted) return;
    onAccept();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onDecline()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-yellow-100 p-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                WeChat Data Import Disclaimer
              </DialogTitle>
              <DialogDescription>
                WeChat Data Import Disclaimer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4 text-sm">
            <Alert variant="destructive">
              <FileWarning className="h-4 w-4" />
              <AlertDescription className="font-semibold">
                ⚠️ Important Legal Notice - Please Read Carefully
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-semibold text-base">About WeChat Data Decryption and Import:</h4>
              
              <p className="leading-relaxed">
                1. <strong>Third-Party Platform Terms of Service:</strong>
                Decrypting and importing WeChat data may violate Tencent WeChat's Terms of Service.
                Soma is not responsible for any legal disputes between you and Tencent.
              </p>

              <p className="leading-relaxed">
                2. <strong>Decryption Key Provided by You:</strong>
                Soma does not provide, store, or distribute WeChat database decryption keys.
                You need to obtain the decryption key yourself and assume related risks.
              </p>

              <p className="leading-relaxed">
                3. <strong>Potential Legal Risks:</strong>
                Unauthorized access to encrypted data may violate the Computer Fraud and Abuse Act (CFAA),
                Electronic Communications Privacy Act (ECPA), or other applicable laws.
              </p>

              <p className="leading-relaxed">
                4. <strong>Data Privacy Risks:</strong>
                Imported WeChat data may contain others' private information (chat records, contacts, etc.).
                You must ensure you have obtained consent from relevant parties or have legal rights to process this data.
              </p>

              <p className="leading-relaxed">
                5. <strong>Possible Legal Action by Tencent:</strong>
                Tencent reserves the right to take legal action against users who violate its Terms of Service,
                including but not limited to account bans, civil lawsuits, or criminal complaints.
              </p>
            </div>

            <Separator />

            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Soma's Recommendations
              </h4>
              <ul className="space-y-1 text-xs list-disc list-inside">
                <li>Prioritize using official data export features (if Tencent provides)</li>
                <li>Consider using WeChat's 'Chat History Migration' feature to export text</li>
                <li>Only import content created by yourself</li>
                <li>If in doubt, consult a lawyer before deciding whether to import</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold">You confirm and agree:</h4>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="wechat-disclaimer"
                  checked={accepted}
                  onCheckedChange={(checked) => setAccepted(checked as boolean)}
                />
                <Label
                  htmlFor="wechat-disclaimer"
                  className="text-sm leading-tight cursor-pointer"
                >
                  I have read and understand all of the above warnings and legal risks.
                  I confirm that I take full responsibility for all consequences of importing WeChat data,
                  including but not limited to legal disputes with Tencent, account bans, or criminal liability.
                  I explicitly release Soma from liability for any resulting losses or legal consequences.
                </Label>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onDecline} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            I do not agree, cancel import
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!accepted}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            I understand and accept the risks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ========== Biometric Consent Modal (BIPA Compliance) ==========

interface BiometricConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  userState?: string; // e.g., "IL" for Illinois
}

export const BiometricConsentModal = ({
  open,
  onAccept,
  onDecline,
  userState,
}: BiometricConsentModalProps) => {
  const [accepted, setAccepted] = useState(false);
  const [electronicSignature, setElectronicSignature] = useState("");

  const isBIPAState = userState === "IL"; // Illinois requires BIPA compliance

  const handleAccept = () => {
    if (!accepted || (isBIPAState && !electronicSignature.trim())) return;
    
    // Log consent for compliance
    console.log("[BIPA Consent] User accepted biometric data collection", {
      timestamp: new Date().toISOString(),
      userState,
      signature: electronicSignature || "N/A",
    });
    
    onAccept();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onDecline()}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-indigo-100 p-3">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Biometric Information Collection Consent
              </DialogTitle>
              <DialogDescription>
                Biometric Information Collection Consent
                {isBIPAState && " (Illinois BIPA Required)"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[450px] pr-4">
          <div className="space-y-4 text-sm">
            {isBIPAState && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  In accordance with the Illinois Biometric Information Privacy Act (BIPA),
                  we must obtain your written consent before collecting your biometric data.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <h4 className="font-semibold">Biometric Information We Will Collect:</h4>

              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mic className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Voice Patterns</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Extract 768-dimensional voice fingerprint feature vectors from your voice messages and call records,
                      for AI personality modeling and voice recognition
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Camera className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Facial Geometry</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Extract facial feature points and geometric data from your photos and videos,
                      for photo classification and facial recognition
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold">Data Usage and Protection Commitments:</h4>
              <ul className="space-y-2 text-xs list-none">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Retention Period:</strong>
                    Your biometric data will be retained until 30 days after your account is closed
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Deletion Policy:</strong>
                    You can delete your biometric data at any time in Settings
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>No Sale or Disclosure:</strong>
                    We will never sell, rent, or disclose your biometric data to third parties
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Encrypted Storage:</strong>
                    All biometric data is encrypted with AES-256 and stored in a secure database
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Usage Restrictions:</strong>
                    Used only for your personal AI model training, not for marketing or shared models
                  </span>
                </li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold">Your Rights:</h4>
              <ul className="space-y-1 text-xs list-disc list-inside">
                <li>You have the right to refuse this consent (voice/facial features will be disabled)</li>
                <li>You can withdraw consent and delete your biometric data at any time</li>
                <li>You can request access to a copy of your biometric data that we store</li>
                {isBIPAState && (
                  <li className="text-indigo-700 font-medium">
                    Under BIPA, you have a private right of action for unauthorized data collection
                  </li>
                )}
              </ul>
            </div>

            <Separator />

            <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="biometric-consent"
                  checked={accepted}
                  onCheckedChange={(checked) => setAccepted(checked as boolean)}
                />
                <Label
                  htmlFor="biometric-consent"
                  className="text-sm leading-tight cursor-pointer"
                >
                  I have read and understand how Soma will collect, use, and protect my biometric information.
                  I explicitly consent to Soma collecting, storing, and using my voice patterns and facial geometry,
                  for the purposes stated above.
                  I understand I can withdraw this consent at any time.
                </Label>
              </div>

              {isBIPAState && (
                <div className="space-y-2">
                  <Label htmlFor="electronic-signature" className="text-sm font-medium">
                    Electronic Signature (Required - BIPA Requirement)
                  </Label>
                  <input
                    id="electronic-signature"
                    type="text"
                    placeholder="Please enter your full name as electronic signature"
                    value={electronicSignature}
                    onChange={(e) => setElectronicSignature(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    disabled={!accepted}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your signature will be encrypted and stored to prove your consent
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onDecline} className="flex-1">
            I decline (features will be disabled)
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!accepted || (isBIPAState && !electronicSignature.trim())}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            I consent to biometric information collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ========== Sensitive Information Limitation Modal (CPRA) ==========

interface SensitiveInfoModalProps {
  open: boolean;
  onAccept: (limitUsage: boolean) => void;
  onClose: () => void;
}

export const SensitiveInfoLimitationModal = ({
  open,
  onAccept,
  onClose,
}: SensitiveInfoModalProps) => {
  const [limitUsage, setLimitUsage] = useState(false);

  const handleContinue = () => {
    onAccept(limitUsage);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-3">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Sensitive Personal Information Usage Restrictions
              </DialogTitle>
              <DialogDescription>
                Sensitive Personal Information Usage Limitation (CPRA)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              According to the California Privacy Rights Act (CPRA), you have the right to limit our use of your sensitive personal information.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-semibold">What is sensitive personal information?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sensitive personal information includes: biometric data (voice, facial features),
              precise geolocation, health information, financial account information,
              racial or ethnic origin, religious or philosophical beliefs, sexual orientation, etc.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold">How does Soma use sensitive information?</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-xs">
              <p className="font-medium">✅ We will use sensitive information for:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Training your dedicated AI model</li>
                <li>Providing personalized memory retrieval services</li>
                <li>Improving your user experience</li>
                <li>System security and anti-fraud</li>
              </ul>

              <p className="font-medium mt-3">❌ We promise not to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Sell or share your sensitive information</li>
                <li>Use for marketing or advertising purposes</li>
                <li>Use for training shared AI models</li>
                <li>Disclose to third parties (except as required by law)</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="space-y-3 bg-purple-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Checkbox
                id="limit-sensitive"
                checked={limitUsage}
                onCheckedChange={(checked) => setLimitUsage(checked as boolean)}
              />
              <div className="flex-1">
                <Label
                  htmlFor="limit-sensitive"
                  className="text-sm leading-tight cursor-pointer font-medium"
                >
                  Limit the use of sensitive personal information
                </Label>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  If you check this option, we will only use your sensitive information to provide core services,
                  not for any analysis, improvement or other purposes. This may affect the accuracy of certain features.
                </p>
              </div>
            </div>
          </div>

          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-900">
              You can change this option in settings at any time. Even if you choose to limit,
              we will still use sensitive information to provide the core services you request.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button onClick={handleContinue} className="w-full">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {limitUsage ? "Confirm restriction and continue" : "Do not restrict and continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
