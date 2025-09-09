// import React from "react"; // JSX에서 React 자동 import됨
import { useNavigate } from "react-router-dom";

export default function TestPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-red-600">테스트 페이지</h1>
                <p className="mt-4">패스워드 재설정 라우팅이 작동합니다!</p>
                <button
                    onClick={() => navigate("/login")}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                >
                    로그인으로 돌아가기
                </button>
            </div>
        </div>
    );
}