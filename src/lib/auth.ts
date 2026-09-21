import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  throw new Error(
    'CRITICAL CONFIGURATION ERROR: NEXTAUTH_SECRET or AUTH_SECRET environment variable is missing. Please define it in your .env file.'
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (isValid) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
  secret: authSecret,
};

/**
 * Helper to enforce ADMIN role in API Route Handlers.
 * Returns { session } on success, or { error: NextResponse } on failure.
 */
export async function requireAdminApi() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, message: 'Unauthorized. Silakan masuk terlebih dahulu.' },
        { status: 401 }
      ),
    };
  }

  if ((session.user as any).role !== 'ADMIN') {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, message: 'Forbidden. Akses khusus Administrator.' },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}

/**
 * Helper to enforce ADMIN role in React Server Components under /admin.
 * Automatically redirects unauthenticated users to /login and non-admins to /.
 */
export async function requireAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  if ((session.user as any).role !== 'ADMIN') {
    redirect('/');
  }

  return session;
}
