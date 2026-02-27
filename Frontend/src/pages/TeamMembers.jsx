import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const TeamMembers = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    empID: '',
    name: '',
    role: '',
    team: '',
    email: '',
    password: '',
    is_admin: false
  });
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // You'd get this from user info (e.g., from token or separate endpoint)

  useEffect(() => {
    fetchEmployees();
    checkAdminStatus(); // Implement this – get current user info from /auth/me
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const response = await api.get('/auth/me'); // You need to implement this endpoint
      setIsAdmin(response.data.is_admin);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = { ...formData };
      if (submitData.team === '') {
        submitData.team = null;
      }
      if (editingId && submitData.password === '') {
        delete submitData.password;
      }
      if (editingId) {
        await api.put(`/employees/${editingId}`, submitData);
      } else {
        await api.post('/employees', submitData);
      }
      fetchEmployees();
      resetForm();
    } catch (error) {
      console.error('Error saving employee:', error);
      console.error('Response data:', error.response?.data);
      alert('Failed to save employee: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (emp) => {
    setEditingId(emp.id);
    setFormData({
      empID: emp.empID,
      name: emp.name,
      role: emp.role,
      team: emp.team || '',
      email: emp.email,
      password: '', // leave blank for update
      is_admin: emp.is_admin || false
    });
    setShowForm(true);
  };

  const handleDelete = async (empId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/employees/${empId}`);
        fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Failed to delete employee');
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      empID: '',
      name: '',
      role: '',
      team: '',
      email: '',
      password: '',
      is_admin: false
    });
    setShowForm(false);
  };

  // Group employees by team (for display)
  const teams = {
    branding: employees.filter(e => e.team === 'branding'),
    telecaller: employees.filter(e => e.team === 'telecaller'),
    website: employees.filter(e => e.team === 'website'),
    seo: employees.filter(e => e.team === 'seo'),
    campaign: employees.filter(e => e.team === 'campaign'),
    other: employees.filter(e => !e.team)
  };

  const teamNames = {
    branding: 'Branding & Creatives Team',
    telecaller: 'Telecaller Team',
    website: 'Website Team',
    seo: 'SEO Team',
    campaign: 'Campaign Team',
    other: 'Other Employees'
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#007bff' }}>Team Members Directory</h1>

      {isAdmin && (
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => setShowForm(!showForm)} style={{ background: '#28a745' }}>
            {showForm ? 'Cancel' : '+ Add New Employee'}
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="form-section" style={{ marginBottom: '30px' }}>
          <h3>{editingId ? 'Edit Employee' : 'Add New Employee'}</h3>
          <div className="form-grid">
            <input type="text" name="empID" placeholder="Employee ID (e.g., E001)" value={formData.empID} onChange={handleInputChange} required disabled={!!editingId} />
            <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} required />
            <input type="text" name="role" placeholder="Role" value={formData.role} onChange={handleInputChange} required />
            <select name="team" value={formData.team} onChange={handleInputChange} required>
              <option value="">Select Team</option>
              <option value="branding">Branding</option>
              <option value="telecaller">Telecaller</option>
              <option value="website">Website</option>
              <option value="seo">SEO</option>
              <option value="campaign">Campaign</option>
              <option value="">None</option>
            </select>
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
            <input type="password" name="password" placeholder={editingId ? "Leave blank to keep unchanged" : "Password"} value={formData.password} onChange={handleInputChange} required={!editingId} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="checkbox" name="is_admin" checked={formData.is_admin} onChange={handleInputChange} />
              Admin Privileges
            </label>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}
          </button>
          <button type="button" onClick={resetForm} style={{ marginLeft: '10px', background: '#6c757d' }}>Cancel</button>
        </form>
      )}

      {Object.entries(teams).map(([teamKey, members]) => members.length > 0 && (
        <div key={teamKey} className="team-section" style={{ marginBottom: '30px' }}>
          <h2>{teamNames[teamKey]}</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td><Link to={`/employee-profile/${m.empID}`} className="emp-id">{m.empID}</Link></td>
                  <td>{m.name}</td>
                  <td>{m.role}</td>
                  <td>{m.email}</td>
                  {isAdmin && (
                    <td>
                      <button onClick={() => handleEdit(m)} style={{ marginRight: '5px', background: '#ffc107' }}>Edit</button>
                      <button onClick={() => handleDelete(m.id)} style={{ background: '#dc3545' }}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default TeamMembers;