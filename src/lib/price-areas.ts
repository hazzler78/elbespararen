// Mappning av svenska postnummer till elprisområden
// Baserat på Svenska Kraftnäts officiella prisområden

import { PREFIX_TO_AREA, POSTAL_EXCEPTIONS } from "./postal-to-area";

export type PriceAreaCode = 'se1' | 'se2' | 'se3' | 'se4';

export interface PriceArea {
  code: PriceAreaCode;
  name: string;
  description: string;
}

export function isPriceAreaCode(value: string): value is PriceAreaCode {
  return value === 'se1' || value === 'se2' || value === 'se3' || value === 'se4';
}

const DATASET_FALLBACK: PriceAreaCode = 'se3';

const POSTAL_EXCEPTIONS_MAP: Record<string, PriceAreaCode> = (() => {
  const map: Record<string, PriceAreaCode> = {};
  for (const [postal, area] of Object.entries(POSTAL_EXCEPTIONS)) {
    map[postal] = isPriceAreaCode(area) ? area : DATASET_FALLBACK;
  }
  return map;
})();

const PREFIX_AREA_MAP: Record<string, PriceAreaCode> = (() => {
  const map: Record<string, PriceAreaCode> = {};
  for (const [prefix, area] of Object.entries(PREFIX_TO_AREA)) {
    map[prefix] = isPriceAreaCode(area) ? area : DATASET_FALLBACK;
  }
  return map;
})();

export const PRICE_AREAS: Record<PriceAreaCode, PriceArea> = {
  se1: {
    code: 'se1',
    name: 'SE1 - Norra Norrland',
    description: 'Norrbotten och nordligaste delarna av Lappland'
  },
  se2: {
    code: 'se2',
    name: 'SE2 - Södra Norrland',
    description: 'Västerbotten, Jämtland, Västernorrland och norra Hälsingland'
  },
  se3: {
    code: 'se3',
    name: 'SE3 - Mellansverige',
    description: 'Stockholm, Mälardalen, Västra Götaland och större delen av Svealand'
  },
  se4: {
    code: 'se4',
    name: 'SE4 - Södra Sverige',
    description: 'Skåne, Blekinge, Småland, Öland och Gotland'
  }
};

const POSTAL_PREFIX_OVERRIDES: Record<string, PriceAreaCode> = {
  '10': 'se3',
  '11': 'se3',
  '12': 'se3',
  '13': 'se3',
  '14': 'se3',
  '15': 'se3',
  '16': 'se3',
  '17': 'se3',
  '18': 'se3',
  '19': 'se3',
  '186': 'se3'
};

interface PostalPrefixRule {
  min: number;
  max: number;
  area: PriceAreaCode;
}

const POSTAL_PREFIX_RULES: PostalPrefixRule[] = [
  { min: 10, max: 19, area: 'se3' },
  { min: 20, max: 29, area: 'se4' },
  { min: 30, max: 34, area: 'se3' },
  { min: 35, max: 39, area: 'se4' },
  { min: 40, max: 59, area: 'se3' },
  { min: 60, max: 69, area: 'se3' },
  { min: 70, max: 89, area: 'se2' },
  { min: 90, max: 99, area: 'se1' }
];

// Mappning av postnummer till prisområden
// Baserat på första 1-2 siffrorna i postnumret
export function getPriceAreaFromPostalCode(postalCode: string): PriceAreaCode {
  const code = postalCode.replace(/\s/g, '');
  const fallback: PriceAreaCode = DATASET_FALLBACK;

  if (code.length < 2 || /\D/.test(code)) {
    return fallback;
  }

  const exactArea = POSTAL_EXCEPTIONS_MAP[code];
  if (exactArea) {
    return exactArea;
  }

  const prefix2 = code.substring(0, 2);
  const prefix3 = code.length >= 3 ? code.substring(0, 3) : null;

  if (prefix3 && PREFIX_AREA_MAP[prefix3]) {
    return PREFIX_AREA_MAP[prefix3];
  }

  if (POSTAL_PREFIX_OVERRIDES[prefix2]) {
    return POSTAL_PREFIX_OVERRIDES[prefix2];
  }

  const firstTwoDigits = parseInt(prefix2, 10);

  if (Number.isNaN(firstTwoDigits)) {
    return fallback;
  }

  const match = POSTAL_PREFIX_RULES.find((rule) => firstTwoDigits >= rule.min && firstTwoDigits <= rule.max);

  if (match) {
    return match.area;
  }

  return fallback;
}

// Hjälpfunktion för att validera postnummer
export function isValidSwedishPostalCode(postalCode: string): boolean {
  const code = postalCode.replace(/\s/g, '');
  return /^\d{5}$/.test(code);
}

// Hjälpfunktion för att formatera postnummer
export function formatPostalCode(postalCode: string): string {
  const code = postalCode.replace(/\s/g, '');
  if (code.length === 5) {
    return `${code.substring(0, 3)} ${code.substring(3)}`;
  }
  return code;
}
