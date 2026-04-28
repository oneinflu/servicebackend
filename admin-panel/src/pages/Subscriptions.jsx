import React, { useEffect, useState } from 'react';
import api from '../api/api';
import Card from '../components/Card';
import { Star, Shield, Zap, Search, User } from 'lucide-react';
import './Subscriptions.css';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/subscriptions/all')
      .then(res => setSubscriptions(res.data.data.subscriptions))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="subscriptions-page">
      <Card title="All Platform Subscriptions" className="full-width-card">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Subscriber</th>
              <th>Plan Type</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map(sub => (
              <tr key={sub._id}>
                <td>
                  <div className="user-profile-cell">
                    <User size={14} />
                    <span>{sub.user?.name}</span>
                  </div>
                </td>
                <td>
                  <span className={`plan-badge ${sub.type}`}>
                    {sub.type === 'SERVICE_POST' ? <Zap size={12} /> : <Shield size={12} />}
                    {sub.type.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <span className={`status-pill ${new Date(sub.endDate) > new Date() ? 'active' : 'expired'}`}>
                    {new Date(sub.endDate) > new Date() ? 'Active' : 'Expired'}
                  </span>
                </td>
                <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                <td>{new Date(sub.endDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Subscriptions;
