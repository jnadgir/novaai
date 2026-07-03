// ── User Auth ──────────────────────────────────────

export const saveUser = (userData) => {
  localStorage.setItem('novaai_user', JSON.stringify(userData));
};

export const getUser = () => {
  const user = localStorage.getItem('novaai_user');
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  localStorage.removeItem('novaai_user');
};

export const isLoggedIn = () => {
  return getUser() !== null;
};


export const startSession = (userData) => {
  localStorage.setItem('novaai_session', JSON.stringify(userData));
};

export const getSession = () => {
  const session = localStorage.getItem('novaai_session');
  return session ? JSON.parse(session) : null;
};

export const endSession = () => {
  localStorage.removeItem('novaai_session');
};

export const deleteAccount = () => {
  localStorage.removeItem('novaai_user');
  localStorage.removeItem('novaai_session');
  localStorage.removeItem('novaai_history');
};



// ── Chat History ───────────────────────────────────

export const saveHistory = (messages) => {
  if (messages.length < 2) return;

  const sessions = getAllHistory();
  const firstUserMsg = messages.find(m => m.role === 'user');

  const currentId = localStorage.getItem('novaai_current_session');
  let sessionId = currentId;

  if (!sessionId) {
    sessionId = Date.now().toString();
    localStorage.setItem('novaai_current_session', sessionId);
  }

  const existingIndex = sessions.findIndex(s => s.id === sessionId);
  const sessionData = {
    id: sessionId,
    title: firstUserMsg?.content?.slice(0, 60) || 'New Chat',
    messages,
    updatedAt: Date.now()
  };

  if (existingIndex >= 0) {
    sessions[existingIndex] = sessionData;
  } else {
    sessions.push(sessionData);
  }

  localStorage.setItem('novaai_history', JSON.stringify(sessions));
};

export const getAllHistory = () => {
  const history = localStorage.getItem('novaai_history');
  return history ? JSON.parse(history) : [];
};

export const getHistory = () => {
  const sessions = getAllHistory();
  const currentId = localStorage.getItem('novaai_current_session');
  const current = sessions.find(s => s.id === currentId);
  return current ? current.messages : [];
};

export const startNewSession = () => {
  localStorage.removeItem('novaai_current_session');
};

export const clearHistory = () => {
  localStorage.removeItem('novaai_history');
  localStorage.removeItem('novaai_current_session');
};