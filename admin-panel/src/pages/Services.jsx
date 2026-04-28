import React, { useEffect, useState } from 'react';
import { serviceAPI } from '../api/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Search, User, MapPin, Trash2, ExternalLink, Edit2, Plus } from 'lucide-react';
import './Services.css';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    city: '',
    state: '',
    isCompanyPost: false
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await serviceAPI.getAll();
      setServices(response.data.data.services || []);
    } catch (err) {
      console.error('Failed to fetch services', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (svc = null) => {
    if (svc) {
      setEditingService(svc);
      setFormData({
        city: svc.location?.city || '',
        state: svc.location?.state || '',
        isCompanyPost: svc.isCompanyPost || false
      });
    } else {
      setEditingService(null);
      setFormData({ city: '', state: '', isCompanyPost: false });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    alert('Service updated (Simulated)');
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await serviceAPI.delete(id);
        fetchServices();
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  const filteredServices = services.filter(svc => 
    svc.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    svc.location?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="services-page">
      <div className="page-header-actions">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by provider or city..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Create Service
        </Button>
      </div>

      <Card className="full-width-card">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Service Categories</th>
              <th>Provider</th>
              <th>Location</th>
              <th>Price Info</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center">Loading services...</td></tr>
            ) : filteredServices.length === 0 ? (
              <tr><td colSpan="5" className="text-center">No services found.</td></tr>
            ) : (
              filteredServices.map((svc) => (
                <tr key={svc._id}>
                  <td>
                    <div className="category-pills">
                      {svc.categoryPrices.map((cp, idx) => (
                        <span key={idx} className="type-badge service">
                          {cp.category?.name || 'Unknown'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="provider-cell">
                      <User size={14} />
                      <span>{svc.user?.name || 'System'}</span>
                      {svc.isCompanyPost && <span className="company-badge">Company</span>}
                    </div>
                  </td>
                  <td>
                    <div className="location-cell">
                      <MapPin size={14} />
                      <span>{svc.location?.city}, {svc.location?.state}</span>
                    </div>
                  </td>
                  <td>
                    <div className="price-info">
                      {svc.categoryPrices.length > 0 ? (
                        <b>₹{svc.categoryPrices[0].price} {svc.categoryPrices.length > 1 ? '...' : ''}</b>
                      ) : 'N/A'}
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="action-btns end">
                      <button className="icon-btn edit" onClick={() => handleOpenModal(svc)}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(svc._id)} className="icon-btn delete">
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
            <h2>{editingService ? 'Edit Service' : 'List New Service'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <Input label="City" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required />
                <Input label="State" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={formData.isCompanyPost} 
                    onChange={(e) => setFormData({...formData, isCompanyPost: e.target.checked})} 
                  />
                  Mark as Company Profile
                </label>
              </div>
              <div className="modal-actions">
                <Button variant="outlined" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Service</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Services;
