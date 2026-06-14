import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import GroupsList from './pages/GroupsList';
import Dashboard from './pages/Dashboard';
import ImportWizard from './pages/ImportWizard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <main className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/groups" element={<GroupsList />} />
            <Route path="/groups/:id" element={<Dashboard />} />
            <Route path="/import" element={<ImportWizard />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
