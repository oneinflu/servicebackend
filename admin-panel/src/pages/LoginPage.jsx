import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { Coffee, ShieldCheck, Lock } from 'lucide-react';
import './LoginPage.css';

const LoginPage = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login({ email, password });
      const { token, data } = response.data;
      const { user } = data;
      
      if (!user.isAdmin) {
        throw new Error('Access denied. Administrator credentials required.');
      }
      
      localStorage.setItem('adminToken', token);
      setToken(token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-glass-panel">
        <div className="login-brand">
          <div className="brand-logo">
            <Coffee size={32} />
          </div>
          <h1>ServiceinfoTek Admin</h1>
          <p>Handcrafted Business Intelligence</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {error && <div className="login-error fade-in">{error}</div>}
          
          <Input 
            label="Admin Email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            id="admin-email"
          />
          
          <Input 
            label="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            id="admin-password"
          />

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" /> Save for later
            </label>
            <a href="#" className="forgot-pass">Forgot Password?</a>
          </div>

          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
            className="login-btn"
          >
            {loading ? 'Verifying...' : 'Brew Session'}
          </Button>
        </form>

        <div className="login-footer">
          <ShieldCheck size={14} />
          <span>Secure Enterprise Connection</span>
        </div>
      </div>
      
      <div className="login-background-artwork">
        <div className="art-circle c1"></div>
        <div className="art-circle c2"></div>
      </div>
    </div>
  );
};

export default LoginPage;
