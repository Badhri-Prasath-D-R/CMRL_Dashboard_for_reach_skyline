import React, { useState, useEffect } from 'react';
import api from '../api';

const Efficiency = () => {
  const [teamData, setTeamData] = useState([]);

  useEffect(() => {
    fetchEfficiency();
  }, []);

  const fetchEfficiency = async () => {
    try {
      const response = await api.get('/efficiency/teams');
      setTeamData(response.data);
    } catch (error) {
      console.error('Error fetching efficiency:', error);
    }
  };

  const getColor = (score) => {
    if (score >= 90) return '#28a745';
    if (score >= 50) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', color: '#007bff', marginBottom: '30px' }}>
        Team Efficiency Report
      </h1>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Total Tasks</th>
              <th>Completed Tasks</th>
              <th>Efficiency Score</th>
              <th>Performance Bar</th>
            </tr>
          </thead>
          <tbody>
            {teamData.map((team, index) => (
              <tr key={index}>
                <td style={{ fontWeight: 'bold', color: '#555' }}>{team.department}</td>
                <td>{team.total}</td>
                <td>{team.completed}</td>
                <td style={{ fontWeight: 'bold', fontSize: '16px', color: getColor(team.efficiency) }}>
                  {team.efficiency}%
                </td>
                <td style={{ width: '40%', verticalAlign: 'middle' }}>
                  <div style={{ 
                    backgroundColor: '#e9ecef', 
                    height: '12px', 
                    borderRadius: '6px', 
                    overflow: 'hidden',
                    width: '100%',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ 
                      width: `${Math.min(team.efficiency, 100)}%`, 
                      height: '100%', 
                      backgroundColor: getColor(team.efficiency),
                      transition: 'width 0.8s ease-in-out',
                      borderRadius: '6px'
                    }}></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Efficiency;