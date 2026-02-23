import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { redis } from './redis';
import * as bcrypt from 'bcryptjs';

// ===== RATE LIMITER (FIX: brute-force protection) =====
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 900; // 15 minutes

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:login:${ip}`;
  try {
    const attempts = await redis.incr(key);
    if (attempts === 1) await redis.expire(key, RATE_LIMIT_WINDOW);
    return { allowed: attempts <= RATE_LIMIT_MAX, remaining: Math.max(0, RATE_LIMIT_MAX - attempts) };
  } catch {
    // If Redis is down, allow the request but log warning
    console.warn('[AUTH] Redis unavailable for rate limiting');
    return { allowed: true, remaining: RATE_LIMIT_MAX };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // FIX: Rate limiting by IP
        const forwarded = req?.headers?.['x-forwarded-for'];
        const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '127.0.0.1';

        const { allowed } = await checkRateLimit(ip);
        if (!allowed) {
          throw new Error('Too many login attempts. Try again in 15 minutes.');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        // FIX: Track login IP + timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            lastLoginIp: ip,
          },
        });

        // Reset rate limit on success
        try { await redis.del(`ratelimit:login:${ip}`); } catch {}

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 4 * 60 * 60, // FIX: Reduced from 24h to 4h
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
