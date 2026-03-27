import type { DefaultSession, DefaultUser } from "next-auth"
import type { DefaultJWT } from "next-auth/jwt"

type Region = "BD" | "US" | null
type Role   = "USER" | "ADMIN"

declare module "next-auth" {
  interface Session {
    user: {
      id:     string
      region: Region
      role:   Role
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    region?: Region
    role?:   Role
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?:     string
    region?: Region
    role?:   Role
  }
}
