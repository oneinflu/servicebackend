import React, { useEffect, useState } from 'react';
import api from '../api/api';
import Card from '../components/Card';
import { Building2, MapPin, Globe, Mail, Phone, Trash2 } from 'lucide-react';
import './Companies.css';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/companies')
      .then(res => setCompanies(res.data.data.companies))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this company profile?')) {
      await api.delete(`/companies/${id}`);
      setCompanies(companies.filter(c => c._id !== id));
    }
  };

  return (
    <div className="companies-page">
      <div className="companies-grid">
        {loading ? <p>Loading...</p> : companies.map(c => (
          <Card key={c._id} className="company-info-card">
            <div className="company-card__top">
              <div className="company-logo">
                <Building2 size={32} />
              </div>
              <div className="company-header-info">
                <h3>{c.name}</h3>
                <span>{c.industry || 'General Industry'}</span>
              </div>
              <button className="icon-btn delete" onClick={() => handleDelete(c._id)}><Trash2 size={16} /></button>
            </div>
            <div className="company-card__details">
              <div className="detail-row"><MapPin size={14} /> {c.address}, {c.city}</div>
              {c.website && <div className="detail-row"><Globe size={14} /> {c.website}</div>}
              <div className="detail-row"><Mail size={14} /> {c.email}</div>
              <div className="detail-row"><Phone size={14} /> {c.phone}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Companies;
