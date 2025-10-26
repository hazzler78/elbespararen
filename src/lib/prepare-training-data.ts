// Verktyg för att förbereda dina fakturor för träning

import { TrainingInvoice } from './training';

/**
 * Exempel på hur du konverterar dina fakturor
 */
export function prepareYourInvoices(): TrainingInvoice[] {
  // Här lägger du in dina fakturor - ersätt med dina riktiga data:
  const yourInvoices: TrainingInvoice[] = [
    // E.ON Faktura 1 - Augusti 2025
    {
      id: 'eon-2025-08',
      provider: 'EON',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Din första E.ON faktura som base64
      expectedResult: {
        elnatCost: 575.89, // E.ON Energidistribution AB total
        elhandelCost: 191.60, // Spotpris (grundläggande energikostnad)
        extraFeesDetailed: [
          { label: 'Rörliga kostnader', amount: 17.53 },
          { label: 'Fast påslag', amount: 17.02 },
          { label: 'Elavtal årsavgift', amount: 44.84 }
        ],
        totalAmount: 1059.00, // Belopp att betala
        totalKWh: 425, // Förbrukning
        period: '2025-08', // Augusti 2025
        contractType: 'rörligt' // Timpris = rörligt
      },
      confidence: 0.95 // 100% säker på dessa siffror
    },
    // E.ON Faktura 2 - Januari 2025
    {
      id: 'eon-2025-01',
      provider: 'EON',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Din andra E.ON faktura som base64
      expectedResult: {
        elnatCost: 2066.51, // E.ON Energidistribution AB total
        elhandelCost: 1367.14, // Medelspotpris (grundläggande energikostnad)
        extraFeesDetailed: [
          { label: 'Rörliga kostnader', amount: 192.44 },
          { label: 'Fast påslag', amount: 86.20 },
          { label: 'Elavtal årsavgift', amount: 56.05 },
          { label: 'E.ON Elna™', amount: 49.00 }
        ],
        totalAmount: 3817.00, // Belopp att betala
        totalKWh: 1724, // Förbrukning
        period: '2025-01', // Januari 2025
        contractType: 'rörligt' // Rörligt pris
      },
      confidence: 0.99 // 100% säker på dessa siffror
    },
    // E.ON Faktura 3 - September 2025
    {
      id: 'eon-2025-09',
      provider: 'EON',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Din tredje E.ON faktura som base64
      expectedResult: {
        elnatCost: 388.37, // Totalt E.ON Energidistribution AB
        elhandelCost: 172.59, // El (8.80) + Medelspotpris (163.79)
        extraFeesDetailed: [
          { label: 'Rörliga kostnader', amount: 20.16 },
          { label: 'Fast påslag', amount: 13.92 },
          { label: 'Elavtal årsavgift', amount: 31.56 }
        ],
        totalAmount: 783.00, // Belopp att betala
        totalKWh: 240, // Förbrukning
        period: '2025-09', // September 2025
        contractType: 'rörligt' // Rörligt pris
      },
      confidence: 0.99 // 100% säker på dessa siffror
    },
    // E.ON Faktura 4 - Augusti 2025 (Ny faktura)
    {
      id: 'eon-2025-08-2',
      provider: 'EON',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Din fjärde E.ON faktura som base64
      expectedResult: {
        elnatCost: 524.73, // Totalt E.ON Energidistribution AB
        elhandelCost: 173.81, // Spotpris (grundläggande energikostnad)
        extraFeesDetailed: [
          { label: 'Rörliga kostnader', amount: 14.32 },
          { label: 'Fast påslag', amount: 20.85 },
          { label: 'Elavtal årsavgift', amount: 32.61 },
          { label: 'Kampanjrabatt månad', amount: -46.67 }
        ],
        totalAmount: 900.00, // Belopp att betala
        totalKWh: 348, // Förbrukning
        period: '2025-08', // Augusti 2025
        contractType: 'rörligt' // Rörligt pris (Timpris)
      },
      confidence: 0.99 // 100% säker på dessa siffror
    },
    // E.ON Faktura 5 - December 2024
    {
      id: 'eon-2024-12',
      provider: 'EON',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Din femte E.ON faktura som base64
      expectedResult: {
        elnatCost: 1461.95, // Totalt E.ON Energidistribution AB
        elhandelCost: 864.14, // Medelspotpris (grundläggande energikostnad)
        extraFeesDetailed: [
          { label: 'Rörliga kostnader', amount: 106.37 },
          { label: 'Fast påslag', amount: 73.44 },
          { label: 'Elavtal årsavgift', amount: 31.56 }
        ],
        totalAmount: 3172.00, // Belopp att betala
        totalKWh: 1224, // Förbrukning
        period: '2024-12', // December 2024
        contractType: 'rörligt' // Rörligt pris
      },
      confidence: 0.99 // 100% säker på dessa siffror
    },
    // E.ON Faktura 6 - Maj 2025
    {
      id: 'eon-2025-05',
      provider: 'EON',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Din sjätte E.ON faktura som base64
      expectedResult: {
        elnatCost: 677.61, // Totalt E.ON Energidistribution AB
        elhandelCost: 191.08, // Medelspotpris (grundläggande energikostnad)
        extraFeesDetailed: [
          { label: 'Rörliga kostnader', amount: 29.55 },
          { label: 'Fast påslag', amount: 17.80 },
          { label: 'Elavtal årsavgift', amount: 36.69 }
        ],
        totalAmount: 1191.00, // Belopp att betala
        totalKWh: 445, // Förbrukning
        period: '2025-05', // Maj 2025
        contractType: 'rörligt' // Rörligt pris
      },
      confidence: 0.99 // 100% säker på dessa siffror
    },
    // Fortum Faktura 1 - September 2025
    {
      id: 'fortum-2025-09',
      provider: 'Fortum',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Din Fortum faktura som base64
      expectedResult: {
        elnatCost: 488.61, // Elnätskostnad från Fortum-fakturan
        elhandelCost: 488.61, // 63,40 öre/kWh * 770,66 kWh = 488,61 kr (grundläggande energikostnad)
        extraFeesDetailed: [
          { label: 'Elcertifikat', amount: 16.95 },
          { label: 'Månadsavgift', amount: 39.20 },
          { label: 'Fossilfri', amount: 0.00 },
          { label: 'Priskollen', amount: 39.20 }
        ],
        totalAmount: 729.95, // Total summa från Fortum-fakturan
        totalKWh: 770.66, // Förbrukning från Fortum-fakturan
        period: '2025-09', // September 2025
        contractType: 'rörligt' // Rörligt avtal
      },
      confidence: 0.99 // 100% säker på dessa siffror
    },
    // Fortum Faktura 2 - Februari 2025
    {
      id: 'fortum-2025-02',
      provider: 'Fortum',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Din andra Fortum faktura som base64
      expectedResult: {
        elnatCost: 0, // Ingen elnätskostnad på denna elhandelsfaktura
        elhandelCost: 1111.77, // El: 1028,46 kWh @ 108,10 öre/kWh
        extraFeesDetailed: [
          { label: 'Månadsavgift', amount: 55.20 },
          { label: 'Fossilfri ingår', amount: 0.00 }
        ],
        totalAmount: 1458.71, // Belopp att betala
        totalKWh: 1028.46, // Förbrukning
        period: '2025-02', // Februari 2025
        contractType: 'rörligt' // Vintertrygg = rörligt
      },
      confidence: 0.99 // 100% säker på dessa siffror
    },
    // Fortum Faktura 3 - Augusti 2025
    {
      id: 'fortum-2025-08',
      provider: 'Fortum',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Din tredje Fortum faktura som base64
      expectedResult: {
        elnatCost: 0, // Ingen elnätskostnad på denna elhandelsfaktura
        elhandelCost: 309.10, // El månadsmätt/månadsprissatt
        extraFeesDetailed: [
          { label: 'Elcertifikat', amount: 11.04 },
          { label: 'Månadsavgift', amount: 55.20 },
          { label: 'Påslag', amount: 11.62 },
          { label: 'Miljöpaket', amount: 36.00 },
          { label: 'Priskollen', amount: 39.20 },
          { label: 'Miljöpaket, påslag förnybar el', amount: 32.07 }
        ],
        totalAmount: 617.80, // Belopp att betala
        totalKWh: 581, // Förbrukning
        period: '2025-08', // Augusti 2025
        contractType: 'rörligt' // Rörligt elpris
      },
      confidence: 0.99 // 100% säker på dessa siffror
    },
    // Fortum Faktura 4 - September 2025 (Ny faktura)
    {
      id: 'fortum-2025-09-2',
      provider: 'Fortum',
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Din fjärde Fortum faktura som base64
      expectedResult: {
        elnatCost: 0, // Ingen elnätskostnad på denna elhandelsfaktura
        elhandelCost: 95.83, // El timmätt/månadsprissatt
        extraFeesDetailed: [
          { label: 'Elcertifikat', amount: 3.26 },
          { label: 'Månadsavgift', amount: 39.20 },
          { label: 'Fossilfri', amount: 0.00 }
        ],
        totalAmount: 172.87, // Belopp att betala
        totalKWh: 148.35, // Förbrukning
        period: '2025-09', // September 2025
        contractType: 'rörligt' // Rörligt elpris
      },
      confidence: 0.99 // 100% säker på dessa siffror
    }
    // Lägg till fler fakturor här...
  ];

  return yourInvoices;
}

