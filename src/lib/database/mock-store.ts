/**
 * Shared store for MockDatabase data in Edge runtime
 * Edge runtime creates isolated contexts per request, so we need a different approach
 * This uses a module-level variable that persists across requests in the same worker
 */

interface MockUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  googleId?: string;
  passwordHash?: string;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  subscriptionStartedAt?: Date;
  subscriptionExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Module-level store that persists across requests in the same worker
// This works because Edge runtime reuses the same module instance within a worker
class MockStore {
  private users: MockUser[] = [];
  private instanceId: string;

  constructor() {
    this.instanceId = `store-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[MockStore] Created new store: ${this.instanceId}`);
  }

  getUsers(): MockUser[] {
    return this.users;
  }

  getUserByEmail(email: string): MockUser | undefined {
    return this.users.find(u => u.email === email);
  }

  getUserById(id: string): MockUser | undefined {
    return this.users.find(u => u.id === id);
  }

  createOrUpdateUser(userData: {
    email: string;
    name?: string;
    image?: string;
    googleId?: string;
    passwordHash?: string;
  }): MockUser {
    const existing = this.users.find(u => u.email === userData.email);
    const now = new Date();

    if (existing) {
      // Update existing user
      existing.name = userData.name !== undefined ? userData.name : existing.name;
      existing.image = userData.image !== undefined ? userData.image : existing.image;
      existing.googleId = userData.googleId !== undefined ? userData.googleId : existing.googleId;
      existing.updatedAt = now;
      if (userData.passwordHash !== undefined) {
        existing.passwordHash = userData.passwordHash;
      }
      return existing;
    } else {
      // Create new user
      const newUser: MockUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email,
        name: userData.name,
        image: userData.image,
        googleId: userData.googleId,
        passwordHash: userData.passwordHash,
        subscriptionTier: 'free',
        createdAt: now,
        updatedAt: now,
      };
      this.users.push(newUser);
      return newUser;
    }
  }

  deleteUser(email: string): boolean {
    const initialLength = this.users.length;
    this.users = this.users.filter(u => u.email !== email);
    return this.users.length < initialLength;
  }

  clearAll(): number {
    const count = this.users.length;
    this.users = [];
    return count;
  }

  getInstanceId(): string {
    return this.instanceId;
  }
}

// Create a single store instance at module level
// This should persist across requests in the same worker
let storeInstance: MockStore | null = null;

export function getMockStore(): MockStore {
  if (!storeInstance) {
    storeInstance = new MockStore();
  }
  return storeInstance;
}
