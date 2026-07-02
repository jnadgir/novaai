// src/pages/Home.jsx
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-page">
      <div className="stars"></div>

      <div className="hero">
        <h1 className="hero-title">
          Nova<span className="accent-text">AI</span>
        </h1>
        <p className="hero-subtitle">
          Your AI-powered coding companion from across the galaxy
        </p>
        <div className="hero-actions">
          <Link to="/signup" className="btn btn-primary">Get Started</Link>
          <Link to="/login" className="btn btn-outline">Login</Link>
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <h3>💬 AI Chat</h3>
          <p>Ask questions, get instant, context-aware answers.</p>
        </div>
        <div className="feature-card">
          <h3>⚡ Code Generation</h3>
          <p>Describe what you need, get working code instantly.</p>
        </div>
        <div className="feature-card">
          <h3>🐛 Bug Fixing</h3>
          <p>Paste broken code, get it diagnosed and fixed.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;