import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart2, 
  Users, 
  Layers, 
  Briefcase, 
  Zap, 
  CreditCard, 
  Star, 
  TrendingUp, 
  ShieldCheck,
  Building2,
  Gift,
  Search,
  LogOut
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <BarChart2 size={20} /> },
    { name: 'User Management', path: '/users', icon: <Users size={20} /> },
    { name: 'Categories', path: '/categories', icon: <Layers size={20} /> },
    { name: 'Services', path: '/services', icon: <Zap size={20} /> },
    { name: 'Private Jobs', path: '/jobs', icon: <Briefcase size={20} /> },
    { name: 'Govt Jobs', path: '/govt-jobs', icon: <ShieldCheck size={20} /> },
    { name: 'Companies', path: '/companies', icon: <Building2 size={20} /> },
    { name: 'Subscriptions', path: '/subscriptions', icon: <Star size={20} /> },
    { name: 'Wallets', path: '/wallets', icon: <Gift size={20} /> },
    { name: 'Payments', path: '/payments', icon: <CreditCard size={20} /> },
    { name: 'Usage', path: '/usage', icon: <TrendingUp size={20} /> },
    { name: 'Referrals', path: '/referrals', icon: <Gift size={20} /> },
  ];

  return (
    <aside className="sb-sidebar">
      <div className="sb-sidebar__logo">
        <div className="sb-logo-circle">
          <span>A</span>
        </div>
        <span className="sb-logo-text">ServiceinfoTek Admin</span>
      </div>
      
      <nav className="sb-sidebar__nav">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `sb-sidebar__link ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sb-sidebar__footer">
        <button className="sb-sidebar__logout">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
