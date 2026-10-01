import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { hashPassword } from '../services/crypto';
import { INITIAL_USERS } from '../services/demoData';

interface AuthContextType {
  currentUser: User | null; // Currently logged in user (or impersonated target)
  realUser: User | null; // Actual authenticated user
  effectiveRole: Role;
  viewAsRole: Role | null;
  viewAsUserId: string | null;
  setViewAs: (role: Role | null, userId?: string | null) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => Promise<boolean>;
  updateUser: (id: string, updates: Partial<User>) => Promise<boolean>;
  resetUserPassword: (id: string, newPassword: string) => Promise<boolean>;
  loadDemoUsers: () => void;
  isFirstRun: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'gva_crm_users';
const SESSION_STORAGE_KEY = 'gva_crm_session';
const VIEW_AS_KEY = 'gva_crm_view_as';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_USERS;
  });

  const [realUser, setRealUser] = useState<User | null>(() => {
    try {
      const session = localStorage.getItem(SESSION_STORAGE_KEY);
      if (session) {
        return JSON.parse(session);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [viewAsRole, setViewAsRoleState] = useState<Role | null>(() => {
    try {
      const viewAs = localStorage.getItem(VIEW_AS_KEY);
      if (viewAs) {
        const parsed = JSON.parse(viewAs);
        return parsed.role || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [viewAsUserId, setViewAsUserIdState] = useState<string | null>(() => {
    try {
      const viewAs = localStorage.getItem(VIEW_AS_KEY);
      if (viewAs) {
        const parsed = JSON.parse(viewAs);
        return parsed.userId || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  // Sync session
  useEffect(() => {
    if (realUser) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(realUser));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(VIEW_AS_KEY);
    }
  }, [realUser]);

  // Compute effective user
  let effectiveUser = realUser;
  let effectiveRole: Role = realUser ? realUser.role : 'telecaller';

  if (realUser && realUser.role === 'admin' && viewAsRole) {
    effectiveRole = viewAsRole;
    if (viewAsUserId) {
      const targetUser = users.find((u) => u.id === viewAsUserId);
      if (targetUser) {
        effectiveUser = targetUser;
      }
    } else {
      // Pick first user matching that role or create a surrogate
      const match = users.find((u) => u.role === viewAsRole && u.active);
      if (match) {
        effectiveUser = match;
      }
    }
  }

  const setViewAs = (role: Role | null, userId?: string | null) => {
    if (!realUser || realUser.role !== 'admin') return;
    setViewAsRoleState(role);
    setViewAsUserIdState(userId || null);
    if (role) {
      localStorage.setItem(VIEW_AS_KEY, JSON.stringify({ role, userId: userId || null }));
    } else {
      localStorage.removeItem(VIEW_AS_KEY);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanUsername = username.trim().toLowerCase();
    const hash = await hashPassword(password);

    // Look for user
    const found = users.find((u) => u.username.toLowerCase() === cleanUsername);

    if (!found) {
      return { success: false, message: 'Invalid username or password' };
    }

    if (!found.active) {
      return { success: false, message: 'This account has been deactivated. Please contact the administrator.' };
    }

    if (found.passwordHash !== hash) {
      return { success: false, message: 'Invalid username or password' };
    }

    setRealUser(found);
    setViewAsRoleState(null);
    setViewAsUserIdState(null);
    return { success: true };
  };

  const logout = () => {
    setRealUser(null);
    setViewAsRoleState(null);
    setViewAsUserIdState(null);
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; message?: string }> => {
    if (!realUser) return { success: false, message: 'Not logged in' };
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    const newHash = await hashPassword(newPassword);
    const updatedUsers = users.map((u) => {
      if (u.id === realUser.id) {
        return { ...u, passwordHash: newHash, mustChangePassword: false };
      }
      return u;
    });

    setUsers(updatedUsers);
    setRealUser((prev) => (prev ? { ...prev, passwordHash: newHash, mustChangePassword: false } : null));
    return { success: true, message: 'Password updated successfully!' };
  };

  const addUser = async (newUser: Omit<User, 'id'>): Promise<boolean> => {
    const exists = users.some((u) => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (exists) return false;

    const userObj: User = {
      ...newUser,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    setUsers((prev) => [...prev, userObj]);
    return true;
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<boolean> => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return { ...u, ...updates };
        }
        return u;
      })
    );
    if (realUser && realUser.id === id) {
      setRealUser((prev) => (prev ? { ...prev, ...updates } : null));
    }
    return true;
  };

  const resetUserPassword = async (id: string, newPassword: string): Promise<boolean> => {
    const hash = await hashPassword(newPassword);
    return updateUser(id, { passwordHash: hash, mustChangePassword: false });
  };

  const loadDemoUsers = () => {
    setUsers(INITIAL_USERS);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser: effectiveUser,
        realUser,
        effectiveRole,
        viewAsRole,
        viewAsUserId,
        setViewAs,
        login,
        logout,
        changePassword,
        users,
        addUser,
        updateUser,
        resetUserPassword,
        loadDemoUsers,
        isFirstRun: users.length === 0,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
