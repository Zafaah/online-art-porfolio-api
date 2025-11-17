import { jwtVerify, SignJWT } from "jose"

export const SECRET_KEY = new TextEncoder().encode('your-secret-key')

export const generalToken = async (user: { userName: string, role: string }) => {
   return await new SignJWT({ userName: user.userName, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(SECRET_KEY);
};

export const verifyToken = async (token: string) => {
   return await jwtVerify(token, SECRET_KEY);
}