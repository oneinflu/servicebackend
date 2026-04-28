import React, { useEffect, useState } from 'react';
import { paymentAPI } from '../api/api';
import Card from '../components/Card';
import { CreditCard, CheckCircle, XCircle, Search, User, Filter, Download, ArrowUpRight } from 'lucide-react';
import './Payments.css';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = () => {
    setLoading(true);
    paymentAPI.getAllTransactions()
      .then(res => {
        setPayments(res.data.data.transactions || []);
        setSummary(res.data.data.summary);
      })
      .catch(err => console.error('Error fetching payments:', err))
      .finally(() => setLoading(false));
  };

  const filteredPayments = payments.filter(p => 
    p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.razorpayPaymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.subscriptionType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="payments-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment History</h1>
          <p className="page-subtitle">Track all subscription purchases and revenue</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by user or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="sb-btn secondary" onClick={fetchPayments}>
            <Filter size={18} /> Filter
          </button>
          <button className="sb-btn primary">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {summary && (
        <div className="stats-grid">
          <div className="stat-card premium">
            <div className="stat-info">
              <span>Total Revenue</span>
              <h3>₹{summary.totalAmount?.toLocaleString()}</h3>
            </div>
            <div className="stat-icon revenue">
              <ArrowUpRight size={24} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <span>Total Transactions</span>
              <h3>{summary.counts?.total}</h3>
            </div>
            <div className="stat-icon total">
              <CreditCard size={24} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <span>Successful</span>
              <h3>{summary.counts?.completed}</h3>
            </div>
            <div className="stat-icon success">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>
      )}

      <Card className="table-card">
        <div className="table-container">
          <table className="sb-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Transaction ID</th>
                <th>Subscription Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center">Loading payments...</td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan="6" className="text-center">No payment records found.</td></tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {p.user?.name?.charAt(0) || <User size={16} />}
                        </div>
                        <div className="user-info">
                          <span className="user-name">{p.user?.name || 'Unknown User'}</span>
                          <span className="user-email">{p.user?.email || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="ref-id" title={p.razorpayPaymentId}>
                        {p.razorpayPaymentId || `TXN-${p._id.substring(18)}`}
                      </span>
                    </td>
                    <td>
                      <span className={`sub-badge ${p.subscriptionType?.toLowerCase()}`}>
                        {p.subscriptionType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-amount">₹{p.amount}</td>
                    <td>
                      <span className={`p-status-pill ${p.status}`}>
                        {p.status === 'completed' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div className="date-cell">
                        <span className="date-main">{new Date(p.createdAt).toLocaleDateString()}</span>
                        <span className="date-sub">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Payments;
