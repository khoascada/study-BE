declare namespace Express {
  interface Request {
    requestId?: string;
    user?: {
      id: number;
      email: string;
      role: string;
      jti: string;
    };
  }
}
