import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { X, Plus, Edit2, Trash2, Check, X as XIcon } from "lucide-react";

const AccountManagement = ({ isOpen, onClose }) => {
  const {
    accounts,
    selectedAccount,
    fetchUserAccounts,
    addAccount,
    switchAccount,
    deleteAccount,
    updateAccount,
  } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({ accountName: "", merchantId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchUserAccounts();
    }
  }, [isOpen]);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.accountName || !formData.merchantId) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    const result = await addAccount(formData.accountName, formData.merchantId);
    if (result.success) {
      setFormData({ accountName: "", merchantId: "" });
      setShowAddForm(false);
      await fetchUserAccounts();
    } else {
      setError(result.message || "Failed to add account");
    }
    setLoading(false);
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setFormData({
      accountName: account.accountName,
      merchantId: account.merchantId,
    });
    setShowAddForm(false);
    setError("");
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.accountName || !formData.merchantId) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    const result = await updateAccount(
      editingAccount._id,
      formData.accountName,
      formData.merchantId
    );
    if (result.success) {
      setFormData({ accountName: "", merchantId: "" });
      setEditingAccount(null);
      await fetchUserAccounts();
    } else {
      setError(result.message || "Failed to update account");
    }
    setLoading(false);
  };

  const handleDeleteAccount = async (accountId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this account? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    const result = await deleteAccount(accountId);
    if (result.success) {
      await fetchUserAccounts();
    } else {
      setError(result.message || "Failed to delete account");
    }
    setLoading(false);
  };

  const handleSwitchAccount = async (accountId) => {
    setLoading(true);
    const result = await switchAccount(accountId);
    if (result.success) {
      // Reload page to refresh products
      window.location.reload();
    } else {
      setError(result.message || "Failed to switch account");
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({ accountName: "", merchantId: "" });
    setShowAddForm(false);
    setEditingAccount(null);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Account Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Add/Edit Form */}
          {(showAddForm || editingAccount) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">
                {editingAccount ? "Edit Account" : "Add New Account"}
              </h3>
              <form
                onSubmit={editingAccount ? handleUpdateAccount : handleAddAccount}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(e) =>
                      setFormData({ ...formData, accountName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., PhoneBits.co.uk"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Merchant ID
                  </label>
                  <input
                    type="text"
                    value={formData.merchantId}
                    onChange={(e) =>
                      setFormData({ ...formData, merchantId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 540577233"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {editingAccount ? "Update" : "Add"} Account
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Accounts List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Accounts</h3>
              {!showAddForm && !editingAccount && (
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingAccount(null);
                    setFormData({ accountName: "", merchantId: "" });
                    setError("");
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Account
                </button>
              )}
            </div>

            {accounts && accounts.length > 0 ? (
              accounts.map((account) => (
                <div
                  key={account._id}
                  className={`p-4 border rounded-lg ${
                    selectedAccount?._id === account._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                          {account.accountName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {account.accountName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Merchant ID: {account.merchantId}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedAccount?._id === account._id && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                          Active
                        </span>
                      )}
                      {selectedAccount?._id !== account._id && (
                        <button
                          onClick={() => handleSwitchAccount(account._id)}
                          disabled={loading}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                          Switch
                        </button>
                      )}
                      <button
                        onClick={() => handleEditAccount(account)}
                        disabled={loading}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account._id)}
                        disabled={loading || accounts.length === 1}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          accounts.length === 1
                            ? "Cannot delete the last account"
                            : "Delete account"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No accounts found.</p>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setError("");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Your First Account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountManagement;


