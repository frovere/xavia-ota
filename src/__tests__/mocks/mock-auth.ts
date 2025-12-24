import { vi } from 'vitest';

type MockSession = {
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
  };
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null | undefined;
  };
};

export const mockGetSession = vi.fn().mockReturnValue({
  session: {
    id: 'session_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user_123',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    token: 'token_abc',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
  },
  user: {
    id: 'user_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    email: 'user@example.com',
    emailVerified: true,
    name: 'Test User',
    image: null,
  },
} as MockSession);
