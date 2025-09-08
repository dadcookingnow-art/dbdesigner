// JWT 토큰 디코딩 및 만료 체크 유틸리티

interface JWTPayload {
    sub: string;
    exp: number;
    iat?: number;
}

/**
 * JWT 토큰을 디코딩합니다 (서명 검증 없이 클라이언트에서 만료 시간만 확인)
 */
export function decodeJWT(token: string): JWTPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        // Base64URL 디코딩
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded) as JWTPayload;
    } catch (error) {
        console.error('JWT 토큰 디코딩 실패:', error);
        return null;
    }
}

/**
 * JWT 토큰이 만료되었는지 확인합니다
 */
export function isTokenExpired(token: string): boolean {
    if (!token) return true;

    const payload = decodeJWT(token);
    if (!payload || !payload.exp) {
        return true;
    }

    // exp는 초 단위이므로 1000을 곱해서 밀리초로 변환
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();

    return currentTime >= expirationTime;
}

/**
 * 토큰의 남은 유효 시간을 분 단위로 반환합니다
 */
export function getTokenExpiryMinutes(token: string): number | null {
    if (!token) return null;

    const payload = decodeJWT(token);
    if (!payload || !payload.exp) {
        return null;
    }

    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const remainingTime = expirationTime - currentTime;

    return remainingTime > 0 ? Math.floor(remainingTime / (1000 * 60)) : 0;
}