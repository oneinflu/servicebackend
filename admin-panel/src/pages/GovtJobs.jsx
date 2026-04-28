import React, { useEffect, useState } from 'react';
import { govtJobAPI } from '../api/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Search, ShieldCheck, Trash2, Edit2, Plus, Calendar, Building, MapPin, Link as LinkIcon, Info } from 'lucide-react';
import './GovtJobs.css';

const GovtJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    jobTitle: '',
    organizationName: '',
    lastDateToApply: '',
    applyLink: '',
    jobType: 'Govt Jobs'
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await govtJobAPI.getAll();
      setJobs(response.data.data.governmentJobs || []);
    } catch (err) {
      console.error('Failed to fetch govt jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await govtJobAPI.update(editingId, formData);
      } else {
        await govtJobAPI.create(formData);
      }
      fetchJobs();
      setIsModalOpen(false);
    } catch (err) {
      alert('Operation failed. Please check all fields.');
    }
  };

  const handleEdit = (job) => {
    setFormData({
      jobTitle: job.jobTitle,
      organizationName: job.organizationName,
      lastDateToApply: job.lastDateToApply ? new Date(job.lastDateToApply).toISOString().split('T')[0] : '',
      applyLink: job.applyLink,
      jobType: job.jobType
    });
    setEditingId(job._id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this government job posting?')) {
      try {
        await govtJobAPI.delete(id);
        fetchJobs();
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="govt-jobs-page">
      <div className="page-header-actions">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by title or organization..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({ jobTitle: '', organizationName: '', lastDateToApply: '', applyLink: '', jobType: 'Govt Jobs' }); }}>
          <Plus size={18} /> Add Govt Job
        </Button>
      </div>

      <Card className="full-width-card">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Job Information</th>
              <th>Organization</th>
              <th>Type</th>
              <th>Last Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center">Loading...</td></tr>
            ) : filteredJobs.length === 0 ? (
              <tr><td colSpan="5" className="text-center">No government jobs found.</td></tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job._id}>
                  <td>
                    <div className="job-title-cell">
                      <b>{job.jobTitle}</b>
                      <a href={job.applyLink} target="_blank" rel="noreferrer" className="apply-link-mini">
                        <LinkIcon size={12} /> Apply URL
                      </a>
                    </div>
                  </td>
                  <td>
                    <div className="org-cell">
                      <Building size={14} />
                      <span>{job.organizationName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="type-badge job">
                      {job.jobType}
                    </span>
                  </td>
                  <td>
                    <div className="date-cell">
                      <Calendar size={14} />
                      {new Date(job.lastDateToApply).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="action-btns end">
                      <button onClick={() => handleEdit(job)} className="icon-btn edit"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(job._id)} className="icon-btn delete"><Trash2 size={16} /></button>
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
            <h2>{editingId ? 'Edit Job Posting' : 'Create Govt Posting'}</h2>
            <form onSubmit={handleSubmit}>
              <Input label="Job Title (e.g. IAS Officer)" value={formData.jobTitle} onChange={(e) => setFormData({...formData, jobTitle: e.target.value})} required />
              <Input label="Organization (e.g. UPSC)" value={formData.organizationName} onChange={(e) => setFormData({...formData, organizationName: e.target.value})} required />
              
              <div className="form-row">
                <div className="form-group">
                  <label className="sb-label-static">Job Classification</label>
                  <select 
                    className="sb-select"
                    value={formData.jobType}
                    onChange={(e) => setFormData({...formData, jobType: e.target.value})}
                    required
                  >
                    <option value="Govt Jobs">Govt Jobs</option>
                    <option value="PSU Jobs">PSU Jobs</option>
                    <option value="Semi Govt Jobs">Semi Govt Jobs</option>
                    <option value="MSME Jobs">MSME Jobs</option>
                  </select>
                </div>
                <Input label="Last Date to Apply" type="date" value={formData.lastDateToApply} onChange={(e) => setFormData({...formData, lastDateToApply: e.target.value})} required />
              </div>

              <Input label="Official Application Link" value={formData.applyLink} onChange={(e) => setFormData({...formData, applyLink: e.target.value})} required />
              
              <div className="modal-actions">
                <Button variant="outlined" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Posting</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GovtJobs;
