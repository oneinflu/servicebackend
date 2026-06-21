import React, { useEffect, useState } from 'react';
import { authAPI } from '../api/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Search, User as UserIcon, Mail, Phone, Calendar, Shield, Edit2, Trash2, Plus } from 'lucide-react';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    isAdmin: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      setUsers(response.data.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', phone: '', isAdmin: false });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // Assuming backend has update user logic. If not, this is a placeholder for UI integrity.
    alert('User system updated (Simulated)');
    setIsModalOpen(false);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await authAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      alert('Failed to delete user: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredUsers = users.filter(user =>
    !user.isAdmin && (
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm)
    )
  );

  return (
    <div className="users-page">
      <div className="page-header-actions">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add User
        </Button>
      </div>

      <Card className="full-width-card">
        <table className="sb-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact Info</th>
              <th>Role</th>
              <th>Joined Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center">Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="5" className="text-center">No users found.</td></tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-profile-cell">
                      <div className="user-avatar">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-info">
                        <span className="user-name">{user.name}</span>
                        <span className="user-ref">Ref: {user.referralId}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <div className="contact-item"><Mail size={12} /> {user.email}</div>
                      <div className="contact-item"><Phone size={12} /> {user.phone}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-pill ${user.isAdmin ? 'admin' : 'user'}`}>
                      {user.isAdmin ? <Shield size={12} /> : null}
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>
                    <div className="date-cell">
                      <Calendar size={12} />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="action-btns end">
                      <button className="icon-btn edit" onClick={() => handleOpenModal(user)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="icon-btn delete" onClick={() => handleDelete(user._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {isModalOpen && (
        <div className="sb-modal-overlay">
          <Card className="sb-modal">
            <h2>{editingUser ? 'Edit User Profile' : 'Create New User'}</h2>
            <form onSubmit={handleSave}>
              <Input 
                label="Full Name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
              <Input 
                label="Email Address" 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
              />
              <Input 
                label="Phone Number" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              />
              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={formData.isAdmin} 
                    onChange={(e) => setFormData({...formData, isAdmin: e.target.checked})} 
                  />
                  Grant Administrator Privileges
                </label>
              </div>
              <div className="modal-actions">
                <Button variant="outlined" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Users;
