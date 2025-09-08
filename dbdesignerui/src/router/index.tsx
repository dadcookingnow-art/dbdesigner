import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import DatabaseDesigner from '../components/DatabaseDesigner';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import PasswordResetRequest from '../components/auth/PasswordResetRequest';
import PasswordResetConfirm from '../components/auth/PasswordResetConfirm';
import ProjectList from '../components/ProjectList';
import ProtectedRoute from '../components/ProtectedRoute';

// 모든 라우트를 하나로 통합
const router = createBrowserRouter([
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
    element: <PasswordResetRequest />
  },
  {
    path: '/password-reset/confirm',
    element: <PasswordResetConfirm />
  },
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
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);

export default function AppRouterProvider() {
  return <RouterProvider router={router} />;
}