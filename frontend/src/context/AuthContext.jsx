import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
const API = import.meta.env.VITE_API_BASE_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Persist user in state + localStorage
  const persistUser = (userData) => {
    if (userData) {
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      setUser(null);
      localStorage.removeItem("user");
    }
  };

  const updateUserSelectedAccount = (accountId) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, selectedAccount: accountId || null };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const clearSession = () => {
    persistUser(null);
    setAccounts([]);
    setSelectedAccount(null);
    localStorage.removeItem("token");
  };

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
    }
  };

  // Verify token and load user on mount
  useEffect(() => {
    const verifyAuth = async () => {
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

        if (res.data.success && res.data.user) {
          persistUser(res.data.user);
        } else clearSession();
      } catch (err) {
        clearSession();
      } finally {
        setLoading(false);
      }
    };
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
      localStorage.setItem("token", res.data.token);
      await syncAccounts();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const login = async (email, password) => {
    try {
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accounts,
        selectedAccount,
        register,
        login,
        logout,
        syncAccounts,
        switchAccount,
        loginWithToken,
        isAuthenticated: () => !!user && !!localStorage.getItem("token"),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
