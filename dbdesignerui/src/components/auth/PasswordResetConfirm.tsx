import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../../utils/apiClient";

export default function PasswordResetConfirm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const emailFromUrl = searchParams.get('email') || '';
    
    const [formData, setFormData] = useState({
        email: emailFromUrl,
        reset_code: "",
        new_password: "",
        confirm_password: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setMessage("");

        // 패스워드 확인 검증
        if (formData.new_password !== formData.confirm_password) {
            setError("새 패스워드가 일치하지 않습니다.");
            setIsLoading(false);
            return;
        }

        // 패스워드 강도 검증
        if (formData.new_password.length < 6) {
            setError("패스워드는 6자 이상이어야 합니다.");
            setIsLoading(false);
            return;
        }

        try {
            await apiClient.post('/user/auth/password-reset/confirm', {
                email: formData.email,
                reset_code: formData.reset_code,
                new_password: formData.new_password
            }, { requireAuth: false });

            setMessage("패스워드가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.");
            // 2초 후 로그인 페이지로 이동
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err) {
            setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        패스워드 재설정
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        이메일로 받은 6자리 코드와 새 패스워드를 입력하세요
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                이메일 주소
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="이메일 주소"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="reset_code" className="block text-sm font-medium text-gray-700 mb-1">
                                재설정 코드
                            </label>
                            <input
                                id="reset_code"
                                name="reset_code"
                                type="text"
                                required
                                maxLength={6}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-2xl tracking-widest"
                                placeholder="000000"
                                value={formData.reset_code}
                                onChange={handleChange}
                            />
                            <p className="text-xs text-gray-500 mt-1">이메일로 받은 6자리 숫자를 입력하세요</p>
                        </div>
                        <div>
                            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                                새 패스워드
                            </label>
                            <input
                                id="new_password"
                                name="new_password"
                                type="password"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="새 패스워드 (6자 이상)"
                                value={formData.new_password}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                                패스워드 확인
                            </label>
                            <input
                                id="confirm_password"
                                name="confirm_password"
                                type="password"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="새 패스워드 다시 입력"
                                value={formData.confirm_password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
                            {message}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "변경 중..." : "패스워드 변경"}
                        </button>
                    </div>

                    <div className="text-center space-y-2">
                        <button
                            type="button"
                            onClick={() => navigate("/password-reset/request")}
                            className="text-blue-600 hover:text-blue-500 text-sm"
                        >
                            새 코드 요청
                        </button>
                        <div>
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="text-gray-600 hover:text-gray-500 text-sm"
                            >
                                로그인으로 돌아가기
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}