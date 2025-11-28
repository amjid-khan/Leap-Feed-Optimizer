import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API = import.meta.env.VITE_API_BASE_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

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

  const persistSelectedAccount = async (accountId, fallbackAccount = null) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token");

      const res = await axios.post(
        `${API}/api/accounts/${accountId}/switch`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        const account =
          fallbackAccount || accounts.find((acc) => acc._id === accountId) || null;
        if (account) {
          setSelectedAccount(account);
        }
        updateUserSelectedAccount(accountId);
        return { success: true, account: res.data.account };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const syncAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return { success: false, message: "No authentication token" };

      const res = await axios.get(`${API}/api/accounts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        const accountsList = res.data.accounts || [];
        setAccounts(accountsList);

        if (accountsList.length === 0) {
          setSelectedAccount(null);
          updateUserSelectedAccount(null);
          return { success: true, accounts: [] };
        }

        const preferredId = user?.selectedAccount;
        const preferredAccount =
          accountsList.find((acc) => acc._id === preferredId) || null;

        if (preferredAccount) {
          setSelectedAccount(preferredAccount);
        } else {
          const firstAccount = accountsList[0];
          await persistSelectedAccount(firstAccount._id, firstAccount);
        }

        return { success: true, accounts: accountsList };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      console.error("Error loading accounts:", err);
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  // Verify token and load user on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("token");

      // If no token, clear everything
      if (!token) {
        clearSession();
        setLoading(false);
        return;
      }

      // Verify token with backend
      try {
        const res = await axios.get(`${API}/api/auth/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.success && res.data.user) {
          persistUser(res.data.user);
        } else {
          // Invalid token, clear everything
          clearSession();
        }
      } catch (err) {
        // Token invalid or expired, clear everything
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // Load accounts when user is available
  useEffect(() => {
    if (user && !loading) {
      syncAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  // Load user accounts
  const loadUserAccounts = syncAccounts;

  // Register function
  const register = async (name, email, password) => {
    try {
      const res = await axios.post(`${API}/api/auth/register`, {
        name,
        email,
        password,
      });
      persistUser(res.data.user);
      localStorage.setItem("token", res.data.token);
      await syncAccounts();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      persistUser(res.data.user);
      localStorage.setItem("token", res.data.token);
      // Load accounts after login
      await loadUserAccounts();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  // Logout function
  const logout = () => {
    clearSession();
  };

  // Account management functions
  const fetchUserAccounts = async () => syncAccounts();

  const switchAccount = async (accountId) => persistSelectedAccount(accountId);

  const deleteAccount = async (accountId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token");

      const res = await axios.delete(`${API}/api/accounts/${accountId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        const updatedAccounts = accounts.filter((acc) => acc._id !== accountId);
        setAccounts(updatedAccounts);
        
        // If deleted account was selected, select first available
        if (selectedAccount?._id === accountId) {
          if (updatedAccounts.length > 0) {
            await persistSelectedAccount(updatedAccounts[0]._id, updatedAccounts[0]);
          } else {
            setSelectedAccount(null);
            updateUserSelectedAccount(null);
          }
        }
        
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updateAccount = async (accountId, accountName, merchantId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token");

      const res = await axios.put(
        `${API}/api/accounts/${accountId}`,
        { accountName, merchantId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        const updatedAccounts = accounts.map((acc) =>
          acc._id === accountId ? res.data.account : acc
        );
        setAccounts(updatedAccounts);
        
        // Update selected account if it was the one updated
        if (selectedAccount?._id === accountId) {
          setSelectedAccount(res.data.account);
        }
        
        return { success: true, account: res.data.account };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  // Check if user is authenticated (has valid token)
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    return !!token && !!user;
  };
const fetchProducts = async (page = 1, limit = 20, searchQuery = "") => {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache' // Prevent browser caching issues
    };

    // Optimized URL construction
    const baseUrl = `${API}/api/merchant/products`;
    const params = new URLSearchParams({
      page: Math.max(1, page),
      limit: Math.min(1000, Math.max(1, limit)) // Allow up to 1000 products per page // Limit to 100 max
    });
    
    if (searchQuery && searchQuery.trim()) {
      params.append('search', searchQuery.trim().substring(0, 100)); // Limit search length
    }

    const url = `${baseUrl}?${params.toString()}`;
    
    // Use unique timer name with timestamp to avoid conflicts
    const timerName = `API_Fetch_Products_${page}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.time(timerName);
    const res = await axios.get(url, { 
      headers,
      timeout: 30000 // 30 second timeout
    });
    console.timeEnd(timerName);

    console.log("API Response:", res.data); // Debug log

    if (res.data.success) {
      const products = res.data.data || [];
      const pagination = res.data.pagination || {
        total: 0,
        page: page,
        limit: limit,
        totalPages: 0
      };
      
      console.log(`Fetched ${products.length} products, Total: ${pagination.total}`); // Debug log
      
      return {
        products: products,
        pagination: pagination
      };
    } else {
      console.warn("API returned non-success:", res.data.message);
      return {
        products: [],
        pagination: { 
          total: 0, 
          page: page, 
          limit: limit, 
          totalPages: 0 
        }
      };
    }
  } catch (err) {
    console.error("Error fetching products:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });

    // Return user-friendly error information
    let errorMessage = "Failed to fetch products";
    
    if (err.code === 'ECONNABORTED') {
      errorMessage = "Request timeout. Please try again.";
    } else if (err.response?.status === 401) {
      // Check if it's Google API auth error or session error
      const errorData = err.response?.data;
      if (errorData?.error?.includes("Google Merchant API") || errorData?.error?.includes("Authentication failed")) {
        errorMessage = "Google API authentication failed. Please check service account permissions.";
      } else {
        errorMessage = "Session expired. Please login again.";
        localStorage.removeItem("token");
        window.location.href = '/login';
      }
    } else if (err.response?.status === 404) {
      errorMessage = "Products endpoint not found.";
    } else if (err.response?.status >= 500) {
      errorMessage = "Server error. Please try again later.";
    }

    throw new Error(errorMessage);
  }
};

const fetchBrands = async () => {
  try {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await axios.get(`${API}/api/merchant/products?limit=100`, { headers });

    if (res.data.success) {
      // Extract unique brands from products
      const products = res.data.data || [];
      const uniqueBrands = [...new Map(
        products
          .filter(product => product.brand && product.brand.trim() !== "")
          .map(product => [product.brand, {
            name: product.brand,
            id: product.id || product.sku || Math.random().toString(36).substr(2, 9),
            productCount: products.filter(p => p.brand === product.brand).length
          }])
      ).values()];

      console.log("Brands extracted:", uniqueBrands);
      return {
        brands: uniqueBrands,
        totalBrands: uniqueBrands.length
      };
    } else {
      console.error("Failed to fetch brands:", res.data.message);
      return {
        brands: [],
        totalBrands: 0
      };
    }
  } catch (err) {
    console.error("Error fetching brands:", err.message);
    return {
      brands: [],
      totalBrands: 0
    };
  }
};


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        fetchProducts,
        isAuthenticated,
        fetchBrands,
        accounts,
        selectedAccount,
        fetchUserAccounts,
        switchAccount,
        deleteAccount,
        updateAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);
