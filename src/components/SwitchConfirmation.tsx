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
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-success text-white p-6 text-center flex-shrink-0">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-8 h-8" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Bytförfrågan skickad! ✉️</h2>
          <p className="text-success-foreground/80">
            Vi har tagit emot din förfrågan om att byta till {newProvider.name}
          </p>
          <p className="text-success-foreground/90 mt-2 font-semibold">
            📧 Kontrollera din e-post för orderbekräftelse!
          </p>
        </div>

        {/* Content - Scrollbar */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
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

          {/* E-postbekräftelse varning - EXTRA FRAMTRÄDANDE */}
          <div className="bg-gradient-to-br from-primary/15 to-primary/8 border-[3px] border-primary/40 rounded-xl p-6 shadow-lg animate-pulse">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-primary/30 rounded-full flex items-center justify-center flex-shrink-0 animate-bounce mb-3">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 w-full">
                <h3 className="font-bold text-xl mb-3 text-primary">
                  Kolla din e-post för orderbekräftelse!
                </h3>
                <p className="text-base text-gray-700 mb-4 font-medium">
                  Vi har skickat en bekräftelse på din beställning till:
                </p>
                <div className="bg-white border-2 border-primary/40 rounded-lg px-5 py-4 mb-4 shadow-md">
                  <p className="font-bold text-primary text-lg">{customerInfo.email}</p>
                </div>
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <strong className="text-primary text-base">⚠️ Viktigt:</strong><br/>
                    Kontrollera även din <strong>skräppost</strong> om du inte ser mailet inom några minuter. 
                    Mailet innehåller ditt referensnummer och all viktig information om din beställning.
                  </p>
                </div>
              </div>
            </div>
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
                  <h4 className="font-semibold">Orderbekräftelse skickad</h4>
                  <p className="text-sm text-muted">
                    En detaljerad bekräftelse har skickats till din e-postadress med all information om din beställning
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

        {/* Footer - Fast i botten */}
        <div className="border-t border-border p-4 sm:p-6 bg-white flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-muted text-center sm:text-left">
              Referensnummer: <span className="font-mono">{switchRequest.id}</span>
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Stäng
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
