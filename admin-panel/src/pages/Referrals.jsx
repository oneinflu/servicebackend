import React, { useEffect, useState } from 'react';
import api from '../api/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Gift, Settings, TrendingUp, Users, Edit2, ShieldAlert, List, AlertCircle } from 'lucide-react';
import './Referrals.css';

const Referrals = () => {
  const [settings, setSettings] = useState({
    levelRates: [],
    minWithdrawal: 0
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    levelRates: [],
    minWithdrawal: 0
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = () => {
    api.get('/referrals/settings')
      .then(res => {
        const s = res.data.data.settings || { levelRates: [], minWithdrawal: 200 };
        setSettings(s);
        setFormData(s);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleLevelChange = (index, value) => {
    const newRates = [...formData.levelRates];
    newRates[index] = parseFloat(value) || 0;
    setFormData({ ...formData, levelRates: newRates });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/referrals/settings', formData);
      setSettings({ ...formData });
      setIsModalOpen(false);
      alert('Referral policy updated successfully');
    } catch (err) {
      alert('Failed to update settings. Ensure value are numbers.');
    }
  };

  if (loading) return <div>Loading Referral Data...</div>;

  return (
    <div className="referrals-page">
      <div className="page-header-actions">
        <div className="summary-title">
          <Gift size={24} />
          <h1>Referral & Multi-level Rewards</h1>
        </div>
        <Button variant="primary" onClick={() => { setFormData({...settings}); setIsModalOpen(true); }}>
          <Settings size={18} /> Update Rewards Strategy
        </Button>
      </div>

      <div className="referrals-dashboard">
        <div className="stats-row">
          <Card className="stat-card">
            <div className="stat-icon green"><Users size={24} /></div>
            <div className="stat-value">
              <span>Network Levels</span>
              <h3>{settings.levelRates?.length || 0} Levels</h3>
            </div>
          </Card>
          <Card className="stat-card">
            <div className="stat-icon gold"><TrendingUp size={24} /></div>
            <div className="stat-value">
              <span>Direct Rate</span>
              <h3>{(settings.levelRates?.[0] * 100 || 0).toFixed(1)}%</h3>
            </div>
          </Card>
          <Card className="stat-card">
            <div className="stat-icon uplift"><ShieldAlert size={24} /></div>
            <div className="stat-value">
              <span>Min Payout</span>
              <h3>₹{settings.minWithdrawal}</h3>
            </div>
          </Card>
        </div>

        <Card title="Multi-Level Commission Structure" className="config-overview-card">
          <div className="commission-grid">
            {settings.levelRates?.map((rate, idx) => (
              <div key={idx} className="commission-item">
                <span className="lvl-label">Level {idx + 1}</span>
                <span className="lvl-val">{(rate * 100).toFixed(4)}%</span>
              </div>
            ))}
          </div>
          <div className="payout-info">
            <AlertCircle size={16} />
            <span>Withdrawals are restricted until the wallet balance reaches <b>₹{settings.minWithdrawal}</b></span>
          </div>
        </Card>
      </div>

      {isModalOpen && (
        <div className="sb-modal-overlay">
          <Card className="sb-modal large">
            <h2>Configure Rewards Strategy</h2>
            <p className="dim-text">Define commission multipliers for up to 10 levels of the referral tree.</p>
            
            <form onSubmit={handleSave}>
              <div className="modal-scroll-area">
                <div className="form-row">
                   <Input 
                    label="Minimum Withdrawal (₹)" 
                    type="number" 
                    value={formData.minWithdrawal} 
                    onChange={(e) => setFormData({...formData, minWithdrawal: parseFloat(e.target.value)})}
                    required
                  />
                </div>

                <div className="levels-config">
                  <h4>Commission Rates (Multipliers)</h4>
                  <div className="levels-grid">
                    {formData.levelRates?.map((rate, idx) => (
                      <div key={idx} className="level-input-box">
                        <label>Level {idx + 1}</label>
                        <input 
                          type="number" 
                          step="0.0000000001"
                          value={rate} 
                          onChange={(e) => handleLevelChange(idx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <Button variant="outlined" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Deploy Strategy</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Referrals;
