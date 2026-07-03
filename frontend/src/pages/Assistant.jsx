import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHistory, saveHistory, startNewSession } from '../utils/storage';
import { marked } from 'marked';
import './Assistant.css';

// ---------- JS console sandbox (algorithmic code, no DOM) ----------
// Runs plain JS in a locked-down iframe — no network call, no rate limits.
// sandbox="allow-scripts" only (no allow-same-origin) means the iframe cannot
// reach your app's DOM, cookies, or localStorage.
function runJSInSandbox(code) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox = 'allow-scripts';
    document.body.appendChild(iframe);

    const requestId = Math.random().toString(36).slice(2);
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    };

    const handleMessage = (event) => {
      if (event.data?.requestId !== requestId) return;
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ status: event.data.status, output: event.data.output });
    };
    window.addEventListener('message', handleMessage);

    const safeCode = code.replace(/<\/script>/gi, '<\\/script>');

    const sandboxHtml = `
      <script>
        (function () {
          const logs = [];
          let sent = false;
          const fmt = (args) => args.map(a => {
            if (typeof a === 'object') { try { return JSON.stringify(a); } catch (e) { return String(a); } }
            return String(a);
          }).join(' ');
          console.log = (...args) => logs.push(fmt(args));
          console.error = (...args) => logs.push(fmt(args));
          console.warn = (...args) => logs.push(fmt(args));

          const send = (status, output) => {
            if (sent) return; // avoid double-send if onerror also fires
            sent = true;
            parent.postMessage({ requestId: '${requestId}', status, output }, '*');
          };

          // Catches parse/syntax errors (e.g. stray JSX) that happen before
          // the try/catch below ever runs, so we don't hang until the timeout.
          window.onerror = function (message) {
            send('Error', 'Syntax/parse error: ' + message +
              '\\n\\n(This usually means the code isn\\'t plain JS — e.g. it contains JSX. Check the code fence language tag.)');
            return true;
          };

          try {
            ${safeCode}
            send('Success', logs.join('\\n') || 'No output (code ran but printed nothing — try adding a console.log)');
          } catch (err) {
            logs.push(String(err && err.message ? err.message : err));
            send('Error', logs.join('\\n'));
          }
        })();
      <\/script>
    `;
    iframe.srcdoc = sandboxHtml;

    setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ status: 'Error', output: 'Execution timed out (possible infinite loop)' });
    }, 5000);
  });
}

// ---------- Visual preview builder (HTML / CSS / JSX / React) ----------
const REACT_CDN = `
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"><\/script>
`;

function buildHtmlPreview(code) {
  if (/<html[\s>]/i.test(code)) return code;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body>${code}</body></html>`;
}

function buildCssPreview(code) {
  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>${code}</style>
      </head>
      <body>
        <p style="font-family:sans-serif;color:#888;font-size:12px;margin-bottom:12px;">
          Preview uses placeholder elements below — ask Nova for matching HTML to see the full page styled.
        </p>
        <h1>Heading</h1>
        <p>Paragraph text goes here.</p>
        <button>Button</button>
        <div class="box" style="width:100px;height:100px;background:#ccc;margin-top:8px;">div.box</div>
      </body>
    </html>`;
}

