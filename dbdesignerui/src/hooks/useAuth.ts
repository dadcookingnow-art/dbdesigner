import { useState, useEffect } from "react";
import { User, LoginForm, RegisterForm, VerificationForm } from "../types";
import { authService } from "../services/authService";
import { projectService } from "../services/projectService";
import { isTokenExpired } from "../utils/tokenUtils";

type AuthState = "loading" | "unauthenticated" | "authenticated";

interface UseAuthReturn {
    user: User | null;
    authState: AuthState;
    projects: any[];
    login: (loginData: LoginForm) => Promise<void>;
    register: (registerData: RegisterForm) => Promise<void>;
    verify: (verificationData: VerificationForm) => Promise<void>;
    createProject: (name: string, dbType: string) => Promise<void>;
    deleteProject: (projectId: string) => Promise<void>;
    refreshProjects: () => Promise<void>;
    logout: () => void;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(null);
    const [authState, setAuthState] = useState<AuthState>("loading");
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        const checkAuthStatus = () => {
            const savedUser = localStorage.getItem("auth_user");
            const token = localStorage.getItem("access_token");

            if (savedUser && token) {
                try {
                    const parsedUser = JSON.parse(savedUser);
                    
                    // 토큰 만료 체크
                    if (isTokenExpired(token)) {
                        console.log("토큰이 만료되었습니다. 로그아웃 처리합니다.");
                        // 만료된 토큰과 사용자 정보 제거
                        localStorage.removeItem("auth_user");
                        localStorage.removeItem("access_token");
                        localStorage.removeItem("pending_register");
                        setUser(null);
                        setProjects([]);
                        setAuthState("unauthenticated");
                        // 로그인 페이지로 리다이렉트 (패스워드 재설정 페이지는 예외)
                        const allowedPaths = ['/login', '/register', '/password-reset/request', '/password-reset/confirm'];
                        if (!allowedPaths.includes(window.location.pathname)) {
                            window.location.href = '/login';
                        }
                        return;
                    }
                    
                    // 토큰이 유효하면 인증된 상태로 설정
                    setUser(parsedUser);
                    setAuthState("authenticated");
                } catch (error) {
                    console.error("사용자 정보 파싱 오류:", error);
                    localStorage.removeItem("auth_user");
                    localStorage.removeItem("access_token");
                    setAuthState("unauthenticated");
                }
            } else {
                setAuthState("unauthenticated");
            }
        };

        checkAuthStatus();
    }, []);

    const login = async (loginData: LoginForm): Promise<void> => {
        try {
            const response = await authService.login(loginData);
            
            const user: User = {
                id: response.user_id || `user_${Date.now()}`,
                email: response.email || loginData.email,
                nickname: response.nickname || loginData.email.split("@")[0],
                isVerified: true,
            };

            localStorage.setItem("auth_user", JSON.stringify(user));
            
            // JWT 토큰 저장
            if (response.access_token) {
                localStorage.setItem("access_token", response.access_token);
            }
            
            setUser(user);
            setAuthState("authenticated");
            
            // 로그인 성공 후 프로젝트 목록으로 이동
            window.location.href = '/projects';
        } catch (error) {
            throw error;
        }
    };

    const register = async (registerData: RegisterForm): Promise<void> => {
        try {
            await authService.register(registerData);
            localStorage.setItem(
                "pending_register",
                JSON.stringify(registerData)
            );
        } catch (error) {
            throw error;
        }
    };

    const verify = async (
        verificationData: VerificationForm
    ): Promise<void> => {
        try {
            const response = await authService.verify(verificationData);
            
            // API 응답에서 사용자 정보 생성
            const newUser: User = {
                id: response.user_id || `user_${Date.now()}`,
                email: response.email || verificationData.email,
                nickname: response.nickname || verificationData.email.split("@")[0],
                isVerified: true,
            };

            localStorage.setItem("auth_user", JSON.stringify(newUser));
            localStorage.removeItem("pending_register");
            
            // JWT 토큰 저장
            if (response.access_token) {
                localStorage.setItem("access_token", response.access_token);
            }
            
            setUser(newUser);
            
            // 인증 성공 후 프로젝트 목록 가져오기
            try {
                const userProjects = await projectService.getProjects();
                setProjects(userProjects);
            } catch (projectError) {
                console.warn("프로젝트 목록 가져오기 실패:", projectError);
                setProjects([]); // 실패해도 빈 배열로 설정
            }
            
            setAuthState("authenticated");
            
            // 인증 성공 후 프로젝트 목록으로 이동
            window.location.href = '/projects';
        } catch (error) {
            throw error;
        }
    };

    const createProject = async (name: string, dbType: string): Promise<void> => {
        try {
            const newProject = await projectService.createProject(name, dbType);
            setProjects(prev => [...prev, newProject]);
            
            // 프로젝트 목록 재조회하여 최신 상태로 동기화
            await refreshProjects();
        } catch (error) {
            console.error("프로젝트 생성 실패:", error);
            throw error;
        }
    };

    const deleteProject = async (projectId: string): Promise<void> => {
        try {
            await projectService.deleteProject(projectId);
            
            // 로컬 상태에서 해당 프로젝트 제거
            setProjects(prev => prev.filter(project => project.id !== projectId));
            
            // 프로젝트 목록 재조회하여 최신 상태로 동기화
            await refreshProjects();
        } catch (error) {
            console.error("프로젝트 삭제 실패:", error);
            throw error;
        }
    };

    const refreshProjects = async (): Promise<void> => {
        try {
            const userProjects = await projectService.getProjects();
            setProjects(userProjects);
        } catch (error) {
            console.warn("프로젝트 목록 새로고침 실패:", error);
            throw error;
        }
    };

    const logout = (): void => {
        localStorage.removeItem("auth_user");
        localStorage.removeItem("pending_register");
        localStorage.removeItem("access_token");
        setUser(null);
        setProjects([]);
        setAuthState("unauthenticated");
        window.location.href = '/login';
    };

    return {
        user,
        authState,
        projects,
        login,
        register,
        verify,
        createProject,
        deleteProject,
        refreshProjects,
        logout,
    };
}
