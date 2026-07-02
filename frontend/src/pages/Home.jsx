// src/pages/Home.jsx
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-page">
      <div className="stars"></div>

      <div className="hero">
        <h1 className="hero-title">
          Meet <span className="accent-text">NovaAI</span>
        </h1>
        <p className="hero-subtitle">
          Your Intelligent Code Assistant — powered by AI. Generate, explain, and fix code in seconds! 🚀
        </p>
        <div className="hero-actions">
          <Link to="/signup" className="btn btn-primary">Get Started Free ✨</Link>
          <Link to="/assistant" className="btn btn-outline">Try NovaAI 🌌</Link>
        </div>
      </div>

      <h2 className="section-title">
        What can <span className="accent-text">NovaAI</span> do?
      </h2>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">💻</div>
          <h3>Code Generation</h3>
          <p>Describe what you want and Nova writes the code for you instantly!</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3>Code Explanation</h3>
          <p>Paste any code and Nova explains it line by line in simple terms!</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🐛</div>
          <h3>Bug Fixing</h3>
          <p>Share your buggy code and Nova finds and fixes the issue instantly!</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🌌</div>
          <h3>AI Powered</h3>
          <p>Powered by Claude AI — one of the most advanced AI models available!</p>
        </div>
      </div>
    </div>
  );
}

export default Home;