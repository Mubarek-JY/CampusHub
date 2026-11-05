import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AuthProvider } from '../features/auth/AuthContext';
import { LoginPage, RegisterPage } from '../features/auth/AuthPages';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { GroupPage } from '../features/groups/GroupPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { MessagesPage } from '../features/messages/MessagesPage';
import { CalendarPage } from '../features/calendar/CalendarPage';
import { NotFound } from './NotFound';
import { ProtectedRoute, PublicOnlyRoute } from './RouteGuards';
import { ErrorBoundary } from './ErrorBoundary';
import { ToastProvider } from '../hooks/useToast';

export function App() {
  return <ErrorBoundary><BrowserRouter><ToastProvider><AuthProvider><Routes>
    <Route element={<PublicOnlyRoute />}><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /></Route>
    <Route element={<ProtectedRoute />}><Route path="/app" element={<AppLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="groups/:groupId" element={<GroupPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="messages" element={<MessagesPage />} />
      <Route path="calendar" element={<CalendarPage />} />
    </Route></Route>
    <Route path="/" element={<Navigate to="/app" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes></AuthProvider></ToastProvider></BrowserRouter></ErrorBoundary>;
}