function buildReactPreview(code) {
  const safeCode = code.replace(/<\/script>/gi, '<\\/script>');
  const alreadyRenders = /ReactDOM\.(createRoot|render)/.test(code);

  const autoRender = alreadyRenders ? '' : `
    (function () {
      try {
        const Candidate = (typeof App !== 'undefined' && App)
          || (typeof Main !== 'undefined' && Main)
          || (typeof default_1 !== 'undefined' && default_1);
        if (Candidate) {
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement(Candidate));
        } else {
          document.getElementById('root').innerText =
            'No component named "App" found to auto-render. Ask Nova to include ReactDOM.createRoot(...).render(<App />) explicitly.';
        }
      } catch (e) {
        document.getElementById('root').innerText = 'Render error: ' + e.message;
      }
    })();
  `;

  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>body{font-family:sans-serif;margin:16px;}</style>
        ${REACT_CDN}
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel" data-presets="react">
          ${safeCode}
          ${autoRender}
        <\/script>
      </body>
    </html>`;
}

function buildPreviewDoc(code, lang) {
  if (lang === 'css') return buildCssPreview(code);
  if (lang === 'jsx' || lang === 'react') return buildReactPreview(code);
  return buildHtmlPreview(code); // html and anything else visual
}

function Assistant() {
  const { loggedIn, user } = useAuth();
  const navigate = useNavigate();
  const apiKey = user?.apiKey || JSON.parse(localStorage.getItem('novaai_session'))?.apiKey || '';

  const [messages, setMessages] = useState(() => {
    const saved = getHistory();
    return saved.length > 0
      ? saved
      : [{
          role: 'assistant',
          content: `Hey ${user?.name || 'there'}! 👋 I'm Nova, your AI code assistant! Ask me anything — generate code, explain concepts, or fix bugs! 🚀`
        }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewPanel, setPreviewPanel] = useState(null); // { html, language, messageIndex } | null
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const extractCode = (content) => {
    const match = content.match(/```(\w+)?\n([\s\S]*?)```/);
    if (!match) return null;

    let language = match[1];
    const code = match[2];

    if (!language) {
      // No language tag on the fence — sniff the code instead of assuming
      // javascript, since JSX/HTML routed into the plain JS sandbox causes
      // silent parse failures (JSX in a <script> tag is a syntax error).
      if (/<!DOCTYPE html>|<html[\s>]/i.test(code)) {
        language = 'html';
      } else if (/<[A-Z]\w*[\s/>]|<\/[A-Z]/.test(code) || (/\breturn\s*\(/.test(code) && /<[a-z]/i.test(code))) {
        language = 'jsx';
      } else {
        language = 'javascript';
      }
    }

    return { language, code };
  };

  const startNewChat = () => {
  startNewSession();
  setPreviewPanel(null);
  setMessages([{
    role: 'assistant',
    content: `Hey ${user?.name || 'there'}! 👋 I'm Nova, your AI code assistant! Ask me anything — generate code, explain concepts, or fix bugs! 🚀`
  }]);
};

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (!apiKey) {
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
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          instructions: user?.instructions || '',
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();
      const aiMessage = { role: 'assistant', content: data.content[0].text };

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

  // Only things that genuinely can't run standalone (need a build step / parent shell)
  const NON_RUNNABLE = ['typescript', 'ts', 'angular', 'tsx'];
  const JS_LANGS = ['javascript', 'js'];
  const VISUAL_LANGS = ['html', 'css', 'jsx', 'react'];

  const runCode = async (code, language, messageIndex) => {
    const lang = language.toLowerCase();

    if (NON_RUNNABLE.includes(lang)) {
      setMessages(prev => prev.map((m, i) =>
        i === messageIndex
          ? { ...m, output: "This code needs a full build step (TypeScript/Angular) and can't run in a plain sandbox.", hasError: false }
          : m
      ));
      return;
    }

    if (VISUAL_LANGS.includes(lang)) {
      const previewHtml = buildPreviewDoc(code, lang);
      setPreviewPanel({ html: previewHtml, language: lang, messageIndex });
      setMessages(prev => prev.map((m, i) =>
        i === messageIndex ? { ...m, hasPreview: true, output: null, hasError: false } : m
      ));
      return;
    }

    setMessages(prev => prev.map((m, i) => i === messageIndex ? { ...m, running: true } : m));

    try {
      let output, hasError;

      if (JS_LANGS.includes(lang)) {
        const result = await runJSInSandbox(code);
        output = result.output;
        hasError = result.status === 'Error';
      } else {
        const res = await fetch('/api/assistant/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language })
        });
        const result = await res.json();
        output = result.stderr || result.compile_output || result.stdout || 'No output';
        hasError = !!(result.stderr || result.compile_output);
      }

      setMessages(prev => prev.map((m, i) =>
        i === messageIndex ? { ...m, running: false, output, hasError } : m
      ));

      if (hasError) {
        const fixRequest = {
          role: 'user',
          content: `This code produced an error:\n\`\`\`\n${output}\n\`\`\`\nPlease fix it.`
        };
        const updated = [...messages, fixRequest];
        setLoading(true);

        const fixRes = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
            instructions: user?.instructions || '',
            messages: updated.map(m => ({ role: m.role, content: m.content }))
          })
        });
        const fixData = await fixRes.json();
        const fixMessage = { role: 'assistant', content: fixData.content[0].text };
        const finalMessages = [...updated, fixMessage];
        setMessages(finalMessages);
        saveHistory(finalMessages);
        setLoading(false);
      }
    } catch (error) {
      setMessages(prev => prev.map((m, i) =>
        i === messageIndex ? { ...m, running: false, output: 'Execution failed', hasError: true } : m
      ));
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

      {!apiKey && (
        <div className="api-key-warning">
          ⚠️ You haven't added your Claude API key yet.{' '}
          <Link to="/profile">Add it in your Profile</Link> to start chatting with Nova!
        </div>
      )}

         <button className="new-chat-btn-floating" onClick={startNewChat}>
      + New Chat
    </button>


      <div className={`assistant-split ${previewPanel ? 'has-preview' : ''}`}>
        <div className="chat-window">
          <div className="chat-header">
            <h2>Nova<span>AI</span> Assistant</h2>
            <p>Your intelligent code companion 🌌</p>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => {
              const codeBlock = msg.role === 'assistant' ? extractCode(msg.content) : null;
              const isActivePreview = previewPanel?.messageIndex === index;
              return (
                <div key={index} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'assistant' ? '🤖' : '👤'}
                  </div>
                  <div className="message-content-wrapper">
                    <div
                      className="message-content"
                      dangerouslySetInnerHTML={{ __html: marked(msg.content) }}
                    />
                    {codeBlock && (
                      <button
                        className="run-code-btn"
                        onClick={() => runCode(codeBlock.code, codeBlock.language, index)}
                        disabled={msg.running}
                      >
                        {msg.running ? '⏳ Running...' : isActivePreview ? '🔄 Refresh Preview' : '▶️ Run Code'}
                      </button>
                    )}
                    {msg.hasPreview && (
                      <div
                        className={`preview-indicator ${isActivePreview ? 'active' : ''}`}
                        onClick={() => codeBlock && setPreviewPanel({
                          html: buildPreviewDoc(codeBlock.code, codeBlock.language),
                          language: codeBlock.language,
                          messageIndex: index
                        })}
                      >
                        {isActivePreview ? '👉 Showing in preview panel' : '↗️ Reopen in preview panel'}
                      </div>
                    )}
                    {msg.output && (
                      <pre className={`code-output ${msg.hasError ? 'error' : ''}`}>
                        {msg.output}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })}

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

        {previewPanel && (
          <div className="preview-panel">
            <div className="preview-panel-header">
              <span>Live Preview <span className="preview-lang-tag">{previewPanel.language}</span></span>
              <button className="preview-close-btn" onClick={() => setPreviewPanel(null)}>✕</button>
            </div>
            <iframe
              title="live-preview"
              sandbox="allow-scripts"
              srcDoc={previewPanel.html}
              className="preview-iframe"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Assistant;