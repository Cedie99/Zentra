import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/client'
import { encrypt } from '@/lib/utils/encryption'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Store the encrypted GitHub token on the user record after OAuth
      if (account?.provider === 'github' && account.access_token && user.id) {
        const encryptedToken = encrypt(account.access_token)
        await prisma.user.update({
          where: { id: user.id },
          data: { githubToken: encryptedToken },
        })
      }
      return true
    },

    async jwt({ token, user, trigger }) {
      // On sign-in the `user` object is populated — lock in the user id immediately
      if (user?.id) {
        token.id = user.id
        // Clear any leftover plan from a previous session (different user)
        token.plan = undefined
      }

      const userId = token.id as string | undefined
      if (!userId) return token

      // Refresh from DB on sign-in (trigger === 'signIn') or on explicit update,
      // and also whenever plan is missing (first load after token was just created).
      if (trigger === 'signIn' || trigger === 'update' || token.plan === undefined) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { plan: true, name: true, email: true, image: true },
        })
        if (!dbUser) return token
        token.plan  = dbUser.plan
        token.name  = dbUser.name
        token.email = dbUser.email
        token.picture = dbUser.image
      }

      return token
    },

    async session({ session, token }) {
      session.user.id    = token.id as string
      session.user.plan  = (token.plan as string) ?? 'FREE'
      session.user.name  = token.name as string | null
      session.user.email = (token.email as string | null) ?? ''
      session.user.image = token.picture as string | null
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    // Shorten the session so stale data doesn't linger too long
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
})
