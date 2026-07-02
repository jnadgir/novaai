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

export const saveHistory = (history) => {
  localStorage.setItem('novaai_history', JSON.stringify(history));
};

export const getHistory = () => {
  const history = localStorage.getItem('novaai_history');
  return history ? JSON.parse(history) : [];
};

export const clearHistory = () => {
  localStorage.removeItem('novaai_history');
};