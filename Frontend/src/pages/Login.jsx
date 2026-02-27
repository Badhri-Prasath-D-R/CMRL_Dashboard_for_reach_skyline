import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Send JSON payload – email and password
      const response = await api.post('/auth/login', { email, password });

      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', email); // This satisfies the protected route check

      navigate('/dashboard');
    } catch (err) {
      console.error("Login Error:", err.response?.data);

      // Extract error message safely (could be a string or an array)
      const errorDetail = err.response?.data?.detail;
      if (Array.isArray(errorDetail)) {
        // If it's an array of validation errors, join them
        setError(errorDetail.map(e => e.msg).join(', '));
      } else {
        setError(errorDetail || 'Invalid email or password');
      }
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '100px', textAlign: 'center' }}>
      <h1 style={{ color: '#007bff' }}>Reach Skyline CRM</h1>
      <h3 style={{ marginBottom: '20px', color: '#666' }}>Sign In</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin} className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" 
          placeholder="Email Address" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        <button type="submit" style={{ marginTop: '10px' }}>Login</button>
      </form>
    </div>
  );
};

export default Login;