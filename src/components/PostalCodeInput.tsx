"use client";

import { useState } from "react";
import { MapPin, AlertCircle, CheckCircle2, Edit2, X } from "lucide-react";
import { getPriceAreaFromPostalCode, isValidSwedishPostalCode, formatPostalCode, PRICE_AREAS, isPriceAreaCode, PriceAreaCode } from "@/lib/price-areas";

interface PostalCodeInputProps {
  value: string;
  onChange: (postalCode: string, priceArea: string | null, wasManuallyChanged?: boolean, detectedArea?: string | null) => void;
  className?: string;
}

export default function PostalCodeInput({ value, onChange, className = "" }: PostalCodeInputProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [detectedArea, setDetectedArea] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isManuallyChanged, setIsManuallyChanged] = useState(false);
  const [showAreaSelector, setShowAreaSelector] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatPostalCode(inputValue);
    
    // Validera postnummer
    if (inputValue.length === 0) {
      setIsValid(null);
      setDetectedArea(null);
      setSelectedArea(null);
      setIsManuallyChanged(false);
      setShowAreaSelector(false);
      onChange(inputValue, null, false, null);
      return;
    }
    
    const valid = isValidSwedishPostalCode(inputValue);
    setIsValid(valid);
    
    if (valid) {
      const area = getPriceAreaFromPostalCode(inputValue);
      setDetectedArea(area);
      // Om användaren inte har ändrat manuellt, uppdatera selected area också
      if (!isManuallyChanged) {
        setSelectedArea(area);
        onChange(inputValue, area, false, area);
      } else {
        // Om manuellt ändrat, behåll selected area men uppdatera detected
        onChange(inputValue, selectedArea, true, area);
      }
    } else {
      setDetectedArea(null);
      setSelectedArea(null);
      setIsManuallyChanged(false);
      setShowAreaSelector(false);
      onChange(inputValue, null, false, null);
    }
  };

  const handleAreaChange = (newArea: PriceAreaCode) => {
    setSelectedArea(newArea);
    setIsManuallyChanged(true);
    setShowAreaSelector(false);
    onChange(value, newArea, true, detectedArea);
  };

  const handleResetArea = () => {
    if (detectedArea) {
      setSelectedArea(detectedArea);
      setIsManuallyChanged(false);
      setShowAreaSelector(false);
      onChange(value, detectedArea, false, detectedArea);
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
      
      {isValid && selectedArea && (
        <div className="space-y-2">
          <div className={`p-3 border rounded-lg ${isManuallyChanged ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                <MapPin className={`w-4 h-4 ${isManuallyChanged ? 'text-amber-600' : 'text-blue-600'} mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${isManuallyChanged ? 'text-amber-800' : 'text-blue-800'}`}>
                      {isPriceAreaCode(selectedArea) ? PRICE_AREAS[selectedArea].name : selectedArea?.toUpperCase()}
                    </p>
                    {isManuallyChanged && (
                      <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        Manuellt valt
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${isManuallyChanged ? 'text-amber-600' : 'text-blue-600'}`}>
                    {isPriceAreaCode(selectedArea) ? PRICE_AREAS[selectedArea].description : ""}
                  </p>
                  {isManuallyChanged && detectedArea && detectedArea !== selectedArea && (
                    <p className="text-xs text-amber-600 mt-1">
                      Detekterat område: {isPriceAreaCode(detectedArea) ? PRICE_AREAS[detectedArea].name : detectedArea.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!showAreaSelector && (
                  <button
                    type="button"
                    onClick={() => setShowAreaSelector(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 hover:bg-blue-100 rounded transition-colors"
                    title="Ändra område"
                  >
                    <Edit2 className="w-3 h-3" />
                    Ändra
                  </button>
                )}
                {isManuallyChanged && (
                  <button
                    type="button"
                    onClick={handleResetArea}
                    className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 px-2 py-1 hover:bg-amber-100 rounded transition-colors"
                    title="Återställ till detekterat område"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {showAreaSelector && (
            <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Välj elområde</p>
                <button
                  type="button"
                  onClick={() => setShowAreaSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(PRICE_AREAS) as PriceAreaCode[]).map((areaCode) => (
                  <button
                    key={areaCode}
                    type="button"
                    onClick={() => handleAreaChange(areaCode)}
                    className={`text-left p-2 rounded border transition-colors ${
                      selectedArea === areaCode
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-sm font-medium">{PRICE_AREAS[areaCode].name}</p>
                    <p className="text-xs text-gray-600">{PRICE_AREAS[areaCode].description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
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
