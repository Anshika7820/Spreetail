import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Users, DollarSign, ArrowRight, PlusCircle, UserPlus, CreditCard } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);

  // Forms state
  const [newMemberName, setNewMemberName] = useState('');
  
  const [expenseForm, setExpenseForm] = useState({
    description: '', amount: '', splitType: 'equal', splits: {}
  });
  
  const [settlementForm, setSettlementForm] = useState({
    paidToId: '', amount: ''
  });

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const balanceRes = await axios.get(`http://localhost:3001/api/groups/${id}/balances`);
      setGroup({
        id: id,
        name: balanceRes.data.groupName,
        members: balanceRes.data.members || [],
        totalExpenses: balanceRes.data.totalExpenses || 0,
        balances: balanceRes.data.balances || [],
        userBalances: balanceRes.data.userBalances || []
      });
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    
    try {
      // Create user if not exists
      const resUser = await axios.post('http://localhost:3001/api/auth/login', { name: newMemberName });
      const newUserId = resUser.data.id;
      
      // Add member
      await axios.post(`http://localhost:3001/api/groups/${id}/members`, { userId: newUserId });
      
      setNewMemberName('');
      setShowAddMember(false);
      fetchGroupDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;

    try {
      // Build splits array
      const members = group.userBalances.map(u => u.userId);
      const splitsArray = members.map(mId => ({
        userId: mId,
        value: expenseForm.splits[mId] || (expenseForm.splitType === 'equal' ? '' : 0)
      }));

      await axios.post('http://localhost:3001/api/expenses', {
        groupId: id,
        description: expenseForm.description,
        amount: expenseForm.amount,
        paidById: user.id,
        splitType: expenseForm.splitType,
        splits: splitsArray
      });

      setShowAddExpense(false);
      setExpenseForm({ description: '', amount: '', splitType: 'equal', splits: {} });
      fetchGroupDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettleUp = async (e) => {
    e.preventDefault();
    if (!settlementForm.paidToId || !settlementForm.amount) return;

    try {
      await axios.post('http://localhost:3001/api/settlements', {
        groupId: id,
        paidById: user.id,
        paidToId: settlementForm.paidToId,
        amount: settlementForm.amount
      });

      setShowSettleUp(false);
      setSettlementForm({ paidToId: '', amount: '' });
      fetchGroupDetails();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) return <div>Group not found</div>;

  return (
    <div className="flex flex-col gap-6">
      <Link to="/groups" className="text-muted hover:text-primary">&larr; Back to Groups</Link>
      
      <div className="glass-card mb-2">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="mb-2">{group.name}</h2>
            <p className="text-muted flex items-center gap-2">
              <Users size={16} /> {group.members.join(', ')}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-secondary flex items-center gap-1" onClick={() => setShowAddMember(true)}>
              <UserPlus size={16}/> Add Member
            </button>
            <button className="btn btn-secondary flex items-center gap-1" onClick={() => setShowSettleUp(true)}>
              <CreditCard size={16}/> Settle Debt
            </button>
            <button className="btn btn-primary flex items-center gap-1" onClick={() => setShowAddExpense(true)}>
              <PlusCircle size={16}/> Add Expense
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card">
          <h3 className="mb-4">Net Balances</h3>
          <div className="flex flex-col gap-2 mb-6">
            {group.userBalances.map((ub, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[rgba(255,255,255,0.02)] p-3 rounded border border-[rgba(255,255,255,0.03)]">
                <span>{ub.userName} {ub.userId === user.id ? '(You)' : ''}</span>
                <span className={`font-bold ${ub.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                  {ub.balance > 0 ? '+' : ''}{ub.balance.toLocaleString()} INR
                </span>
              </div>
            ))}
          </div>
          <div className="p-4 bg-[rgba(255,255,255,0.02)] rounded-lg text-center">
            <span className="text-muted block mb-1">Total Group Spending</span>
            <span className="text-2xl font-bold">{group.totalExpenses.toLocaleString()} INR</span>
          </div>
        </div>

        <div className="glass-card">
          <h3 className="mb-4">Suggested Settlements</h3>
          {group.balances.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-success font-medium">All expenses are fully settled!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {group.balances.map((bal, idx) => (
                <div key={idx} className="flex justify-between items-center bg-[rgba(15,23,42,0.4)] p-4 rounded-lg border border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-danger">{bal.from}</span>
                    <ArrowRight size={16} className="text-muted" />
                    <span className="font-medium text-success">{bal.to}</span>
                  </div>
                  <span className="font-bold">{bal.amount.toLocaleString()} INR</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="modal-overlay">
          <div className="modal glass-card">
            <h2>Add Member</h2>
            <form onSubmit={handleAddMember}>
              <div className="input-group">
                <label>Name</label>
                <input type="text" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!newMemberName.trim()}>Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="modal-overlay">
          <div className="modal glass-card" style={{ maxWidth: '500px' }}>
            <h2>Add Expense</h2>
            <form onSubmit={handleAddExpense}>
              <div className="input-group">
                <label>Description</label>
                <input type="text" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Amount (INR)</label>
                <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Split Type</label>
                <select value={expenseForm.splitType} onChange={e => setExpenseForm({...expenseForm, splitType: e.target.value})} className="w-full p-2 bg-background border border-[rgba(255,255,255,0.1)] rounded text-foreground">
                  <option value="equal">Equal</option>
                  <option value="unequal">Unequal (Exact amounts)</option>
                  <option value="percentage">Percentage</option>
                  <option value="share">Shares (e.g. 2 shares vs 1)</option>
                </select>
              </div>
              
              {expenseForm.splitType !== 'equal' && (
                <div className="mt-4 mb-4">
                  <label className="block mb-2 text-sm text-muted">Enter split values:</label>
                  {group.userBalances.map(ub => (
                    <div key={ub.userId} className="flex justify-between items-center mb-2">
                      <span>{ub.userName}</span>
                      <input 
                        type="number" 
                        placeholder={expenseForm.splitType === 'percentage' ? '%' : 'amount/shares'}
                        className="w-24 p-1 bg-background border border-[rgba(255,255,255,0.1)] rounded"
                        value={expenseForm.splits[ub.userId] || ''}
                        onChange={e => setExpenseForm({
                          ...expenseForm, 
                          splits: {...expenseForm.splits, [ub.userId]: e.target.value}
                        })}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="modal-actions mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddExpense(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!expenseForm.description || !expenseForm.amount}>Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Up Modal */}
      {showSettleUp && (
        <div className="modal-overlay">
          <div className="modal glass-card">
            <h2>Settle Up</h2>
            <p className="text-sm text-muted mb-4">Record a payment from you ({user.name}) to someone else.</p>
            <form onSubmit={handleSettleUp}>
              <div className="input-group">
                <label>Pay To</label>
                <select 
                  value={settlementForm.paidToId} 
                  onChange={e => setSettlementForm({...settlementForm, paidToId: e.target.value})}
                  className="w-full p-2 bg-background border border-[rgba(255,255,255,0.1)] rounded text-foreground"
                >
                  <option value="">Select person</option>
                  {group.userBalances.filter(ub => ub.userId !== user.id).map(ub => (
                    <option key={ub.userId} value={ub.userId}>{ub.userName}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Amount (INR)</label>
                <input type="number" value={settlementForm.amount} onChange={e => setSettlementForm({...settlementForm, amount: e.target.value})} />
              </div>
              <div className="modal-actions mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSettleUp(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!settlementForm.paidToId || !settlementForm.amount}>Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
