import React from 'react';
import { Search, Bell, User } from 'lucide-react';
import './Header.css';

const Header = ({ title }) => {
  return (
    <header className="sb-header">
      <div className="sb-header__left">
        <h1 className="sb-header__title">{title}</h1>
      </div>
      
      <div className="sb-header__right">
        <div className="sb-search-bar">
          <Search size={18} className="sb-search-icon" />
          <input type="text" placeholder="Search anything..." className="sb-search-input" />
        </div>
        
        <div className="sb-header__actions">
          <button className="sb-icon-button">
            <Bell size={20} />
            <span className="sb-badge"></span>
          </button>
          
          <div className="sb-user-profile">
            <div className="sb-avatar">
              <User size={20} />
            </div>
            <div className="sb-user-info">
              <span className="sb-username">Admin User</span>
              <span className="sb-userrole">Super Admin</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
