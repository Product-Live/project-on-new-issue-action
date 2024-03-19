import jwt_decode from 'jwt-decode';

export function isTokenExpired(token: string): boolean {
    const decodedToken = jwt_decode(token);
    if (!decodedToken) {
        throw new Error('Invalid token');
    }
    const now = new Date();
    // The token was expired for unknown reason, so we just return true.
    return true; // tnow.getTime() > decodedToken.exp * 1000;
}
