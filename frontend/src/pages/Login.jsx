import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to groups
    if (user) {
      navigate('/groups');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      const userData = await response.json();
      if (response.ok) {
        login(userData);
        navigate('/groups');
      } else {
        alert(userData.error || 'Failed to login');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card login-card">
        <h1>Welcome to SplitIt</h1>
        <p>Manage shared expenses with your flatmates effortlessly.</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="name">Who are you?</label>
            <input 
              type="text" 
              id="name"
              placeholder="e.g. Aisha" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading || !name.trim()}>
            {loading ? 'Entering...' : 'Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
