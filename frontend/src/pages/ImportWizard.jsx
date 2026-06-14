import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function ImportWizard() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://spreetail-e36a.onrender.com';
      const res = await axios.post(`${API_BASE_URL}/api/import/preview`, formData);
      setPreview(res.data.expenses);
    } catch (error) {
      console.error(error);
      alert('Failed to upload and parse CSV.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://spreetail-e36a.onrender.com';
      await axios.post(`${API_BASE_URL}/api/import/confirm`, { expenses: preview });
      setImported(true);
    } catch (error) {
      console.error(error);
      alert('Failed to confirm import.');
    } finally {
      setLoading(false);
    }
  };

  const toggleIgnore = (id) => {
    setPreview(preview.map(exp => 
      exp.id === id ? { ...exp, ignored: !exp.ignored } : exp
    ));
  };

  if (imported) {
    return (
      <div className="glass-card text-center py-12">
        <CheckCircle className="text-success mx-auto mb-4" size={64} />
        <h2>Import Successful!</h2>
        <p className="text-muted mb-6">All valid expenses and settlements have been recorded.</p>
        <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <h2 className="mb-6">Import Expenses CSV</h2>

      {!preview ? (
        <div className="text-center py-12 border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-xl">
          <UploadCloud className="text-primary mx-auto mb-4" size={48} />
          <p className="mb-4">Select your `expenses_export.csv` file</p>
          <div className="flex justify-center gap-4">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="btn btn-secondary">
              Browse Files
            </label>
            <button 
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!file || loading}
            >
              {loading ? 'Analyzing...' : 'Upload & Analyze'}
            </button>
          </div>
          {file && <p className="mt-4 text-sm text-success">Selected: {file.name}</p>}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3>Anomaly Review</h3>
            <div className="flex gap-4">
              <button className="btn btn-secondary" onClick={() => setPreview(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirm} disabled={loading}>
                {loading ? 'Importing...' : 'Approve & Import'}
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status / Anomalies</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((exp) => (
                  <tr key={exp.id} className={exp.ignored ? 'opacity-50' : ''}>
                    <td>{new Date(exp.date).toLocaleDateString()}</td>
                    <td>
                      <div>{exp.description}</div>
                      {exp.isSettlement && <span className="badge badge-success mt-1">Settlement</span>}
                    </td>
                    <td>{exp.amount} {exp.currency}</td>
                    <td>
                      {exp.anomalies.length === 0 ? (
                        <span className="text-success flex items-center gap-1">
                          <CheckCircle size={16} /> Clean
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {exp.anomalies.map((anom, idx) => (
                            <span key={idx} className="text-warning text-sm flex items-start gap-1">
                              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                              {anom}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <button 
                        className={`btn ${exp.ignored ? 'btn-success' : 'btn-danger'} text-sm px-3 py-1`}
                        onClick={() => toggleIgnore(exp.id)}
                      >
                        {exp.ignored ? 'Restore' : 'Ignore'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
