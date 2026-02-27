import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

// NOTE: Replace with your actual logo path or URL
const logo = "https://placehold.co/45x45/007bff/ffffff?text=Logo";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();

  // Close dropdown when route changes
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location]);

  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="logo">
          <img src={logo} alt="Reach Skyline Logo" style={{ borderRadius: '4px', height: '40px', width: 'auto' }} />
          <h2>Reach Skyline</h2>
        </div>

        <nav>
          <ul className="nav-links">
            <li><Link to="/dashboard">Client Request</Link></li>
            
            {/* NEW LINK ADDED HERE */}
            <li><Link to="/efficiency">Efficiency Report</Link></li>

            {/* Dropdown Section */}
            <li 
              className="dropdown" 
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <span className="dropbtn">Team Page ▾</span>
              
              <ul className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                <li><Link to="/branding-team">Branding & Creatives Team</Link></li>
                <li><Link to="/website-team">Website Team</Link></li>
                <li><Link to="/seo-team">SEO Team</Link></li>
                <li><Link to="/campaign-team">Campaign Team</Link></li>
                <li><Link to="/telecaller-team">TELECALLER TEAM</Link></li>
              </ul>
            </li>

            <li><Link to="/team-members">Team Members</Link></li>
            <li><Link to="/client-page">Client Page</Link></li>
            
            {/* Logout Button Logic */}
            <li>
              <Link 
                to="/login" 
                className="login-link"
                onClick={() => {
                  localStorage.removeItem("user"); // Clear login on click
                }}
              >
                Logout
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;