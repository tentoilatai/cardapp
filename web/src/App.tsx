import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/glass/Toast';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CardsPage } from './pages/CardsPage';
import { RulesPage } from './pages/RulesPage';
import { MccPage } from './pages/MccPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { MonthPage } from './pages/MonthPage';
import { TrackerPage } from './pages/TrackerPage';
import { SettingsPage } from './pages/SettingsPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes wrapped in AppShell */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="overview" element={<Navigate to="/" replace />} />
                <Route path="cards" element={<CardsPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
                
                {/* Monthly view canonical and legacy aliases */}
                <Route path="monthly-view" element={<MonthPage />} />
                <Route path="monthly-view/:monthKey" element={<MonthPage />} />
                <Route path="months" element={<Navigate to="/monthly-view" replace />} />
                <Route path="months/:monthKey" element={<Navigate to="/monthly-view" replace />} />

                {/* Cashback rules canonical and legacy aliases */}
                <Route path="cashback-rules" element={<RulesPage />} />
                <Route path="rules" element={<Navigate to="/cashback-rules" replace />} />

                {/* Category codes canonical and legacy aliases */}
                <Route path="category-codes" element={<MccPage />} />
                <Route path="mcc" element={<Navigate to="/category-codes" replace />} />

                {/* Card tracking canonical and legacy aliases */}
                <Route path="card-tracking" element={<TrackerPage />} />
                <Route path="card-tracking/:cardId" element={<TrackerPage />} />
                <Route path="tracker" element={<Navigate to="/card-tracking" replace />} />
                <Route path="tracker/:cardId" element={<TrackerPage />} />

                <Route path="settings" element={<SettingsPage />} />
                <Route path="change-password" element={<ChangePasswordPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
