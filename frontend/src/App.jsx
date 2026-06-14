import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ImportWizard from './pages/ImportWizard';
import { Layers, FileSpreadsheet } from 'lucide-react';

function App() {
  return (
    <Router>
      <header className="flex justify-between items-center mb-8 animate-fade-in">
        <div className="flex items-center gap-2">
          <Layers className="text-primary" size={32} />
          <h1>SplitIt</h1>
        </div>
        <nav className="flex gap-4">
          <Link to="/" className="btn btn-secondary">Dashboard</Link>
          <Link to="/import" className="btn btn-primary">
            <FileSpreadsheet size={18} />
            Import CSV
          </Link>
        </nav>
      </header>

      <main className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/import" element={<ImportWizard />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
