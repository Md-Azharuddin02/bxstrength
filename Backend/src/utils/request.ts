import type { Request } from 'express';

export function readCookie(req: Request, name: string): string {
  const match = (req.headers.cookie || '').split('; ').find(c => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

export function bearerToken(req: Request): string {
  const authHeader = req.headers['authorization'];
  return (authHeader && authHeader.split(' ')[1]) || '';
}
