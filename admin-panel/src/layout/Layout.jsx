import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { HelpCircle } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  
  // Map path to title
  const getTitle = (path) => {
    switch (path) {
      case '/': return 'Dashboard Overview';
      case '/users': return 'User Management';
      case '/categories': return 'Categories';
      case '/services': return 'Services';
      case '/jobs': return 'Private Jobs';
      case '/govt-jobs': return 'Government Jobs';
      case '/companies': return 'Company Directory';
      case '/subscriptions': return 'Subscriptions';
      case '/wallets': return 'Wallets';
      case '/payments': return 'Payments';
      case '/usage': return 'Platform Usage';
      case '/referrals': return 'Referral Program';
      default: return 'Admin Panel';
    }
  };

  return (
    <div className="sb-admin-layout">
      <Sidebar />
      <div className="sb-admin-main">
        <Header title={getTitle(location.pathname)} />
        <main className="sb-admin-content fade-in">
          <Outlet />
        </main>
        
        <button className="sb-frap-button" title="Quick Support">
          <HelpCircle size={24} />
        </button>
      </div>
    </div>
  );
};

export default Layout;
