// Hjälpfunktioner för att konvertera bilder till base64

/**
 * Konvertera en bildfil till base64
 */
export function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Konvertera en bild-URL till base64
 */
export async function convertImageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Kunde inte konvertera bild: ${error}`);
  }
}

/**
 * Validera att en base64-sträng är giltig
 */
export function validateBase64(base64: string): boolean {
  try {
    // Kontrollera att det är en giltig base64-sträng
    const base64Regex = /^data:image\/(jpeg|jpg|png|gif);base64,/;
    return base64Regex.test(base64);
  } catch {
    return false;
  }
}
