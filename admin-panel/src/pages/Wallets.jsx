import React, { useEffect, useState } from 'react';
import api from '../api/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { Wallet, ArrowDownRight, ArrowUpRight, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import './Wallets.css';

const Wallets = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [wRes, tRes] = await Promise.all([
        api.get('/wallet/withdrawals'),
        api.get('/wallet/all-transactions')
      ]);
      setWithdrawals(wRes.data.data.withdrawals || []);
      setTransactions(tRes.data.data.transactions || []);
    } catch (err) {
      console.error('Wallet fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/wallet/withdrawals/${id}/approve`);
      fetchData();
    } catch (err) { alert('Approval failed'); }
  };

  const handlePay = async (id) => {
    try {
      await api.post(`/wallet/withdrawals/${id}/pay`);
      fetchData();
    } catch (err) { alert('Payment processing failed'); }
  };

  return (
    <div className="wallets-page">
      <div className="wallets-grid">
        <Card title="Pending Withdrawals" className="withdrawals-card">
          <div className="withdrawals-list">
            {withdrawals.length === 0 ? <p>No pending withdrawals.</p> : (
              withdrawals.map(w => (
                <div key={w._id} className="withdrawal-item">
                  <div className="w-info">
                    <span className="w-user">{w.user?.name}</span>
                    <span className="w-amount">₹{w.amount}</span>
                  </div>
                  <div className="w-status">
                    <span className={`status-tag ${w.status}`}>{w.status}</span>
                  </div>
                  <div className="w-actions">
                    {w.status === 'requested' && <Button size="small" onClick={() => handleApprove(w._id)}>Approve</Button>}
                    {w.status === 'approved' && <Button variant="secondary" size="small" onClick={() => handlePay(w._id)}>Mark Paid</Button>}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Global Transactions" className="transactions-card">
          <table className="sb-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 10).map(t => (
                <tr key={t._id}>
                  <td>{t.user?.name}</td>
                  <td>
                    <span className={`txn-type ${t.type}`}>
                      {t.type === 'credit' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {t.type}
                    </span>
                  </td>
                  <td className={t.type === 'credit' ? 'text-green' : 'text-red'}>
                    {t.type === 'credit' ? '+' : '-'}₹{t.amount}
                  </td>
                  <td>{t.description}</td>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

export default Wallets;
