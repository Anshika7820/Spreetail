import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function GroupsList() {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchGroups();
  }, [user, navigate]);

  const fetchGroups = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/groups');
      const data = await response.json();
      
      // Filter groups to only those where the user is a member
      const myGroups = data.filter(g => 
        g.members.some(m => m.userId === user.id)
      );
      
      setGroups(myGroups);
    } catch (err) {
      console.error('Error fetching groups', err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      // 1. Create group
      const res = await fetch('http://localhost:3001/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName })
      });
      const newGroup = await res.json();

      // 2. Add current user as member
      await fetch(`http://localhost:3001/api/groups/${newGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      setNewGroupName('');
      setShowModal(false);
      fetchGroups();
    } catch (err) {
      console.error('Error creating group', err);
    }
  };

  if (!user) return null;

  return (
    <div className="groups-container">
      <header className="app-header glass-card">
        <div className="header-left">
          <h2>SplitIt</h2>
          <span className="user-badge">Logged in as {user.name}</span>
        </div>
        <div className="header-right">
          <button className="btn btn-secondary" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="content">
        <div className="flex-between mb-2 flex items-center justify-between">
          <h1>My Groups</h1>
          <div className="flex gap-2">
            <Link to="/import" className="btn btn-secondary">Import CSV</Link>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Group</button>
          </div>
        </div>

        <div className="groups-grid">
          {groups.length === 0 ? (
            <div className="empty-state glass-card">
              <p>You aren't in any groups yet. Create one or import from CSV!</p>
              <Link to="/import" className="btn btn-primary mt-1">Go to CSV Importer</Link>
            </div>
          ) : (
            groups.map(group => (
              <Link to={`/groups/${group.id}`} key={group.id} className="group-card glass-card">
                <h3>{group.name}</h3>
                <p>{group.members.length} members</p>
              </Link>
            ))
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal glass-card">
            <h2>Create New Group</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="input-group">
                <label>Group Name</label>
                <input 
                  type="text" 
                  value={newGroupName} 
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="e.g., Goa Trip" 
                  autoFocus 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!newGroupName.trim()}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupsList;
