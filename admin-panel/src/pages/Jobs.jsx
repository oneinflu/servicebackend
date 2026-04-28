import React, { useEffect, useState } from 'react';
import { jobAPI } from '../api/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Search, Briefcase, MapPin, Trash2, ExternalLink, User, Edit2, Plus } from 'lucide-react';
import './Jobs.css';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    city: '',
    state: '',
    isCompanyPost: false
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getAll();
      setJobs(response.data.data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (job = null) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        city: job.location?.city || '',
        state: job.location?.state || '',
        isCompanyPost: job.isCompanyPost || false
      });
    } else {
      setEditingJob(null);
      setFormData({ city: '', state: '', isCompanyPost: false });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    alert('Job updated (Simulated)');
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await jobAPI.delete(id);
        fetchJobs();
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="jobs-page">
      <div className="page-header-actions">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by employer or city..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Post Job
        </Button>
      </div>

      <Card className="full-width-card">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Categories</th>
              <th>Employer</th>
              <th>Location</th>
              <th>Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center">Loading jobs...</td></tr>
            ) : filteredJobs.length === 0 ? (
              <tr><td colSpan="5" className="text-center">No job posts found.</td></tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job._id}>
                  <td>
                    <div className="category-pills">
                      {job.categories && job.categories.map((cat, idx) => (
                        <span key={idx} className="type-badge job">
                          {cat.name || 'Job'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="provider-cell">
                      <User size={14} />
                      <span>{job.user?.name || 'Recruiter'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="location-cell">
                      <MapPin size={14} />
                      <span>{job.location?.city}, {job.location?.state}</span>
                    </div>
                  </td>
                  <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                  <td className="text-right">
                    <div className="action-btns end">
                      <button className="icon-btn edit" onClick={() => handleOpenModal(job)}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(job._id)} className="icon-btn delete">
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
            <h2>{editingJob ? 'Edit Private Job' : 'Post New Job'}</h2>
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
                  Mark as Verified Company Job
                </label>
              </div>
              <div className="modal-actions">
                <Button variant="outlined" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Job</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Jobs;
