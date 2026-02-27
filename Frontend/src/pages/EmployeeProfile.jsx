import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

const EmployeeProfile = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  
  const DAILY_CAPACITY = 480;

  useEffect(() => {
    fetchEmployee();
    fetchTasks();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const response = await api.get(`/employees/${id}`);
      setEmployee(response.data);
    } catch (error) {
      console.error('Error fetching employee:', error);
      setEmployee({ empID: id, name: 'Unknown Employee', role: 'N/A' });
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get(`/tasks?assignedTo=${id}`);
      setMyTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleLinkChange = (index, value) => {
    const updatedTasks = [...myTasks];
    updatedTasks[index].submissionLink = value;
    setMyTasks(updatedTasks);
  };

  const handleAttendedCallsChange = (index, value) => {
    const updatedTasks = [...myTasks];
    updatedTasks[index].manualAttendedCalls = value;
    setMyTasks(updatedTasks);
  };

  const markAsDone = async (taskToUpdate) => {
    const isTelecaller = employee?.team === 'telecaller';
    if (isTelecaller && (!taskToUpdate.manualAttendedCalls || taskToUpdate.manualAttendedCalls === "")) {
      alert("Please enter the number of calls you attended.");
      return;
    }
    if (!isTelecaller && (!taskToUpdate.submissionLink || taskToUpdate.submissionLink.trim() === "")) {
      alert("Please enter a valid link before marking as done.");
      return;
    }

    const updateData = {
      status: isTelecaller ? 'Call Completed' : 'Completed',
      submissionLink: taskToUpdate.submissionLink,
      manualAttendedCalls: taskToUpdate.manualAttendedCalls
    };

    try {
      await api.put(`/tasks/${taskToUpdate.id}`, updateData);
      fetchTasks();
    } catch (error) {
      console.error('Error marking task as done:', error);
      alert('Failed to update task');
    }
  };

  const getWorkDescription = (task) => {
    if (task.callsDescription) return task.callsDescription; 
    if (task.description) return task.description; 
    if (task.count) {
        const workName = Object.keys(task.count).find(key => task.count[key] > 0);
        return workName || "General Task";
    }
    return "Assigned Work";
  };

  const getTotalMinutes = (task) => {
    if (!task.minutes) return 0;
    return Object.values(task.minutes).reduce((a, b) => parseInt(a||0) + parseInt(b||0), 0);
  };

  const assignedMinutes = myTasks.reduce((sum, t) => sum + getTotalMinutes(t), 0);
  const usedMinutes = myTasks
    .filter(t => t.status === 'Completed' || t.status === 'Call Completed')
    .reduce((sum, t) => sum + getTotalMinutes(t), 0);
  const efficiencyScore = Math.round((usedMinutes / DAILY_CAPACITY) * 100);

  const getEfficiencyColor = (score) => {
    if (score >= 90) return '#28a745'; 
    if (score >= 70) return '#ffc107'; 
    return '#dc3545'; 
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Completed': 
      case 'Call Completed': return { color: '#28a745', fontWeight: 'bold' };
      case 'Revision': return { color: '#dc3545', fontWeight: 'bold' };
      case 'Not Completed': return { color: '#e74c3c', fontWeight: 'bold' };
      default: return { color: '#e67e22', fontWeight: 'bold' };
    }
  };

  if (!employee) return <div className="container">Loading...</div>;

  const isTelecaller = employee.team === 'telecaller';

  return (
    <div className="container">
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #007bff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, color: '#2c3e50' }}>{employee.name} <span style={{ fontSize: '16px', color: '#777' }}>({employee.empID})</span></h1>
            <p style={{ margin: '5px 0 0', color: '#007bff', fontWeight: 'bold' }}>{employee.role}</p>
          </div>
          
          <div style={{ textAlign: 'center', background: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <span style={{ display: 'block', fontSize: '12px', color: '#777', marginBottom: '5px' }}>Efficiency</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: getEfficiencyColor(efficiencyScore) }}>
              {efficiencyScore}%
            </span>
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '15px', color: '#444' }}>My Assigned Tasks</h3>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              {!isTelecaller && <th>Code</th>}
              <th>Activity Type</th> 
              <th>Work</th>
              {isTelecaller && <th>Attend Call</th>}
              <th>Min</th>
              <th>Link</th>
              <th>Status</th>
              <th>Remark</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {myTasks.length === 0 ? (
              <tr><td colSpan={isTelecaller ? 11 : 10} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No pending tasks.</td></tr>
            ) : (
              myTasks.map((task, index) => (
                <tr key={task.id} style={{ backgroundColor: task.status === 'Completed' || task.status === 'Call Completed' ? '#e8f5e9' : task.status === 'Revision' ? '#fff3e0' : 'white' }}>
                  
                  <td>{task.deliveryDate}</td>
                  <td style={{ fontWeight: 'bold' }}>{task.client}</td>
                  
                  {!isTelecaller && (
                    <td><span style={{ background: '#eee', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{task.activityCode}</span></td>
                  )}
                  
                  <td>{task.activityType || '-'}</td>
                  
                  <td style={{ color: '#555' }}>{getWorkDescription(task)}</td>
                  
                  {isTelecaller && (
                    <td>
                      {task.status === 'Call Completed' ? (
                        <span style={{ fontWeight: 'bold', color: '#28a745' }}>{task.manualAttendedCalls}</span>
                      ) : (
                        <input 
                          type="number" 
                          placeholder="0"
                          value={task.manualAttendedCalls || ''}
                          onChange={(e) => handleAttendedCallsChange(index, e.target.value)}
                          style={{ width: '70px', padding: '5px', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center' }}
                        />
                      )}
                    </td>
                  )}

                  <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
                    {getTotalMinutes(task)}
                  </td>

                  <td>
                    {task.status === 'Completed' || task.status === 'Call Completed' ? (
                      task.submissionLink ? <a href={task.submissionLink} target="_blank" rel="noreferrer">View</a> : '-'
                    ) : (
                      <input 
                        type="text" 
                        placeholder="Link..." 
                        value={task.submissionLink || ''}
                        onChange={(e) => handleLinkChange(index, e.target.value)}
                        style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px', width: '80px', fontSize: '12px' }}
                      />
                    )}
                  </td>
                  
                  <td style={getStatusStyle(task.status)}>
                    {task.status}
                  </td>

                  <td style={{ color: '#e74c3c', fontSize: '13px', maxWidth: '150px' }}>
                    {task.remarks || "-"}
                  </td>

                  <td>
                    {task.status !== 'Completed' && task.status !== 'Call Completed' ? (
                      <button 
                        onClick={() => markAsDone(task)}
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '12px', 
                          background: '#007bff', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer' 
                        }}
                      >
                        {task.status === 'Revision' ? 'Re-Submit' : 'Mark Done'}
                      </button>
                    ) : (
                      <span style={{ color: '#28a745', fontSize: '18px' }}>✔</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeProfile;