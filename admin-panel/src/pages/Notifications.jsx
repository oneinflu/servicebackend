import React, { useEffect, useState } from 'react';
import { notificationAPI } from '../api/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Bell, Send, Users, Calendar, Megaphone, Info, CheckCircle2, XCircle } from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    audience: 'all'
  });
  const [sending, setSending] = useState(false);
  const [pushConfigured, setPushConfigured] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getSent();
      setNotifications(response.data.data.notifications || []);
      setPushConfigured(response.data.data.pushConfigured ?? true);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await notificationAPI.send(formData);
      fetchNotifications();
      setIsModalOpen(false);
      setFormData({ title: '', body: '', audience: 'all' });
      alert('Notification dispatched successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="loading-state">Loading Notification Manager...</div>;

  return (
    <div className="notifications-page">
      <div className="page-header-actions">
        <div className="summary-title">
          <Bell size={24} />
          <h1>Notification Broadcast Manager</h1>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Send size={18} /> New Broadcast
        </Button>
      </div>

      {!pushConfigured && (
        <div className="warning-banner">
          <Info size={20} />
          <span>
            Firebase Push is not configured yet (missing service account credentials).
            Notifications will only save to users' in-app inbox and simulated push outputs.
          </span>
        </div>
      )}

      <Card title="Broadcast History" className="history-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Body</th>
                <th>Audience</th>
                <th>Recipients</th>
                <th>Push Status</th>
                <th>Sent By</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">No broadcasts found. Click "New Broadcast" to send your first notification.</td>
                </tr>
              ) : (
                notifications.map((notif) => (
                  <tr key={notif._id}>
                    <td>
                      <div className="date-cell">
                        <Calendar size={14} />
                        <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="font-semibold">{notif.title}</td>
                    <td className="body-cell" title={notif.body}>{notif.body}</td>
                    <td>
                      <span className={`badge badge-${notif.audience}`}>
                        {notif.audience}
                      </span>
                    </td>
                    <td>{notif.recipientCount} users</td>
                    <td>
                      <div className="push-stats">
                        <span className="text-success" title="Successful Push Deliveries">
                          <CheckCircle2 size={12} /> {notif.pushSuccessCount ?? 0}
                        </span>
                        <span className="text-danger" title="Failed Push Deliveries">
                          <XCircle size={12} /> {notif.pushFailureCount ?? 0}
                        </span>
                      </div>
                    </td>
                    <td>{notif.sentBy?.name || notif.sentBy?.email || 'System'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <div className="sb-modal-overlay">
          <Card className="sb-modal large">
            <h2>Send Broadcast Notification</h2>
            <p className="dim-text">This will immediately deliver a push notification and an in-app notification to the selected audience.</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <Input
                  label="Notification Title"
                  placeholder="e.g. Server Maintenance or Weekend Special"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notification Body</label>
                <textarea
                  className="form-textarea"
                  placeholder="Type your push message here..."
                  rows={4}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="audience"
                      value="all"
                      checked={formData.audience === 'all'}
                      onChange={() => setFormData({ ...formData, audience: 'all' })}
                    />
                    <span>All Users</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="audience"
                      value="individual"
                      checked={formData.audience === 'individual'}
                      onChange={() => setFormData({ ...formData, audience: 'individual' })}
                    />
                    <span>Individuals (Job Seekers)</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="audience"
                      value="business"
                      checked={formData.audience === 'business'}
                      onChange={() => setFormData({ ...formData, audience: 'business' })}
                    />
                    <span>Businesses (Employers/Providers)</span>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <Button variant="outlined" type="button" onClick={() => setIsModalOpen(false)} disabled={sending}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={sending}>
                  {sending ? 'Dispatching...' : 'Dispatch Broadcast'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Notifications;
