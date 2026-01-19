/**
 * Password hashing and verification utilities
 * Uses Web Crypto API for Edge runtime compatibility
 */

/**
 * Hash a password using Web Crypto API (PBKDF2)
 * Compatible with Edge runtime
 */
export async function hashPassword(password: string): Promise<string> {
  // Convert password to ArrayBuffer
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive bits using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256 // 256 bits = 32 bytes
  );

  // Convert to hex strings
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return format: salt:hash (both hex encoded)
  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = hash.split(':');
    if (!saltHex || !hashHex) return false;

    // Convert hex strings back to ArrayBuffers
    const salt = new Uint8Array(
      saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    const expectedHash = new Uint8Array(
      hashHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    // Hash the provided password with the same salt
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256 // 256 bits = 32 bytes
    );

    const computedHash = new Uint8Array(hashBuffer);

    // Compare hashes (constant-time comparison)
    if (computedHash.length !== expectedHash.length) return false;
    
    let isEqual = true;
    for (let i = 0; i < computedHash.length; i++) {
      if (computedHash[i] !== expectedHash[i]) {
        isEqual = false;
      }
    }
    
    return isEqual;
  } catch (error) {
    console.error('[password] Error verifying password:', error);
    return false;
  }
}
