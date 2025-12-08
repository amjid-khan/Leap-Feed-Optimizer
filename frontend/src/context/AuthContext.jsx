import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
const API = import.meta.env.VITE_API_BASE_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // -------------------------------
  // HELPER FUNCTIONS
  // -------------------------------
  const persistUser = (userData) => {
    if (userData) {
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      setUser(null);
      localStorage.removeItem("user");
    }
  };

  const clearSession = () => {
    persistUser(null);
    setAccounts([]);
    setSelectedAccount(null);
    localStorage.removeItem("token");
  };

  const updateUserSelectedAccount = (accountId) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, selectedAccount: accountId || null };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  // -------------------------------
  // ACCOUNT SYNC
  // -------------------------------
  const syncAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API}/api/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.data.success) return;

      const list = res.data.accounts;
      setAccounts(list);

      if (list.length === 0) {
        setSelectedAccount(null);
        updateUserSelectedAccount(null);
        return;
      }

      const saved = user?.selectedAccount;
      const match = list.find((a) => a._id === saved);

      if (match) {
        setSelectedAccount(match);
      } else {
        const first = list[0];
        await switchAccount(first._id);
      }
    } catch (e) {
      console.log("Account sync failed:", e);
    }
  };

  // -------------------------------
  // ACCOUNT SWITCH
  // -------------------------------
  const switchAccount = async (accountId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token");

      const res = await axios.post(
        `${API}/api/accounts/${accountId}/switch`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const selected = accounts.find((a) => a._id === accountId);
        setSelectedAccount(selected);
        updateUserSelectedAccount(accountId);
      }

      return res.data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // -------------------------------
  // AUTH VERIFY ON MOUNT
  // -------------------------------
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        clearSession();
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          persistUser(res.data.user);
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  // -------------------------------
  // Load accounts after user is loaded
  // -------------------------------
  useEffect(() => {
    if (user && !loading) {
      syncAccounts();
    }
  }, [user, loading]);

  // -------------------------------
  // AUTH FUNCTIONS
  // -------------------------------
  const register = async (name, email, password) => {
    try {
      const res = await axios.post(`${API}/api/auth/register`, {
        name,
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      persistUser(res.data.user);
      await syncAccounts();
      return { success: true, user: res.data.user };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || "Registration failed" 
      };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API}/api/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      persistUser(res.data.user);
      await syncAccounts();

      return { 
        success: true, 
        user: res.data.user,
        message: "Login successful" 
      };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || "Login failed" 
      };
    }
  };

  const loginWithToken = async (token) => {
    localStorage.setItem("token", token);

    try {
      const res = await axios.get(`${API}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        persistUser(res.data.user);
        await syncAccounts();
        return { success: true, user: res.data.user };
      } else {
        clearSession();
        return { success: false, message: "Invalid token" };
      }
    } catch (error) {
      clearSession();
      return { success: false, message: "Token verification failed" };
    }
  };

  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    return !!token && !!user;
  };

  const logout = () => {
    clearSession();
  };

  // -------------------------------
  // RETURN CONTEXT
  // -------------------------------
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accounts,
        selectedAccount,
        register,
        login,
        loginWithToken,
        logout,
        switchAccount,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
