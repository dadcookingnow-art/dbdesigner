import { isTokenExpired } from './tokenUtils';

const API_BASE_URL = "http://localhost:8000/api";

interface ApiClientOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
    requireAuth?: boolean;
    signal?: AbortSignal;
}

class ApiClient {
    private baseURL: string;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    /**
     * 공통 API 요청 메서드
     * - 자동 토큰 유효성 체크
     * - 토큰 만료 시 자동 로그아웃
     * - 공통 에러 처리
     */
    async request<T = any>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
        const {
            method = 'GET',
            body,
            headers = {},
            requireAuth = true,
            signal
        } = options;

        // 토큰 체크 및 헤더 설정
        let finalHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...headers
        };

        if (requireAuth) {
            const token = localStorage.getItem('access_token');
            
            // 토큰이 없거나 만료된 경우
            if (!token || isTokenExpired(token)) {
                console.warn('토큰이 없거나 만료되었습니다. 로그아웃 처리합니다.');
                this.handleLogout();
                throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
            }

            finalHeaders['Authorization'] = `Bearer ${token}`;
        }

        // 캐시 방지 헤더 (GET 요청일 경우)
        if (method === 'GET') {
            finalHeaders['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            finalHeaders['Pragma'] = 'no-cache';
            finalHeaders['Expires'] = '0';
        }

        // URL 구성 (GET 요청에 타임스탬프 추가로 캐시 방지)
        let url = `${this.baseURL}${endpoint}`;
        if (method === 'GET' && !url.includes('?')) {
            url += `?_t=${Date.now()}`;
        } else if (method === 'GET' && url.includes('?')) {
            url += `&_t=${Date.now()}`;
        }

        const config: RequestInit = {
            method,
            headers: finalHeaders,
            signal, // AbortSignal 추가
        };

        if (body && method !== 'GET') {
            config.body = JSON.stringify(body);
        }

        try {
            console.log(`🌐 API 요청: ${method} ${url}`);
            
            const response = await fetch(url, config);
            
            console.log(`📡 API 응답: ${response.status} ${response.statusText}`);

            // 401 에러 처리
            if (response.status === 401) {
                if (requireAuth) {
                    // 인증이 필요한 요청에서 401 → 토큰 만료
                    this.handleLogout();
                    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
                } else {
                    // 인증이 필요없는 요청에서 401 → 로그인 실패 등
                    throw new Error('로그인 정보가 올바르지 않습니다.');
                }
            }

            // 기타 HTTP 에러 처리
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
            }

            // 응답이 비어있는 경우 (DELETE 등)
            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return {} as T;
            }

            const data = await response.json();
            console.log(`✅ API 성공:`, data);
            return data;

        } catch (error: any) {
            console.error(`🚨 API 요청 실패: ${method} ${url}`, error);
            throw error;
        }
    }

    /**
     * 로그아웃 처리 (토큰 삭제 및 로그인 페이지 이동)
     */
    private handleLogout() {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('pending_register');
        
        // 현재 페이지가 로그인/회원가입 페이지가 아닌 경우에만 리다이렉트
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
        }
    }

    // 편의 메서드들
    async get<T = any>(endpoint: string, options: Omit<ApiClientOptions, 'method'> = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    async post<T = any>(endpoint: string, body?: any, options: Omit<ApiClientOptions, 'method' | 'body'> = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'POST', body });
    }

    async put<T = any>(endpoint: string, body?: any, options: Omit<ApiClientOptions, 'method' | 'body'> = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'PUT', body });
    }

    async delete<T = any>(endpoint: string, options: Omit<ApiClientOptions, 'method'> = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

// 싱글톤 인스턴스 생성
export const apiClient = new ApiClient();
export default apiClient;