"use client";

import { getConfidenceColor, getConfidenceLabel } from "@/lib/calculations";
import { motion } from "framer-motion";

interface ConfidenceBadgeProps {
  confidence: number; // 0-1
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function ConfidenceBadge({ 
  confidence, 
  showLabel = true,
  size = "md" 
}: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100);
  const label = getConfidenceLabel(confidence);
  
  // Färgklasser baserat på confidence
  let bgColor = "bg-success/10";
  let textColor = "text-success";
  let borderColor = "border-success/20";
  
  if (confidence < 0.9 && confidence >= 0.7) {
    bgColor = "bg-warning/10";
    textColor = "text-warning";
    borderColor = "border-warning/20";
  } else if (confidence < 0.7) {
    bgColor = "bg-error/10";
    textColor = "text-error";
    borderColor = "border-error/20";
  }

  // Storlekar
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${bgColor} ${textColor} ${borderColor} ${sizeClasses[size]}
      `}
    >
      {/* Prick-indikator */}
      <span className={`w-1.5 h-1.5 rounded-full ${textColor.replace("text-", "bg-")}`} />
      
      {/* Procent */}
      <span className="font-mono font-semibold">{percentage}%</span>
      
      {/* Label (valfri) */}
      {showLabel && (
        <span className="opacity-80">• {label}</span>
      )}
    </motion.div>
  );
}

