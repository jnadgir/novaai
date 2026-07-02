import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Signup.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please fill in all fields!');
      return;
    }

    const savedUser = JSON.parse(localStorage.getItem('novaai_user'));

    if (!savedUser) {
      setError('No account found! Please sign up first.');
      return;
    }

    if (savedUser.email === email && savedUser.password === password) {
      login(savedUser);
      navigate('/assistant');
    } else {
      setError('Invalid email or password!');
    }
  };

  return (
    <div className="auth-container">
      <div className="stars"></div>
      <div className="auth-card">
        <div className="auth-logo">Nova<span>AI</span></div>
        <h2>Welcome Back!</h2>
        <p className="auth-subtitle">Login to continue your coding journey! 🌌</p>

        {error && <div className="error-message">⚠️ {error}</div>}

        <input type="email" placeholder="Email Address" className="auth-input"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        <input type="password" placeholder="Password" className="auth-input"
          value={password} onChange={(e) => setPassword(e.target.value)} />

        <button className="auth-btn" onClick={handleLogin}>Login to NovaAI 🚀</button>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;