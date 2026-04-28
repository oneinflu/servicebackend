import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Services from './pages/Services';
import Jobs from './pages/Jobs';
import GovtJobs from './pages/GovtJobs';
import Wallets from './pages/Wallets';
import Subscriptions from './pages/Subscriptions';
import Payments from './pages/Payments';
import Referrals from './pages/Referrals';
import Companies from './pages/Companies';

// Placeholder for remaining minor pages
const Placeholder = ({ name }) => (
  <div className="placeholder-container fade-in">
    <div className="placeholder-card">
      <div className="brew-loader"></div>
      <h2>Brewing {name}...</h2>
      <p>This artisanal module is currently being crafted by our design team.</p>
    </div>
  </div>
);

function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

  useEffect(() => {
    // Optionally verify token with backend
  }, [token]);

  if (!token) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage setToken={setToken} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/services" element={<Services />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/govt-jobs" element={<GovtJobs />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/usage" element={<Placeholder name="Platform Usage" />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
