import { LoginForm, RegisterForm, VerificationForm, User } from "../types";
import { apiClient } from "../utils/apiClient";

interface AuthResponse {
    user?: User;
    message?: string;
    user_id?: string;
    email?: string;
    nickname?: string;
    access_token?: string;
    token_type?: string;
}

export const authService = {
    async login(loginData: LoginForm): Promise<AuthResponse> {
        try {
            return await apiClient.post<AuthResponse>('/user/auth/login', loginData, { requireAuth: false });
        } catch (error: any) {
            throw new Error("로그인에 실패했습니다.");
        }
    },

    async register(registerData: RegisterForm): Promise<AuthResponse> {
        try {
            return await apiClient.post<AuthResponse>('/user/auth/register', registerData, { requireAuth: false });
        } catch (error: any) {
            // 에러 메시지 파싱
            if (error.message.includes('400')) {
                if (error.message.toLowerCase().includes('email') && error.message.toLowerCase().includes('already')) {
                    throw new Error("이미 사용중인 이메일입니다.");
                }
                if (error.message.toLowerCase().includes('nickname') && error.message.toLowerCase().includes('already')) {
                    throw new Error("이미 사용중인 닉네임입니다.");
                }
            }
            throw new Error("회원가입에 실패했습니다.");
        }
    },

    async verify(verificationData: VerificationForm): Promise<AuthResponse> {
        try {
            return await apiClient.post<AuthResponse>('/user/auth/verify', verificationData, { requireAuth: false });
        } catch (error: any) {
            throw new Error("인증에 실패했습니다.");
        }
    },
};
