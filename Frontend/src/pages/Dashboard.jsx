// Dashboard.jsx (updated)
import React, { useState, useEffect } from 'react';
import api from '../api'; // adjust path

const Dashboard = () => {
  const [clientInfo, setClientInfo] = useState({
    clientName: '', industry: '', deliveryDate: '', phone: '', email: ''
  });
  const [activeService, setActiveService] = useState('Web');
  
  const [deliverables, setDeliverables] = useState({
    Web: { checked: false, count: 1, amount: 0, min: 0, description: '' },
    SEO: { checked: false, count: 1, amount: 0, min: 0, description: '' },
    Campaign: { checked: false, count: 1, amount: 0, min: 0, description: '' },
    Calls: { checked: false, count: 0, amount: 0, min: 0, description: '' },
    Posters: { checked: false, count: 0, min: 0, amo: 0 },
    Reels: { checked: false, count: 0, min: 0, amo: 0 },
    Shorts: { checked: false, count: 0, min: 0, amo: 0 },
    Longform: { checked: false, count: 0, min: 0, amo: 0 },
    Carousel: { checked: false, count: 0, min: 0, amo: 0 },
    EventDay: { checked: false, count: 0, amo: 0 },
    Blog: { checked: false, count: 0, min: 0, amo: 0 } 
  });

  const [tableRows, setTableRows] = useState([]);
  const [existingClients, setExistingClients] = useState([]); // for dropdown
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients?archived=false');
      console.log('fetchClients response.data:', response.data); // <-- ADDED
      // Add _id field from id for compatibility
      const clients = response.data.map(client => ({ ...client, _id: client.id }));
      setTableRows(clients);
      setExistingClients(clients);
    } catch (error) {
      console.log('fetchClients response.data:', JSON.stringify(response.data, null, 2));
    }
  };

  const handleInputChange = (e) => setClientInfo({ ...clientInfo, [e.target.id]: e.target.value });

  const handleDeliverableChange = (key, field, value) => {
    setDeliverables(prev => {
      const current = { ...prev[key] };
      if (field === 'checked') {
        current.checked = value;
        if (!value) {
           current.count = 0; current.min = 0; current.amo = 0; current.amount = 0; current.description = '';
        } else if (['Web', 'SEO', 'Campaign'].includes(key)) {
          current.count = 1;
        }
      } else if (field === 'description') {
        current.description = value;
      } else {
        current[field] = parseInt(value) || 0;
      }
      return { ...prev, [key]: current };
    });
  };

  const handleAssignClient = (clientID) => {
    const client = existingClients.find(c => c.clientID === clientID);
    if (client) {
      setClientInfo({
        clientName: client.clientName, industry: client.industry,
        deliveryDate: client.deliveryDate, phone: client.phone, email: client.email
      });
      setShowAssignDropdown(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isAnySelected = Object.values(deliverables).some(d => d.checked);
    if (!isAnySelected) {
      setFormError('Please select at least one deliverable.');
      setTimeout(() => setFormError(''), 3000);
      return;
    }

    // Prepare client data object – include only checked deliverables
    const clientData = { ...clientInfo };
    Object.keys(deliverables).forEach(key => {
      if (deliverables[key].checked) {
        // For branding items, we send `amo` as `amount`? The backend expects `amount` field.
        // We'll convert `amo` to `amount` if present.
        const item = { ...deliverables[key] };
        if (item.amo !== undefined && item.amount === undefined) {
          item.amount = item.amo;
        }
        // Remove `amo` to avoid confusion
        delete item.amo;
        delete item.checked; // don't send checked
        clientData[key] = item;
      }
    });

    setLoading(true);
    try {
      const response = await api.post('/clients', clientData);
      // After successful submission, refresh client list
      await fetchClients();
      // Optionally reset form
      setClientInfo({ clientName: '', industry: '', deliveryDate: '', phone: '', email: '' });
      // Reset deliverables (uncheck all)
      const resetDeliverables = { ...deliverables };
      Object.keys(resetDeliverables).forEach(key => {
        resetDeliverables[key].checked = false;
        resetDeliverables[key].count = key === 'Web' || key === 'SEO' || key === 'Campaign' ? 1 : 0;
        resetDeliverables[key].amount = 0;
        resetDeliverables[key].min = 0;
        resetDeliverables[key].amo = 0;
        resetDeliverables[key].description = '';
      });
      setDeliverables(resetDeliverables);
      alert(response.data.clientID ? `Client created/updated with ID: ${response.data.clientID}` : 'Client saved');
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToTeam = async (row, teamName) => {
    if (!teamName || teamName === "Select Team") return alert("Please select a team!");
    console.log('handleSendToTeam row:', JSON.stringify(row, null, 2));

    // Build task data based on team (similar to original logic)
    const teamMap = {
      'Website': 'website',
      'Branding': 'branding',
      'SEO': 'seo',
      'Campaign': 'campaign',
      'Telecaller': 'telecaller'
    };
    const team = teamMap[teamName];
    if (!team) return alert('Invalid team');

    const displayCode = Object.values(row.activityCodes || {})[0] || "PENDING";

    const baseTask = {
      team,
      client: row.clientName,
      clientID: row.clientID,
      activityCode: displayCode,
      deliveryDate: row.deliveryDate,
    };

    let taskData;
    if (team === 'website' || team === 'seo' || team === 'campaign') {
      const dataKey = team === 'website' ? 'Web' : team === 'seo' ? 'SEO' : 'Campaign';
      taskData = {
        ...baseTask,
        count: { [dataKey]: row[dataKey]?.count || 0 },
        amount: { [dataKey]: row[dataKey]?.amount || row[dataKey]?.amo || 0 },
        minutes: { [dataKey]: row[dataKey]?.min || 0 },
        description: row[dataKey]?.description || ''
      };
    } else if (team === 'telecaller') {
      taskData = {
        ...baseTask,
        count: { Calls: row.Calls?.count || 0 },
        amount: { Calls: row.Calls?.amount || 0 },
        minutes: { Calls: row.Calls?.min || 0 },
        callsDescription: row.Calls?.description || ''
      };
    } else { // branding
      taskData = {
        ...baseTask,
        minutes: {
          Posters: row.Posters?.min, Reels: row.Reels?.min, Shorts: row.Shorts?.min,
          Longform: row.Longform?.min, Carousel: row.Carousel?.min, Blog: row.Blog?.min
        },
        amount: {
          Posters: row.Posters?.amo, Reels: row.Reels?.amo, Shorts: row.Shorts?.amo,
          Longform: row.Longform?.amo, Carousel: row.Carousel?.amo, "Event Day": row.EventDay?.amo,
          Blog: row.Blog?.amo
        },
        count: {
          Posters: row.Posters?.count, Reels: row.Reels?.count, Shorts: row.Shorts?.count,
          Longform: row.Longform?.count, Carousel: row.Carousel?.count, "Event Day": row.EventDay?.count,
          Blog: row.Blog?.count
        },
        callsDescription: row.Calls?.description || ''
      };
    }

    // Determine client ID for archiving: use _id if present, else fallback to id
    const clientId = row._id || row.id;
    if (!clientId) {
      console.error('No client ID found for archiving:', row);
      alert('Client ID missing. Cannot archive.');
      return;
    }

    try {
      // 1. Create task
      await api.post('/tasks', taskData);
      // 2. Archive the client
      await api.put(`/clients/${clientId}`, { isArchived: true });
      // 3. Refresh client list
      await fetchClients();
      alert(`Work assigned to ${teamName}. Row removed from Dashboard.`);
    } catch (error) {
      console.error('Error sending to team:', error);
      console.log('handleSendToTeam row:', JSON.stringify(row, null, 2));
      alert('Failed to assign task');
    }
  };

  // Helper functions and rendering (unchanged)
  const renderReqItem = (key, label, hasMinutes = true) => {
    const item = deliverables[key];
    return (
      <label className="req-item" key={key}>
        <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
            <input 
            type="checkbox" 
            checked={item.checked} 
            onChange={(e) => handleDeliverableChange(key, 'checked', e.target.checked)}
            />
            <span style={{ width: '100px', fontWeight: '500' }}>{label}</span>
            <div className="compact-group">
            <input 
                type="number" className="req-count" placeholder="Cnt"
                disabled={!item.checked} value={item.count}
                onChange={(e) => handleDeliverableChange(key, 'count', e.target.value)}
            />
            <span>/ Amo:</span>
            <input 
                type="number" className="req-amount" placeholder="Amt"
                disabled={!item.checked} value={item.amo || item.amount || 0}
                onChange={(e) => handleDeliverableChange(key, 'amount', e.target.value)}
            />
            {hasMinutes && (
                <>
                <span>Min:</span>
                <input 
                    type="number" className="req-minutes" placeholder="Min"
                    disabled={!item.checked} value={item.min}
                    onChange={(e) => handleDeliverableChange(key, 'min', e.target.value)}
                />
                </>
            )}
            </div>
        </div>
      </label>
    );
  };

  const getViewMode = () => {
    if (deliverables.Calls.checked) return 'CALLS';
    if (deliverables[activeService].checked) {
      if (activeService === 'Web') return 'WEB';
      if (activeService === 'SEO') return 'SEO';
      if (activeService === 'Campaign') return 'CAMPAIGN';
    }
    return 'STANDARD';
  };

  const viewMode = getViewMode();

  return (
    <div className="container" style={{ position: 'relative' }}>
      <h1>Client Request Dashboard</h1>

      <div style={{ position: 'absolute', top: '30px', right: '40px' }}>
        <button onClick={() => setShowAssignDropdown(!showAssignDropdown)}>
          🔄 Assign Client
        </button>
        {showAssignDropdown && (
          <div style={{ position: 'absolute', right: 0, top: '45px', background: '#fff', border: '1px solid #ccc', padding: '10px', borderRadius: '8px', zIndex: 100, minWidth: '200px', maxHeight: '200px', overflowY: 'auto' }}>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Select existing client:</p>
            {existingClients.length === 0 && <p style={{fontSize:'12px'}}>No clients found</p>}
            {existingClients.map(c => (
              <div 
                key={c.clientID} 
                onClick={() => handleAssignClient(c.clientID)}
                style={{ padding: '5px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '13px' }}
              >
                {c.clientID} - {c.clientName}
              </div>
            ))}
          </div>
        )}
      </div>

      <form className="form-section" onSubmit={handleSubmit}>
        <div className="form-grid">
          <input type="text" id="clientName" placeholder="Client Name" value={clientInfo.clientName} onChange={handleInputChange} required />
          <input type="text" id="industry" placeholder="Industry" value={clientInfo.industry} onChange={handleInputChange} required />
          <input type="date" id="deliveryDate" value={clientInfo.deliveryDate} onChange={handleInputChange} required />
          <input type="tel" id="phone" placeholder="Phone Number" value={clientInfo.phone} onChange={handleInputChange} required />
          <input type="email" id="email" placeholder="Email ID" value={clientInfo.email} onChange={handleInputChange} required />
        </div>

        <h3 className="section-title">Monthly Deliverable Requirements</h3>
        
        <div className="requirements-grid">
          
          <label className="req-item" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
            <div style={{display: 'flex', alignItems: 'center', width: '100%', marginBottom: deliverables[activeService].checked ? '10px' : '0'}}>
                <input 
                  type="checkbox" 
                  checked={deliverables[activeService].checked} 
                  onChange={(e) => handleDeliverableChange(activeService, 'checked', e.target.checked)}
                />
                <select 
                  value={activeService}
                  onChange={(e) => setActiveService(e.target.value)}
                  style={{ width: '100px', fontWeight: '500', marginRight: '10px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <option value="Web">Web</option>
                  <option value="SEO">SEO</option>
                  <option value="Campaign">Campaign</option>
                </select>
                
                <div className="compact-group">
                    <input type="number" className="req-count" placeholder="Cnt" disabled value={deliverables[activeService].count} />
                    <span>/ Amo:</span>
                    <input 
                        type="number" className="req-amount" placeholder="Amt"
                        disabled={!deliverables[activeService].checked} 
                        value={deliverables[activeService].amount}
                        onChange={(e) => handleDeliverableChange(activeService, 'amount', e.target.value)}
                    />
                    <span>Min:</span>
                    <input 
                        type="number" className="req-minutes" placeholder="Min"
                        disabled={!deliverables[activeService].checked} 
                        value={deliverables[activeService].min}
                        onChange={(e) => handleDeliverableChange(activeService, 'min', e.target.value)}
                    />
                </div>
            </div>
            {deliverables[activeService].checked && (
                <input 
                    type="text" 
                    placeholder={`Enter ${activeService} Description...`} 
                    value={deliverables[activeService].description}
                    onChange={(e) => handleDeliverableChange(activeService, 'description', e.target.value)}
                    style={{ width: '100%', fontSize: '13px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
            )}
          </label>

          {renderReqItem('Posters', 'Post (P)')}
          {renderReqItem('Reels', 'Reel (R)')}
          {renderReqItem('Shorts', 'Shorts (YTS)')}
          {renderReqItem('Longform', 'Longform (YT)')}
          {renderReqItem('Carousel', 'Carousel (C)')}
          {renderReqItem('EventDay', 'Event Day', false)}
          {renderReqItem('Blog', 'Blog')}
          
          <label className="req-item" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
            <div style={{display: 'flex', alignItems: 'center', width: '100%', marginBottom: deliverables.Calls.checked ? '10px' : '0'}}>
                <input 
                  type="checkbox" 
                  checked={deliverables.Calls.checked} 
                  onChange={(e) => handleDeliverableChange('Calls', 'checked', e.target.checked)}
                />
                <span style={{ width: '100px', fontWeight: '500' }}>Calls</span>
                <div className="compact-group">
                    <input 
                        type="number" className="req-count" placeholder="Cnt"
                        disabled={!deliverables.Calls.checked} 
                        value={deliverables.Calls.count}
                        onChange={(e) => handleDeliverableChange('Calls', 'count', e.target.value)}
                    />
                    <span>/ Amo:</span>
                    <input 
                        type="number" className="req-amount" placeholder="Amt"
                        disabled={!deliverables.Calls.checked} 
                        value={deliverables.Calls.amount}
                        onChange={(e) => handleDeliverableChange('Calls', 'amount', e.target.value)}
                    />
                    <span>Min:</span>
                    <input 
                        type="number" className="req-minutes" placeholder="Min"
                        disabled={!deliverables.Calls.checked} 
                        value={deliverables.Calls.min}
                        onChange={(e) => handleDeliverableChange('Calls', 'min', e.target.value)}
                    />
                </div>
            </div>
            {deliverables.Calls.checked && (
                <input 
                    type="text" 
                    placeholder="Enter Call Description..." 
                    value={deliverables.Calls.description}
                    onChange={(e) => handleDeliverableChange('Calls', 'description', e.target.value)}
                    style={{ width: '100%', fontSize: '13px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
            )}
          </label>

        </div>

        {formError && <p className="error-msg" style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>{formError}</p>}
        <button type="submit" style={{ marginTop: '20px' }} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>

      <div className="table-container">
        <table>
          <thead>
            {viewMode === 'WEB' && (
              <tr>
                <th>Client</th><th>Industry</th><th>DeliveryDate</th><th>Phone</th><th>Email</th>
                <th>Web (Count)</th><th>Web (Amount)</th><th>min</th><th>description</th><th>Assign To</th>
              </tr>
            )}
            {viewMode === 'SEO' && (
              <tr>
                <th>Client</th><th>Industry</th><th>DeliveryDate</th><th>Phone</th><th>Email</th>
                <th>seo(Count)</th><th>seo(Amount)</th><th>min</th><th>description</th><th>Assign To</th>
              </tr>
            )}
            {viewMode === 'CAMPAIGN' && (
              <tr>
                <th>Client</th><th>Industry</th><th>DeliveryDate</th><th>Phone</th><th>Email</th>
                <th>cam (Count)</th><th>cam(Amount)</th><th>min</th><th>description</th><th>Assign To</th>
              </tr>
            )}
            {viewMode === 'CALLS' && (
              <tr>
                <th>Client</th><th>Industry</th><th>DeliveryDate</th><th>Phone</th><th>Email</th>
                <th>call assigned</th><th>min</th><th>description</th><th>Assign To</th>
              </tr>
            )}
            {viewMode === 'STANDARD' && (
              <tr>
                <th>Client</th><th>Industry</th><th>DeliveryDate</th><th>Phone</th><th>Email</th>
                <th>P (Count/Amo)</th><th>(Min)</th>
                <th>R (Count/Amo)</th><th>(Min)</th>
                <th>YTS (Count/Amo)</th><th>(Min)</th>
                <th>YT (Count/Amo)</th><th>(Min)</th>
                <th>C (Count/Amo)</th><th>(Min)</th>
                <th>ED (Count/Amo)</th>
                <th>blog(count/amo)</th><th>(min)</th>
                <th>Assign To</th>
              </tr>
            )}
          </thead>
          <tbody>
            {tableRows.length === 0 ? (
              <tr><td colSpan="10" style={{textAlign: 'center', padding: '20px'}}>No Pending Client Requests</td></tr>
            ) : (
              tableRows.map((row, idx) => (
                <TableRow 
                  key={row._id || idx} 
                  row={row} 
                  viewMode={viewMode}
                  onSend={handleSendToTeam} 
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Updated TableRow component
const TableRow = ({ row, viewMode, onSend }) => {
  const [selectedTeam, setSelectedTeam] = useState("");

  const getCount = (item) => item?.count || 0;
  const getAmount = (item) => item?.amo || item?.amount || 0;
  const getMinutes = (item) => item?.min || 0;

  return (
    <tr>
      <td>{row.clientName}</td>
      <td>{row.industry}</td>
      <td>{row.deliveryDate}</td>
      <td>{row.phone}</td>
      <td>{row.email}</td>

      {viewMode === 'WEB' && (
        <>
          <td>{getCount(row.Web)}</td>
          <td>₹{getAmount(row.Web)}</td>
          <td>{getMinutes(row.Web)}</td>
          <td style={{maxWidth: '150px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {row.Web?.description || '-'}
          </td>
        </>
      )}

      {viewMode === 'SEO' && (
        <>
          <td>{getCount(row.SEO)}</td>
          <td>₹{getAmount(row.SEO)}</td>
          <td>{getMinutes(row.SEO)}</td>
          <td style={{maxWidth: '150px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {row.SEO?.description || '-'}
          </td>
        </>
      )}

      {viewMode === 'CAMPAIGN' && (
        <>
          <td>{getCount(row.Campaign)}</td>
          <td>₹{getAmount(row.Campaign)}</td>
          <td>{getMinutes(row.Campaign)}</td>
          <td style={{maxWidth: '150px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {row.Campaign?.description || '-'}
          </td>
        </>
      )}

      {viewMode === 'CALLS' && (
        <>
          <td>{getCount(row.Calls)}</td>
          <td>{getMinutes(row.Calls)}</td> 
          <td style={{maxWidth: '150px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {row.Calls?.description || '-'}
          </td>
        </>
      )}

      {viewMode === 'STANDARD' && (
        <>
          <td>{getCount(row.Posters)}/{getAmount(row.Posters)}</td>
          <td>{getMinutes(row.Posters)}</td>
          
          <td>{getCount(row.Reels)}/{getAmount(row.Reels)}</td>
          <td>{getMinutes(row.Reels)}</td>
          
          <td>{getCount(row.Shorts)}/{getAmount(row.Shorts)}</td>
          <td>{getMinutes(row.Shorts)}</td>
          
          <td>{getCount(row.Longform)}/{getAmount(row.Longform)}</td>
          <td>{getMinutes(row.Longform)}</td>
          
          <td>{getCount(row.Carousel)}/{getAmount(row.Carousel)}</td>
          <td>{getMinutes(row.Carousel)}</td>
          
          <td>{getCount(row.EventDay)}/{getAmount(row.EventDay)}</td>
          
          <td>{getCount(row.Blog)}/{getAmount(row.Blog)}</td>
          <td>{getMinutes(row.Blog)}</td>
        </>
      )}

      <td style={{ minWidth: '180px' }}>
        <select 
          value={selectedTeam} 
          onChange={(e) => setSelectedTeam(e.target.value)}
          style={{ marginBottom: '5px', width: '100%', padding: '5px' }}
        >
          <option value="">Select Team</option>
          <option value="Website">Website Team</option>
          <option value="Branding">Branding Team</option>
          <option value="SEO">SEO Team</option>
          <option value="Campaign">Campaign Team</option>
          <option value="Telecaller">Telecaller Team</option>
        </select>
        <button 
          onClick={() => onSend(row, selectedTeam)}
          style={{ 
            padding: '6px 12px', 
            fontSize: '12px', 
            width: '100%', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Send
        </button>
      </td>
    </tr>
  );
};

export default Dashboard;