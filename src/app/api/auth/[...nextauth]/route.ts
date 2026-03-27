import { handlers } from "@/auth"

// Export GET and POST so Next.js App Router can handle all NextAuth endpoints:
//   /api/auth/signin
//   /api/auth/signout
//   /api/auth/callback/google
//   /api/auth/callback/nodemailer
//   /api/auth/session
//   /api/auth/csrf
//   /api/auth/providers
export const { GET, POST } = handlers
