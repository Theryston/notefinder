import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { User } from '@prisma/client';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as User).username;
        token.emailVerified = (user as User).emailVerified;

        const account = await prisma.account.findFirst({
          where: { userId: user.id },
        });

        token.provider = account?.provider;
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as User).username = token.username as string;
      session.user.emailVerified = token.emailVerified as Date | null;
      (session.user as unknown as { provider: string }).provider =
        token.provider as string;

      return session;
    },
  },
  providers: [
    Google,
    Credentials({
      credentials: {
        emailOrUsername: { label: 'Email ou username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        hashedPassword: { label: 'Hashed Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const hashedPassword = credentials.hashedPassword as string;

        if (!credentials?.emailOrUsername || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const emailOrUsername = credentials.emailOrUsername as string;
        const password = credentials.password as string;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
          },
        });

        if (!user) {
          throw new Error('User not found');
        }

        if (!user.password) {
          throw new Error('User has no password');
        }

        const passwordsMatch = hashedPassword
          ? hashedPassword === user.password
          : await compare(password, user.password);

        if (!passwordsMatch) {
          throw new Error('Invalid password');
        }

        return user;
      },
    }),
  ],
});
