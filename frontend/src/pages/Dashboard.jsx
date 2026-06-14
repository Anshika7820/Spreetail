import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, DollarSign, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd fetch this from the backend
    // Setting up mock data to showcase the design for the submission demo
    setTimeout(() => {
      setGroups([
        {
          id: '1',
          name: 'Goa Trip + Flatmates',
          members: ['Aisha', 'Rohan', 'Priya', 'Meera', 'Dev', 'Sam'],
          totalExpenses: 114500,
          balances: [
            { from: 'Rohan', to: 'Aisha', amount: 2300 },
            { from: 'Priya', to: 'Aisha', amount: 1500 },
            { from: 'Dev', to: 'Rohan', amount: 840 },
          ]
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-col gap-6">
      <div className="glass-card mb-6">
        <h2 className="mb-2">Welcome back, Aisha</h2>
        <p className="text-muted">Here's the summary of your shared expenses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map(group => (
          <div key={group.id} className="glass-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="flex items-center gap-2 m-0">
                <Users size={20} className="text-secondary" />
                {group.name}
              </h3>
              <span className="badge badge-success flex items-center gap-1">
                <DollarSign size={14} />
                {group.totalExpenses.toLocaleString()} INR Total
              </span>
            </div>
            
            <p className="text-sm text-muted mb-6">
              Members: {group.members.join(', ')}
            </p>

            <h4 className="text-sm uppercase tracking-wider text-muted mb-3">Suggested Settlements</h4>
            
            <div className="flex flex-col gap-3">
              {group.balances.map((bal, idx) => (
                <div key={idx} className="flex justify-between items-center bg-[rgba(15,23,42,0.4)] p-3 rounded-lg border border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-danger">{bal.from}</span>
                    <ArrowRight size={16} className="text-muted" />
                    <span className="font-medium text-success">{bal.to}</span>
                  </div>
                  <span className="font-bold">{bal.amount.toLocaleString()} INR</span>
                </div>
              ))}
            </div>

            <button className="btn btn-secondary w-full mt-6">
              View Full Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
