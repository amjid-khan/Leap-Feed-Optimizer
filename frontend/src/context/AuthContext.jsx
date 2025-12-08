import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
const API = import.meta.env.VITE_API_BASE_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

<<<<<<< HEAD
  // Persist user in state + localStorage
=======
  // -------------------------------
  // HELPER FUNCTIONS
  // -------------------------------

>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe
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

<<<<<<< HEAD
  // Fetch accounts from backend
  const syncAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return { success: false };

      const res = await axios.get(`${API}/api/auth/merchant-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const accountsList = res.data?.accounts || [];

      const normalized = accountsList.map((a) => ({
        _id: a._id || a.id || `${a.id}`,
        accountName: a.name || a.accountName || "Unnamed Account",
        merchantId: a.id || a.merchantId || a._id || null,
        websiteUrl: a.websiteUrl || "",
        email: a.email || "",
        businessType: a.businessType || "",
        status: a.status || "",
        raw: a,
      }));

      setAccounts(normalized);

      if (normalized.length === 0) {
        setSelectedAccount(null);
        updateUserSelectedAccount(null);
        return { success: true, accounts: [] };
      }

      // Restore previously selected account or first
      const preferredMerchantId = user?.selectedAccount;
      let preferredAccount = normalized.find(acc => acc.merchantId === preferredMerchantId);

      if (!preferredAccount) {
        preferredAccount = normalized[0];
      }

      // Set selectedAccount state **before persisting**
      setSelectedAccount(preferredAccount);
      updateUserSelectedAccount(preferredAccount.merchantId);

      return { success: true, accounts: normalized };
    } catch (err) {
      console.error("Error loading accounts:", err);
      return { success: false, message: err.message };
    }
  };

  const loginWithToken = async (token) => {
  if (!token) return { success: false, message: "No token provided" };
  localStorage.setItem("token", token);

  try {
    const res = await axios.get(`${API}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.success && res.data.user) {
      persistUser(res.data.user);
      await syncAccounts();
      return { success: true };
    } else {
      clearSession();
      return { success: false, message: "Invalid token" };
    }
  } catch (err) {
    clearSession();
    return { success: false, message: err.message };
  }
};


  // Switch account
  const switchAccount = async (accountId) => {
    if (!accountId) return false;

    const accountToSwitch =
      accounts.find(acc => acc._id === accountId) ||
      accounts.find(acc => acc.merchantId === accountId);

    if (!accountToSwitch) return false;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token");

      const res = await axios.post(
        `${API}/api/auth/select-account`,
        { merchantId: accountId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        // Update selectedAccount state **immediately**
        setSelectedAccount(accountToSwitch);
        updateUserSelectedAccount(accountToSwitch.merchantId);

        return true;
      }
      return false;
    } catch (err) {
      console.error("Error switching account:", err);
      return false;
=======
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
>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe
    }
  };

  // -------------------------------
  // ACCOUNT SWITCH
  // -------------------------------

  const switchAccount = async (accountId) => {
    try {
      const token = localStorage.getItem("token");
<<<<<<< HEAD
=======

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
>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe
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
<<<<<<< HEAD
        } else clearSession();
      } catch (err) {
=======
        } else {
          clearSession();
        }
      } catch {
>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe
        clearSession();
      } finally {
        setLoading(false);
      }
    };
<<<<<<< HEAD
    verifyAuth();
  }, []);

  // Load accounts when user changes
  useEffect(() => {
    if (user && !loading) syncAccounts();
  }, [user, loading]);

  const register = async (name, email, password) => {
    try {
      const res = await axios.post(`${API}/api/auth/register`, { name, email, password });
      persistUser(res.data.user);
=======

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
>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe
      localStorage.setItem("token", res.data.token);
      persistUser(res.data.user);
      await syncAccounts();
      return { success: true, user: res.data.user };
    } catch (err) {
<<<<<<< HEAD
      return { success: false, message: err.message };
=======
      return { 
        success: false, 
        message: err.response?.data?.message || "Registration failed" 
      };
>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe
    }
  };

  const login = async (email, password) => {
    try {
<<<<<<< HEAD
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      persistUser(res.data.user);
      localStorage.setItem("token", res.data.token);
      await syncAccounts();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => clearSession();
=======
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
>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
<<<<<<< HEAD
        accounts,
        selectedAccount,
        register,
        login,
        logout,
        syncAccounts,
        switchAccount,
        loginWithToken,
        isAuthenticated: () => !!user && !!localStorage.getItem("token"),
=======
        login,
        register,
        loginWithToken,
        logout,
        accounts,
        selectedAccount,
        switchAccount,
        isAuthenticated
>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

<<<<<<< HEAD
export const useAuth = () => useContext(AuthContext);
=======
export const useAuth = () => useContext(AuthContext);
>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe
