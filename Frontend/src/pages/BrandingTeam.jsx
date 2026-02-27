import React, { useState, useEffect } from 'react';
import api from '../api';

const BrandingTeam = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks?team=branding');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees?team=branding');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleAssign = async (taskId, empID) => {
    if (!empID) return alert("Please select an option!");
    if (empID === "DELETE") {
      handleDelete(taskId);
      return;
    }
    try {
      await api.put(`/tasks/${taskId}`, { assignedTo: empID, status: 'Assigned' });
      fetchTasks();
      alert(`Task assigned to ${empID} successfully!`);
    } catch (error) {
      console.error('Error assigning task:', error);
      alert('Failed to assign task');
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm("⚠️ DELETE WARNING:\nThis will remove the task from this team AND delete the data from the Client Page.\n\nAre you sure?")) {
      try {
        await api.delete(`/tasks/${taskId}`);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task');
      }
    }
  };

  const updateTaskField = async (taskId, field, value) => {
    try {
      await api.put(`/tasks/${taskId}`, { [field]: value });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', color: '#007bff' }}>Branding & Creative Team</h1>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Client</th><th>ID</th><th>Date</th><th>Code</th><th>Type</th>
              <th>Count</th><th>Min</th><th>Amt</th><th>Link</th><th>Status</th>
              <th>Remarks</th><th>Action</th><th>Assign</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr><td colSpan="13" style={{textAlign: 'center'}}>No Tasks Found</td></tr>
            ) : (
              tasks.map((task) => (
                <TaskRow 
                  key={task.id} 
                  task={task} 
                  employees={employees}
                  onAssign={handleAssign}
                  onDelete={handleDelete}
                  onUpdate={updateTaskField}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TaskRow = ({ task, employees, onAssign, onDelete, onUpdate }) => {
  const [selectedEmp, setSelectedEmp] = useState(task.assignedTo || "");

  const getTotal = (obj) => Object.values(obj || {}).reduce((a, b) => parseInt(a||0) + parseInt(b||0), 0);
  const getTotalAmount = (t) => {
    if (t.amount && Object.keys(t.amount).length > 0) return getTotal(t.amount);
    return 0;
  };
  const getWorkCount = (t) => {
    if (!t.count) return 0;
    const activeType = Object.keys(t.count).find(key => t.count[key] > 0);
    return activeType ? (t.count[activeType] || 0) : 0;
  };
  const getActivityTypeDisplay = (t) => {
    if (!t.count) return "-";
    const type = Object.keys(t.count).find(key => t.count[key] > 0);
    const typeCodes = { 
      'Posters': 'Poster (AT001)', 'Reels': 'Reel (AT002)', 'Carousel': 'Carousel (AT003)', 
      'Shorts': 'Shorts (AT004)', 'Longform': 'Longform (AT005)', 'EventDay': 'Event Day (AT006)', 
      'Blog': 'Blog (AT007)', 'JobWork': 'Job Work (AT008)' 
    };
    return typeCodes[type] || type || "-";
  };

  const handleEditLink = () => {
    const newLink = prompt("Edit Link URL:", task.submissionLink || "");
    if (newLink !== null) onUpdate(task.id, 'submissionLink', newLink);
  };

  return (
    <tr>
      <td>{task.client}</td><td>{task.clientID}</td><td>{task.deliveryDate}</td><td>{task.activityCode}</td>
      <td>{getActivityTypeDisplay(task)}</td>
      <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>{getWorkCount(task)}</td>
      <td>{getTotal(task.minutes)}</td><td>{getTotalAmount(task)}</td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {task.submissionLink ? <a href={task.submissionLink} target="_blank" rel="noreferrer" style={{fontSize:'12px', textDecoration:'none'}}>🔗 View</a> : <span style={{color:'#999'}}>-</span>}
          <button onClick={handleEditLink} style={{border:'none', background:'none', cursor:'pointer'}}>✎</button>
        </div>
      </td>
      <td>
        <select 
          value={task.status || 'Pending'} 
          onChange={(e) => onUpdate(task.id, 'status', e.target.value)} 
          style={{ 
            padding: '4px', borderRadius: '4px', 
            borderColor: task.status === 'Completed' ? '#28a745' : task.status === 'Revision' ? '#dc3545' : '#ced4da', 
            color: task.status === 'Completed' ? '#28a745' : task.status === 'Revision' ? '#dc3545' : 'black', 
            fontWeight: 'bold' 
          }}
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Not Completed">Not Completed</option>
          <option value="Revision">Revision</option>
        </select>
      </td>
      <td>
        <input 
          type="text" 
          placeholder="Add remarks..." 
          defaultValue={task.remarks || ""} 
          onBlur={(e) => onUpdate(task.id, 'remarks', e.target.value)} 
          style={{ padding: '4px', border: '1px solid #eee', borderRadius: '4px', width: '100%' }} 
        />
      </td>
      <td>
        {task.assignedTo ? (
          <span style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '12px' }}>Assigned to {task.assignedTo}</span>
        ) : (
          <button onClick={() => onDelete(task.id)}>Delete</button>
        )}
      </td>
      <td>
        <div style={{ display: 'flex', gap: '5px' }}>
          <select 
            value={selectedEmp} 
            onChange={(e) => setSelectedEmp(e.target.value)} 
            style={{ padding: '5px', borderRadius: '4px', width: '80px' }}
          >
            <option value="">Select</option>
            <option value="DELETE" style={{ color: 'red', fontWeight: 'bold' }}>❌ Delete</option>
            {employees.map(emp => (
              <option key={emp.empID} value={emp.empID}>{emp.empID}</option>
            ))}
          </select>
          <button 
            onClick={() => onAssign(task.id, selectedEmp)} 
            style={{ padding: '5px 8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Send
          </button>
        </div>
      </td>
    </tr>
  );
};

export default BrandingTeam;