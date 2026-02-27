import React, { useState, useEffect } from 'react';
import api from '../api';

const ClientPage = () => {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients?archived=true'); // or just '/clients' to include all
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const getTotalTaskCount = (client) => {
    let total = 0;
    total += parseInt(client.Posters?.count || 0);
    total += parseInt(client.Reels?.count || 0);
    total += parseInt(client.Shorts?.count || 0);
    total += parseInt(client.Longform?.count || 0);
    total += parseInt(client.Carousel?.count || 0);
    total += parseInt(client.EventDay?.count || 0);
    total += parseInt(client.Blog?.count || 0);
    total += parseInt(client.Web?.count || 0);
    total += parseInt(client.SEO?.count || 0);
    total += parseInt(client.Campaign?.count || 0);
    total += parseInt(client.Calls?.count || 0);
    return total;
  };

  const exportToCSV = () => {
    if (clients.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = [
      "Client ID", "Client Name", "Industry", "Phone", "Email", "Delivery Date",
      "Total Tasks", "Total Amount"
    ];

    const rows = clients.map(client => [
      client.clientID,
      `"${client.clientName}"`, 
      client.industry,
      client.phone,
      client.email,
      client.deliveryDate,
      getTotalTaskCount(client),
      client.totalAmount
    ]);

    const csvContent = [
      headers.join(","), 
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const date = new Date();
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    link.setAttribute("href", url);
    link.setAttribute("download", `Client_Report_${monthYear}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetData = () => {
    if (window.confirm("⚠️ WARNING: This will delete ALL client records. Are you sure?")) {
      alert('Reset functionality not implemented in API');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#007bff', margin: 0 }}>All Client Records</h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleResetData}
            style={{ 
              background: '#dc3545', 
              padding: '10px 15px', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer' 
            }}
          >
            Reset Data
          </button>

          <button 
            onClick={exportToCSV}
            style={{ 
              background: '#28a745', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px 20px',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📊 Export to Excel
          </button>
        </div>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Industry</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Task Count</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No client records found.</td></tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 'bold', color: '#007bff' }}>{c.clientID || "-"}</td>
                  <td style={{ fontWeight: 'bold' }}>{c.clientName || "Unknown"}</td>
                  <td>{c.industry || "-"}</td>
                  <td>{c.phone || "-"}</td>
                  <td>{c.email || "-"}</td>
                  <td style={{ fontWeight: 'bold', fontSize: '15px', color: '#555', textAlign:'center' }}>
                    {getTotalTaskCount(c)}
                  </td>
                  <td style={{ fontWeight: 'bold', color: '#28a745' }}>₹{c.totalAmount || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientPage;