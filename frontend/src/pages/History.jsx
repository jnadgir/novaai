import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllHistory, clearHistory } from '../utils/storage';
import { marked } from 'marked';
import './History.css';

function History() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const all = getAllHistory().sort((a, b) => b.updatedAt - a.updatedAt);
    setSessions(all);
  }, []);

  const handleClear = () => {
    clearHistory();
    setSessions([]);
    setActiveId(null);
  };

  const activeSession = sessions.find(s => s.id === activeId);

  return (
    <div className="history-page">
      <div className="stars"></div>

      <div className="history-container">
        <div className="history-header">
          <h1>Chat History</h1>
          {sessions.length > 0 && (
            <button className="btn-danger" onClick={handleClear}>
              Clear History
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="history-empty">
            <p>No conversations yet.</p>
            <Link to="/assistant" className="btn btn-primary">Start Chatting</Link>
          </div>
        ) : !activeId ? (
          <div className="history-list">
            {sessions.map(s => (
              <button
                key={s.id}
                className="history-item"
                onClick={() => setActiveId(s.id)}
              >
                <span className="history-item-icon">💬</span>
                <span className="history-item-title">{s.title}</span>
                <span className="history-item-arrow">›</span>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <button className="back-btn" onClick={() => setActiveId(null)}>
              ← Back to all chats
            </button>
            <div className="history-messages">
              {activeSession.messages?.map((msg, index) => (
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
          </div>
        )}
      </div>
    </div>
  );
}

export default History;