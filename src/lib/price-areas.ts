// Mappning av svenska postnummer till elprisområden
// Baserat på Svenska Kraftnäts officiella prisområden

export interface PriceArea {
  code: string;
  name: string;
  description: string;
}

export const PRICE_AREAS: Record<string, PriceArea> = {
  se1: {
    code: 'se1',
    name: 'SE1 - Norra Sverige',
    description: 'Lappland, Norrbotten, Västerbotten, Jämtland, Västernorrland'
  },
  se2: {
    code: 'se2', 
    name: 'SE2 - Mellansverige',
    description: 'Svealand, Stockholm, Uppsala, Södermanland, Västmanland, Dalarna, Gävleborg'
  },
  se3: {
    code: 'se3',
    name: 'SE3 - Sydvästra Sverige', 
    description: 'Västra Götaland, Halland, Värmland, Örebro'
  },
  se4: {
    code: 'se4',
    name: 'SE4 - Sydöstra Sverige',
    description: 'Skåne, Blekinge, Småland, Östergötland, Gotland'
  }
};

// Mappning av postnummer till prisområden
// Baserat på första 1-2 siffrorna i postnumret
export function getPriceAreaFromPostalCode(postalCode: string): string {
  // Ta bort eventuella mellanslag och konvertera till nummer
  const code = postalCode.replace(/\s/g, '');
  const firstDigits = parseInt(code.substring(0, 2));
  
  // SE1 - Norra Sverige (80xxx-99xxx)
  if (firstDigits >= 80 && firstDigits <= 99) {
    return 'se1';
  }
  
  // SE2 - Mellansverige (10xxx-79xxx, undantag för vissa)
  if (firstDigits >= 10 && firstDigits <= 79) {
    // Undantag för SE3 och SE4 områden
    if (firstDigits >= 40 && firstDigits <= 59) {
      return 'se3'; // Västra Götaland, Halland
    }
    if (firstDigits >= 20 && firstDigits <= 39) {
      return 'se4'; // Skåne, Blekinge, Småland, Östergötland
    }
    if (firstDigits >= 60 && firstDigits <= 69) {
      return 'se3'; // Värmland, Örebro
    }
    return 'se2'; // Stockholm, Uppsala, etc.
  }
  
  // Fallback till SE2 (Stockholm-området)
  return 'se2';
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
