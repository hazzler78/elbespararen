"use client";

import { useState } from "react";
import { MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { getPriceAreaFromPostalCode, isValidSwedishPostalCode, formatPostalCode, PRICE_AREAS } from "@/lib/price-areas";

interface PostalCodeInputProps {
  value: string;
  onChange: (postalCode: string, priceArea: string | null) => void;
  className?: string;
}

export default function PostalCodeInput({ value, onChange, className = "" }: PostalCodeInputProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [priceArea, setPriceArea] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatPostalCode(inputValue);
    
    // Uppdatera värdet
    onChange(inputValue, priceArea);
    
    // Validera postnummer
    if (inputValue.length === 0) {
      setIsValid(null);
      setPriceArea(null);
      return;
    }
    
    const valid = isValidSwedishPostalCode(inputValue);
    setIsValid(valid);
    
    if (valid) {
      const area = getPriceAreaFromPostalCode(inputValue);
      setPriceArea(area);
      onChange(inputValue, area);
    } else {
      setPriceArea(null);
      onChange(inputValue, null);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Postnummer
        </label>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder="123 45"
            maxLength={6}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-10 ${
              isValid === null 
                ? 'border-gray-300' 
                : isValid 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-red-500 bg-red-50'
            }`}
          />
          {isValid !== null && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValid ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          )}
        </div>
      </div>
      
      {isValid && priceArea && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                {PRICE_AREAS[priceArea]?.name}
              </p>
              <p className="text-xs text-blue-600">
                {PRICE_AREAS[priceArea]?.description}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {isValid === false && value.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800">
              Ogiltigt postnummer. Ange ett svenskt postnummer (5 siffror).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
