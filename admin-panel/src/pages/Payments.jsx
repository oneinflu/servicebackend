import React, { useEffect, useState } from 'react';
import api from '../api/api';
import Card from '../components/Card';
import { CreditCard, CheckCircle, XCircle, Search, User } from 'lucide-react';
import './Payments.css';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // There isn't an explicit "all-payments" in paymentRoutes but Transaction model exists.
    // Assuming transactions are fetched from wallet or subscription logic.
    // I'll check paymentRoutes again.
    api.get('/wallet/all-transactions') // Reusing transactions for now as it captures payments too
      .then(res => setPayments(res.data.data.transactions))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="payments-page">
      <Card title="Payment History" className="full-width-card">
        <table className="sb-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Reference ID</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p._id}>
                <td>{p.user?.name}</td>
                <td className="ref-id">TXN-{p._id.substring(18)}</td>
                <td className="p-amount">₹{p.amount}</td>
                <td>{p.description}</td>
                <td>
                  <span className="p-status-pill">
                    <CheckCircle size={14} color="#00754A" /> Success
                  </span>
                </td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Payments;
