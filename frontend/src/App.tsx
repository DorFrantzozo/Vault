import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { DashboardLayout } from './components/layout/DashboardLayout.js';

const Login = React.lazy(() => import('./pages/Login.js'));
const Dashboard = React.lazy(() => import('./pages/Dashboard.js'));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage.js'));
const Ledger = React.lazy(() => import('./pages/Ledger.js'));
const Clients = React.lazy(() => import('./pages/Clients.js'));
const Events = React.lazy(() => import('./pages/Events.js'));
const Balances = React.lazy(() => import('./pages/Balances.js'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage.js'));
const RecurringBillings = React.lazy(() => import('./pages/RecurringBillings.js'));

import { ModalProvider } from './components/common/ModalContext.js';

export default function App() {
  return (
    <Provider store={store}>
      <ModalProvider>
        <BrowserRouter>
          <React.Suspense
            fallback={
              <div className="min-h-screen bg-[#090a0f] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            }
          >
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/ledger" element={<Ledger />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/balances" element={<Balances />} />
                  <Route path="/recurring" element={<RecurringBillings />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </ModalProvider>
    </Provider>
  );
}