/**
 * Hjälpfunktion för att konvertera från ditt nuvarande format
 */
export function convertFromYourFormat(yourData: any[]): TrainingInvoice[] {
  return yourData.map((invoice, index) => ({
    id: `invoice-${index + 1}`,
    provider: detectProvider(invoice), // Se funktionen nedan
    image: invoice.imageBase64 || invoice.imageUrl,
    expectedResult: {
      elnatCost: invoice.correctElnatCost,
      elhandelCost: invoice.correctElhandelCost, 
      extraFeesDetailed: invoice.correctExtraFees,
      totalAmount: invoice.correctTotalAmount,
      totalKWh: invoice.correctTotalKWh,
      period: invoice.correctPeriod,
      contractType: invoice.correctContractType
    },
    confidence: invoice.confidence || 0.8
  }));
}

/**
 * Automatisk leverantörsdetektering
 */
function detectProvider(invoice: any): string {
  const imageText = invoice.imageText || '';
  const provider = invoice.provider || '';
  
  // Kända leverantörer
  const providers = [
    'Fortum', 'EON', 'Vattenfall', 'Greenely', 'Tibber', 
    'Cheap Energy', 'Ellevio', 'Svealands El', 'Stockholms El'
  ];
  
  for (const p of providers) {
    if (imageText.toLowerCase().includes(p.toLowerCase()) || 
        provider.toLowerCase().includes(p.toLowerCase())) {
      return p;
    }
  }
  
  return 'Okänd';
}

/**
 * Validera att dina data är korrekta
 */
export function validateTrainingData(invoices: TrainingInvoice[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (invoices.length === 0) {
    errors.push('Inga fakturor hittades');
    return { isValid: false, errors };
  }
  
  for (const invoice of invoices) {
    if (!invoice.id) errors.push(`Faktura saknar ID`);
    if (!invoice.provider) errors.push(`Faktura ${invoice.id} saknar leverantör`);
    if (!invoice.image) errors.push(`Faktura ${invoice.id} saknar bild`);
    if (invoice.expectedResult.totalAmount <= 0) errors.push(`Faktura ${invoice.id} har ogiltigt totalAmount`);
    if (invoice.expectedResult.totalKWh <= 0) errors.push(`Faktura ${invoice.id} har ogiltigt totalKWh`);
    if (invoice.confidence < 0 || invoice.confidence > 1) errors.push(`Faktura ${invoice.id} har ogiltigt confidence`);
  }
  
  return { isValid: errors.length === 0, errors };
}
