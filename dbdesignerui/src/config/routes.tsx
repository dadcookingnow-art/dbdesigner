import { RouteObject } from 'react-router-dom';
import DatabaseDesigner from '../components/DatabaseDesigner';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
// import PasswordResetRequest from '../components/auth/PasswordResetRequest'; // 현재 라우트에서 사용하지 않음
import PasswordResetConfirm from '../components/auth/PasswordResetConfirm';
import TestPage from '../components/auth/TestPage';
import ProjectList from '../components/ProjectList';
import ProtectedRoute from '../components/ProtectedRoute';

// 인증되지 않은 사용자용 라우트
export const unauthenticatedRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/password-reset/request',
    element: <TestPage />
  },
  {
    path: '/password-reset/confirm',
    element: <PasswordResetConfirm />
  },
  {
    path: '*',
    element: <Login /> // 기본적으로 로그인 페이지로
  }
];

// 인증된 사용자용 라우트
export const authenticatedRoutes: RouteObject[] = [
  {
    path: '/projects',
    element: (
      <ProtectedRoute>
        <ProjectList />
      </ProtectedRoute>
    )
  },
  {
    path: '/projects/:projectId',
    element: (
      <ProtectedRoute>
        <DatabaseDesigner />
      </ProtectedRoute>
    )
  },
  {
    path: '*',
    element: (
      <ProtectedRoute>
        <ProjectList />
      </ProtectedRoute>
    )
  }
];