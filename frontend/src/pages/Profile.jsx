import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

function Profile() {
  const { user, updateUser, deleteMyAccount } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [instructions, setInstructions] = useState(user?.instructions || '');
  const [apiKey, setApiKey] = useState(user?.apiKey || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveProfile = () => {
    updateUser({ name, instructions, apiKey });
    setMessage('✅ Profile updated!');
    setError('');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleChangePassword = () => {
    setError('');
    setMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    if (currentPassword !== user?.password) {
      setError('Current password is incorrect.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    updateUser({ password: newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('✅ Password changed!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteAccount = () => {
    deleteMyAccount();
    navigate('/');
  };

  return (
    <div className="profile-page">
      <div className="stars"></div>

      <div className="profile-container">
        <h1>My Profile</h1>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">⚠️ {error}</div>}

        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h2>{user?.name}</h2>
              <p className="profile-email">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <h3>Account Details</h3>

          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            className="auth-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="auth-input"
            value={user?.email || ''}
            disabled
          />

          <label htmlFor="instructions">Custom Instructions for Nova</label>
          <textarea
            id="instructions"
            name="instructions"
            className="auth-input"
            placeholder="e.g. Always explain code in detail, prefer React, keep answers concise..."
            rows={4}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />

          <label htmlFor="apiKey">Claude API Key</label>
          <input
            id="apiKey"
            name="apiKey"
            type="password"
            className="auth-input"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
          />

          <button className="auth-btn" onClick={handleSaveProfile}>
            Save Changes
          </button>
        </div>

        <div className="profile-card">
          <h3>Change Password</h3>

          <label htmlFor="currentPassword">Current Password</label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            className="auth-input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />

          <label htmlFor="newPassword">New Password</label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            className="auth-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />

          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="auth-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          <button className="auth-btn" onClick={handleChangePassword}>
            Change Password
          </button>
        </div>

        <div className="profile-card danger-zone">
          <h3>Danger Zone</h3>
          <p>Deleting your account permanently removes your profile and chat history. This cannot be undone.</p>

          {!showDeleteConfirm ? (
            <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
              Delete Account
            </button>
          ) : (
            <div className="delete-confirm">
              <p>Are you absolutely sure?</p>
              <button className="btn-danger" onClick={handleDeleteAccount}>
                Yes, Delete Forever
              </button>
              <button className="btn-outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;