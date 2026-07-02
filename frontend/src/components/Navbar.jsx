import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { loggedIn, logout, user } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        Nova<span className="accent-text">AI</span>
      </Link>

      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        {/* {loggedIn && (
          <>
            <Link to="/assistant" className="nav-link">Assistant</Link>
            <Link to="/history" className="nav-link">History</Link>
          </>
        )} */}
      </div>

      <div className="navbar-actions">
        {loggedIn ? (
          <div className="profile-menu">
            <div
              className="profile-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="profile-avatar">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="profile-name">Hi, {user?.name}! 👋</span>
            </div>

            {dropdownOpen && (
              <div className="profile-dropdown">
                <Link
                  to="/profile"
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  👤 My Profile
                </Link>
                <Link
                  to="/assistant"
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  🤖 Assistant
                </Link>
                <Link
                  to="/history"
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  📜 History
                </Link>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">Login</Link>
            <Link to="/signup" className="btn btn-primary">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;