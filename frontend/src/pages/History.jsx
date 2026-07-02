import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHistory, clearHistory } from '../utils/storage';
import { marked } from 'marked';
import './History.css';

function History() {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

//   useEffect(() => {
//     if (!loggedIn) navigate('/login');
//   }, [loggedIn]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="history-page">
      <div className="stars"></div>

      <div className="history-container">
        <div className="history-header">
          <h1>Chat History</h1>
          {history.length > 0 && (
            <button className="btn-danger" onClick={handleClear}>
              Clear History
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="history-empty">
            <p>No conversations yet.</p>
            <Link to="/assistant" className="btn btn-primary">
              Start Chatting
            </Link>
          </div>
        ) : (
          <div className="history-messages">
            {history.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'assistant' ? '🤖' : '👤'}
                </div>
                <div
                  className="message-content"
                  dangerouslySetInnerHTML={{ __html: marked(msg.content) }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;