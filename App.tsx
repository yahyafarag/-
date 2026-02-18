import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TicketList from './pages/TicketList';
import TicketWizard from './pages/TicketWizard';
import AdminSettings from './pages/AdminSettings';
import AssetManager from './pages/AssetManager';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import { useStore } from './services/store';

const App: React.FC = () => {
  const { user } = useStore();

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="tickets" element={<TicketList />} />
          <Route path="tickets/new" element={<TicketWizard />} />
          <Route path="tickets/:id" element={<TicketWizard />} />
          <Route path="assets" element={<AssetManager />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;