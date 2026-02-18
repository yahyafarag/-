
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TicketList from './pages/TicketList';
import TicketWizard from './pages/TicketWizard';
import AssetManager from './pages/AssetManager';
import AssetDetails from './pages/AssetDetails';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import MyTickets from './pages/technician/MyTickets';
import JobWizard from './pages/technician/JobWizard';
import InstallPWA from './components/InstallPWA';
import NotificationContainer from './components/NotificationContainer';
import { useStore } from './services/store';

// Guards
import AdminGuard from './components/AdminGuard';

// Admin Pages
import SystemSettings from './pages/admin/SystemSettings';
import FormBuilder from './pages/admin/FormBuilder';
import StatusManager from './pages/admin/StatusManager';
import OrganizationManager from './pages/admin/OrganizationManager';
import UserManager from './pages/admin/UserManager';
import CategoryManager from './pages/admin/CategoryManager';
import PermissionManager from './pages/admin/PermissionManager';
import AuditLogs from './pages/admin/AuditLogs';
import Announcements from './pages/admin/Announcements';
import SystemDoctor from './pages/admin/SystemDoctor';
import DataImporter from './pages/admin/DataImporter';

const App: React.FC = () => {
  const { user, fetchSystemMetadata } = useStore();

  useEffect(() => {
    // Load system configuration and schemas on mount
    fetchSystemMetadata();
  }, [fetchSystemMetadata]);

  return (
    <>
      <HashRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
          
          {/* Protected Routes */}
          <Route path="/" element={user ? <Layout /> : <Navigate to="/login" replace />}>
            <Route index element={<Dashboard />} />
            
            {/* Ticket Management */}
            <Route path="tickets" element={<TicketList />} />
            <Route path="tickets/new" element={<TicketWizard />} />
            <Route path="tickets/:id" element={<TicketWizard />} />
            
            {/* Asset Management */}
            <Route path="assets" element={<AssetManager />} />
            <Route path="assets/:id" element={<AssetDetails />} />
            
            {/* Inventory */}
            <Route path="inventory" element={<Inventory />} />
            
            {/* Sovereign Admin Settings (Protected) */}
            <Route path="settings" element={<AdminGuard><SystemSettings /></AdminGuard>} />
            <Route path="settings/forms" element={<AdminGuard><FormBuilder /></AdminGuard>} />
            <Route path="settings/status" element={<AdminGuard><StatusManager /></AdminGuard>} />
            <Route path="settings/org" element={<AdminGuard><OrganizationManager /></AdminGuard>} />
            <Route path="settings/users" element={<AdminGuard><UserManager /></AdminGuard>} />
            <Route path="settings/categories" element={<AdminGuard><CategoryManager /></AdminGuard>} />
            
            {/* God Mode Admin Settings (Protected) */}
            <Route path="settings/permissions" element={<AdminGuard><PermissionManager /></AdminGuard>} />
            <Route path="settings/audit" element={<AdminGuard><AuditLogs /></AdminGuard>} />
            <Route path="settings/announcements" element={<AdminGuard><Announcements /></AdminGuard>} />
            <Route path="settings/doctor" element={<AdminGuard><SystemDoctor /></AdminGuard>} />
            <Route path="settings/import" element={<AdminGuard><DataImporter /></AdminGuard>} />
            
            {/* Technician Specific Routes */}
            <Route path="my-tickets" element={<MyTickets />} />
            <Route path="job/:id" element={<JobWizard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      
      {/* Global Notifications */}
      <NotificationContainer />
      
      {/* PWA Install Banner */}
      <InstallPWA />
    </>
  );
};

export default App;
