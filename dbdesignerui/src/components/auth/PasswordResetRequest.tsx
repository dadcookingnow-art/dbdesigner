import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../utils/apiClient";

export default function PasswordResetRequest() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setMessage("");

        try {
            const data = await apiClient.post('/user/auth/password-reset/request', { email }, { requireAuth: false });
            
            setMessage(
                `패스워드 재설정 코드가 ${email}로 발송되었습니다. (${data.expires_in_minutes}분 후 만료)`
            );
            // 2초 후 재설정 확인 페이지로 이동
            setTimeout(() => {
                navigate(`/password-reset/confirm?email=${encodeURIComponent(email)}`);
            }, 2000);
        } catch (err: any) {
            setError(err.message || "패스워드 재설정 요청에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        패스워드 재설정
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        이메일 주소를 입력하시면 재설정 코드를 보내드립니다
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            placeholder="이메일 주소"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
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
                            {isLoading ? "발송 중..." : "재설정 코드 발송"}
                        </button>
                    </div>

                    <div className="text-center space-y-2">
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="text-blue-600 hover:text-blue-500 text-sm"
                        >
                            로그인으로 돌아가기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}