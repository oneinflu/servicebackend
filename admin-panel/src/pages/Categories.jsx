import React, { useEffect, useState } from 'react';
import { categoryAPI } from '../api/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Search, Plus, Trash2, Edit2, Zap, Briefcase, Filter } from 'lucide-react';
import './Categories.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Service');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'Service' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data.data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({ name: cat.name, type: cat.type });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', type: activeTab });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoryAPI.update(editingCategory._id, formData);
      } else {
        await categoryAPI.create(formData);
      }
      fetchCategories();
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryAPI.delete(id);
        fetchCategories();
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.type === activeTab && 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="categories-page">
      <div className="page-header-actions">
        <div className="category-toggle">
          <button 
            className={`toggle-btn ${activeTab === 'Service' ? 'active' : ''}`}
            onClick={() => setActiveTab('Service')}
          >
            <Zap size={16} />
            Services
          </button>
          <button 
            className={`toggle-btn ${activeTab === 'Job' ? 'active' : ''}`}
            onClick={() => setActiveTab('Job')}
          >
            <Briefcase size={16} />
            Jobs
          </button>
        </div>

        <div className="search-and-add">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab.toLowerCase()} categories...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Category
          </Button>
        </div>
      </div>

      <Card className="full-width-card">
        <table className="sb-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category Name</th>
              <th>Type</th>
              <th>Created Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center">Loading...</td></tr>
            ) : filteredCategories.length === 0 ? (
              <tr><td colSpan="5" className="text-center">No categories found in this section.</td></tr>
            ) : (
              filteredCategories.map((cat, index) => (
                <tr key={cat._id}>
                  <td className="dim-text">#{index + 1}</td>
                  <td><b>{cat.name}</b></td>
                  <td>
                    <span className={`type-badge ${cat.type.toLowerCase()}`}>
                      {cat.type}
                    </span>
                  </td>
                  <td className="dim-text">{new Date(cat.createdAt).toLocaleDateString()}</td>
                  <td className="text-right">
                    <div className="action-btns end">
                      <button className="icon-btn edit" onClick={() => handleOpenModal(cat)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="icon-btn delete" onClick={() => handleDelete(cat._id)}>
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
            <h2>{editingCategory ? 'Edit Category' : 'Create New Category'}</h2>
            <form onSubmit={handleSubmit}>
              <Input 
                label="Category Name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
              <div className="form-group">
                <label className="sb-label-static">Category Type</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      value="Service" 
                      checked={formData.type === 'Service'} 
                      onChange={(e) => setFormData({...formData, type: e.target.value})} 
                    />
                    Service
                  </label>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      value="Job" 
                      checked={formData.type === 'Job'} 
                      onChange={(e) => setFormData({...formData, type: e.target.value})} 
                    />
                    Job
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <Button variant="outlined" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Category</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Categories;
