import { Routes, Route, Navigate } from 'react-router-dom';
import DatabaseDesigner from './DatabaseDesigner';
import Login from './auth/Login';
import Register from './auth/Register';
import PasswordResetRequest from './auth/PasswordResetRequest';
import PasswordResetConfirm from './auth/PasswordResetConfirm';
import ProjectList from './ProjectList';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

export default function AppRouter() {
  const { authState } = useAuth();

  // 로딩 중일 때는 로딩 화면만 표시
  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 패스워드 재설정은 항상 접근 가능 */}
      <Route path="/password-reset/request" element={<PasswordResetRequest />} />
      <Route path="/password-reset/confirm" element={<PasswordResetConfirm />} />
      
      {/* 인증되지 않은 사용자 라우트 */}
      {authState === 'unauthenticated' ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          {/* 인증된 사용자 라우트 */}
          <Route path="/projects" element={
            <ProtectedRoute>
              <ProjectList />
            </ProtectedRoute>
          } />
          <Route path="/projects/:projectId" element={
            <ProtectedRoute>
              <DatabaseDesigner />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Navigate to="/projects" replace />} />
          <Route path="/register" element={<Navigate to="/projects" replace />} />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </>
      )}
    </Routes>
  );
}