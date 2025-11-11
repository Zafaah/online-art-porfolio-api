import { jwtVerify, decodeJwt } from "jose";

const SECRETE_KEY = new TextEncoder().encode("your-secret-key");

export const authMiddleware = async (c: any, next: any) => {
   const readAuthHeader = () => {
      const headers: any = c.req?.headers ?? c.request?.headers ?? c.headers;
      let auth: string | undefined;
      if (headers) {
         if (typeof headers.get === 'function') {
            auth = headers.get('authorization') ?? headers.get('Authorization');
         } else {
            auth = headers['authorization'] ?? headers['Authorization'];
         }
      }
      if (!auth && typeof c.header === 'function') {
         auth = c.header('authorization') ?? c.header('Authorization');
      }
      return auth;
   };

   try {
      const authHeader = readAuthHeader();
      console.log("Auth Header:", authHeader);
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
         // No token provided
         c.status(401);
         return c.json({ message: 'Token missing. Please login.' });
      }

      const token = authHeader.split(' ')[1] as string;

      const { payload } = await jwtVerify(token, SECRETE_KEY);
      c.set('user', payload);
      await next();
   } catch (error) {
      // Try to decode token to determine if it's expired
      try {
         const authHeader = readAuthHeader();
         const token = authHeader?.split(' ')[1];
         if (token) {
            const decoded: any = decodeJwt(token);
            const issuedAt = decoded.iat ? new Date(Number(decoded.iat) * 1000).toISOString() : null;
            const expiresAt = decoded.exp ? new Date(Number(decoded.exp) * 1000).toISOString() : null;
            const isExpired = decoded.exp ? (Number(decoded.exp) * 1000) < Date.now() : false;
            c.status(401);
            if (isExpired) {
               return c.json({ message: 'Token expired. Please login again.', issuedAt, expiresAt });
            }
            return c.json({ message: 'Invalid token', issuedAt, expiresAt });
         }
      } catch (e) {
         // ignore decode errors
      }

      c.status(401);
      return c.json({ message: 'Invalid token' });
   }
}