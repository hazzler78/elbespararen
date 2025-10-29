"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Mail, Clock } from "lucide-react";
import { SwitchRequest } from "@/lib/types";

interface SwitchConfirmationProps {
  switchRequest: SwitchRequest;
  onClose: () => void;
}

export default function SwitchConfirmation({ switchRequest, onClose }: SwitchConfirmationProps) {
  const { customerInfo, newProvider, savings } = switchRequest;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-success text-white p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-8 h-8" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Bytförfrågan skickad!</h2>
          <p className="text-success-foreground/80">
            Vi har tagit emot din förfrågan om att byta till {newProvider.name}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Besparing */}
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <h3 className="font-bold text-success mb-2">Din besparing</h3>
            <p className="text-3xl font-bold text-success">
              {savings.potentialSavings} kr per månad
            </p>
            <p className="text-sm text-muted">
              Från {savings.currentCost} kr till {savings.cheapestAlternative} kr
            </p>
          </div>

          {/* Nästa steg */}
          <div>
            <h3 className="font-bold text-lg mb-4">Vad händer nu?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Bekräftelse skickad</h4>
                  <p className="text-sm text-muted">
                    Du får en bekräftelse via e-post inom några minuter
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Bearbetning</h4>
                  <p className="text-sm text-muted">
                    Vi sköter hela bytet åt dig. Du behöver inte kontakta din nuvarande leverantör.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Bytet genomförs</h4>
                  <p className="text-sm text-muted">
                    Bytet genomförs enligt uppsägningstiden från din nuvarande leverantör
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kontaktinformation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Kontaktinformation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted">Namn</p>
                <p className="font-medium">{customerInfo.firstName} {customerInfo.lastName}</p>
              </div>
              <div>
                <p className="text-muted">E-post</p>
                <p className="font-medium">{customerInfo.email}</p>
              </div>
              <div>
                <p className="text-muted">Telefon</p>
                <p className="font-medium">{customerInfo.phone}</p>
              </div>
              <div>
                <p className="text-muted">Ny leverantör</p>
                <p className="font-medium">{newProvider.name}</p>
              </div>
            </div>
          </div>

          {/* Viktig information */}
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <h3 className="font-semibold text-warning mb-2">Viktig information</h3>
            <ul className="text-sm text-muted space-y-1">
              <li>• Du kan avbryta bytet fram till bekräftelse från {newProvider.name}</li>
              <li>• Vi kontaktar dig om vi behöver ytterligare information</li>
              <li>• Du får information om när bytet är genomfört</li>
              <li>• Din nuvarande leverantör kommer att meddela dig om uppsägningen</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted">
              Referensnummer: {switchRequest.id}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Stäng
              </button>
              <button
                onClick={() => {
                  // TODO: Skicka e-post med sammanfattning
                  console.log("Send email with summary");
                }}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Skicka sammanfattning
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
