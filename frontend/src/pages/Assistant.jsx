import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHistory, saveHistory } from '../utils/storage';
import { marked } from 'marked';
import './Assistant.css';

function Assistant() {
  const { loggedIn, user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey ${user?.name || 'there'}! 👋 I'm Nova, your AI code assistant! Ask me anything — generate code, explain concepts, or fix bugs! 🚀`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // useEffect(() => {
  //   if (!loggedIn) navigate('/login');
  // }, [loggedIn]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
  if (!input.trim()) return;
  if (!user?.apiKey) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '⚠️ Please add your Claude API key in your **Profile** before chatting!'
    }]);
    return;
  } 

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': user?.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: 'You are Nova, an expert AI code assistant. Help users generate code, explain concepts, debug issues, and answer programming questions. Format code with markdown code blocks.',
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();
      const aiMessage = {
        role: 'assistant',
        content: data.content[0].text
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      saveHistory(finalMessages);

    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Something went wrong! Please check your API key in Profile.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="assistant-container">
      <div className="stars"></div>

      {!user?.apiKey && (
        <div className="api-key-warning">
            ⚠️ You haven't added your Claude API key yet.{' '}
            <Link to="/profile">Add it in your Profile</Link> to start chatting with Nova!
        </div>
        )}

      <div className="chat-window">
        <div className="chat-header">
          <h2>Nova<span>AI</span> Assistant</h2>
          <p>Your intelligent code companion 🌌</p>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
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

          {loading && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            className="chat-input"
            placeholder="Ask Nova anything... (Enter to send, Shift+Enter for new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={loading}
          >
            {loading ? '⏳' : '🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Assistant;