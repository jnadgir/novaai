import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Signup.css';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignup = () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields!');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    signup({ name, email, password });
    navigate('/assistant');
  };

  return (
    <div className="auth-container">
      <div className="stars"></div>
      <div className="auth-card">
        <div className="auth-logo">Nova<span>AI</span></div>
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join NovaAI and supercharge your coding! 🚀</p>

        {error && <div className="error-message">⚠️ {error}</div>}

        <input type="text" placeholder="Full Name" className="auth-input"
          value={name} onChange={(e) => setName(e.target.value)} />

        <input type="email" placeholder="Email Address" className="auth-input"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        <input type="password" placeholder="Password" className="auth-input"
          value={password} onChange={(e) => setPassword(e.target.value)} />

        <input type="password" placeholder="Confirm Password" className="auth-input"
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

        <button className="auth-btn" onClick={handleSignup}>Create Account ✨</button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;