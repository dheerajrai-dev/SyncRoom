import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';

import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import RoomHistoryPage from '../pages/RoomHistoryPage';
import ProfilePage from '../pages/ProfilePage';
import CreateRoomPage from '../pages/CreateRoomPage';
import JoinRoomPage from '../pages/JoinRoomPage';
import WaitingRoomPage from '../pages/WaitingRoomPage';
import RequestDeniedPage from '../pages/RequestDeniedPage';
import RoomPage from '../pages/RoomPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public & App Pages wrapped in AppShell */}
        <Route
          path="/"
          element={
            <AppShell>
              <LandingPage />
            </AppShell>
          }
        />
        <Route
          path="/login"
          element={
            <AppShell>
              <LoginPage />
            </AppShell>
          }
        />
        <Route
          path="/register"
          element={
            <AppShell>
              <RegisterPage />
            </AppShell>
          }
        />

        {/* Authenticated Dashboard & Profile Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                <DashboardPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/rooms/:roomId"
          element={
            <ProtectedRoute>
              <AppShell>
                <RoomHistoryPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppShell>
                <ProfilePage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Room Lifecycle Routes */}
        <Route
          path="/create"
          element={
            <AppShell>
              <CreateRoomPage />
            </AppShell>
          }
        />
        <Route
          path="/join"
          element={
            <AppShell>
              <JoinRoomPage />
            </AppShell>
          }
        />
        <Route
          path="/room/:roomCode/waiting"
          element={
            <AppShell>
              <WaitingRoomPage />
            </AppShell>
          }
        />
        <Route
          path="/room/:roomCode/denied"
          element={
            <AppShell>
              <RequestDeniedPage />
            </AppShell>
          }
        />
        <Route
          path="/room/:roomCode"
          element={
            <AppShell hideNavbar={true}>
              <RoomPage />
            </AppShell>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
