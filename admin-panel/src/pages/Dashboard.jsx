import React, { useEffect, useState } from 'react';
import api, { authAPI, serviceAPI, jobAPI } from '../api/api';
import Card from '../components/Card';
import { 
  Users, 
  Briefcase, 
  Zap, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    services: 0,
    jobs: 0,
    revenue: 0,
    subscriptions: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const results = await Promise.allSettled([
        authAPI.getAllUsers(),
        serviceAPI.getAll(),
        jobAPI.getAll(),
        api.get('/subscriptions/all'),
        api.get('/wallet/all-transactions')
      ]);

      const [uRes, sRes, jRes, subRes, tRes] = results;

      const users = uRes.status === 'fulfilled' ? (uRes.value.data.data.users || []) : [];
      const services = sRes.status === 'fulfilled' ? (sRes.value.data.data.services || []) : [];
      const jobs = jRes.status === 'fulfilled' ? (jRes.value.data.data.jobs || []) : [];
      const subscriptions = subRes.status === 'fulfilled' ? (subRes.value.data.data.subscriptions || []) : [];
      const transactions = tRes.status === 'fulfilled' ? (tRes.value.data.data.transactions || []) : [];

      const revenue = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      setStats({
        users: users.length,
        services: services.length,
        jobs: jobs.length,
        subscriptions: subscriptions.length,
        revenue: revenue
      });

      // Activities
      const recentUsers = users.slice(0, 3).map(u => ({
        id: u._id,
        type: 'user',
        title: 'New User Registered',
        subtitle: u.name,
        time: u.createdAt,
        icon: <Users size={16} />
      }));

      const recentServices = services.slice(0, 3).map(s => ({
        id: s._id,
        type: 'service',
        title: 'New Service Listed',
        subtitle: s.user?.name || 'Pro Provider',
        time: s.createdAt,
        icon: <Zap size={16} />
      }));

      const combined = [...recentUsers, ...recentServices]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .map(act => ({
          ...act,
          time: new Date(act.time).toLocaleDateString()
        }));

      setActivities(combined);

    } catch (err) {
      console.error('Dashboard logic error', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-screen">Brewing your dashboard...</div>;

  return (
    <div className="dashboard-page fade-in">
      <div className="dashboard-header">
        <h1>Welcome Back, Admin</h1>
        <p>Here's what's happening on your platform today.</p>
      </div>

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon users"><Users size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Total Users</span>
            <div className="stat-value-row">
              <h3>{stats.users}</h3>
              <span className="stat-delta up"><ArrowUpRight size={14} /> 12%</span>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon services"><Zap size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Active Services</span>
            <div className="stat-value-row">
              <h3>{stats.services}</h3>
              <span className="stat-delta up"><ArrowUpRight size={14} /> 5%</span>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon jobs"><Briefcase size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Total Jobs</span>
            <div className="stat-value-row">
              <h3>{stats.jobs}</h3>
              <span className="stat-delta">Stable</span>
            </div>
          </div>
        </Card>

        <Card className="stat-card highlight">
          <div className="stat-icon revenue"><TrendingUp size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Total Revenue</span>
            <div className="stat-value-row">
              <h3>₹{stats.revenue.toLocaleString()}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="dashboard-main">
        <div className="activity-section">
          <Card title="Recent Activity" className="activity-card">
            <div className="activity-list">
              {activities.length === 0 ? <p>No recent activity found.</p> : (
                activities.map(act => (
                  <div key={act.id} className="activity-item">
                    <div className={`activity-icon-box ${act.type}`}>
                      {act.icon}
                    </div>
                    <div className="activity-info">
                      <span className="activity-title">{act.title}</span>
                      <span className="activity-subtitle">{act.subtitle}</span>
                    </div>
                    <span className="activity-time">{act.time}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="quick-stats-section">
          <Card title="Quick Overview" className="overview-card">
            <div className="overview-list">
              <div className="overview-item">
                <ShieldCheck size={20} color="#00754a" />
                <div className="overview-text">
                  <b>{stats.subscriptions}</b>
                  <span>Subscribed Users</span>
                </div>
              </div>
              <div className="overview-item">
                <ShoppingBag size={20} color="#cba258" />
                <div className="overview-text">
                  <b>{stats.jobs}</b>
                  <span>Private Job Postings</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
