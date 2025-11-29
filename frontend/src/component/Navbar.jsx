import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import AccountManagement from "./AccountManagement.jsx";

const Navbar = () => {
  const { user, logout, accounts, selectedAccount, switchAccount } = useAuth();
  const navigate = useNavigate();

  const dropdownRef = useRef();
  const profileDropdownRef = useRef();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showAccountManagement, setShowAccountManagement] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.image]);

  // Get first letter of name for avatar
  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || "?";

  // Check if we should show image or fallback to first letter
  const hasValidImage = user?.image && user.image.trim() !== "" && !imageError;

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/");
    setProfileDropdownOpen(false);
  };

  return (
    <header className="h-16 bg-white shadow-md flex items-center px-6 justify-between z-50 relative">

      {/* LEFT: LOGO + TITLE */}
      <div className="flex items-center gap-6">
        <img
          src="https://mls0rqzktgmc.i.optimole.com/w:77/h:36/q:mauto/ig:avif/https://ppcleap.com/wp-content/uploads/2025/05/Vector-1.png"
          alt="Logo"
          className="w-20 h-auto"
        />
        <h2 className="text-xl md:text-2xl font-bold whitespace-nowrap">
          <span className="text-green-900">Leap</span> Feed Optimizer
        </h2>
      </div>

      {/* RIGHT SECTION (Google-style bar) */}
      <div className="flex items-center gap-6">

        {/* ACCOUNT NAME + ID + DROPDOWN - Image जैसा Style */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="cursor-pointer flex flex-col items-start px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-800 text-sm">
                    {selectedAccount?.accountName || "Select Account"}
                  </span>

                  {/* Dropdown Icon */}
                  <svg
                    className={`w-4 h-4 text-gray-500 transform transition-transform duration-200 ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                <span className="text-xs text-gray-500">
                  Merchant ID: {selectedAccount?.merchantId || ""}
                </span>
              </div>
            </div>
          </div>

          {/* DROPDOWN MENU - Image जैसा Exact Design */}
          <div
            className={`absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden transform transition-all duration-200 z-50 ${
              dropdownOpen
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 pointer-events-none -translate-y-2"
            }`}
          >
            {/* Current Account Info - Image के Header जैसा */}
            <div className="p-4 border-b border-gray-200">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {selectedAccount?.accountName || "Select Account"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Merchant Centre ID: {selectedAccount?.merchantId || ""}
                </p>
              </div>
              
              {/* Comparison Shopping Service - Image जैसा */}
              <div className="text-xs text-gray-600">
                <div>Comparison Shopping Service</div>
                <div className="text-blue-600 font-medium">Google Shopping (google.com/shopping)</div>
              </div>
            </div>

            {/* Search Section - Image जैसा */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <svg
                  className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search for business"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Accounts List */}
            <div className="max-h-64 overflow-y-auto">
              {accounts && accounts.length > 0 ? (
                <>
                  {accounts.map((acc) => (
                    <div
                      key={acc._id}
                      onClick={async () => {
                        await switchAccount(acc._id);
                        setDropdownOpen(false);
                      }}
                      className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer transition ${
                        selectedAccount?._id === acc._id ? "bg-blue-50 border-r-2 border-blue-500" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {acc.accountName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          Merchant ID: {acc.merchantId}
                        </p>
                      </div>
                      
                      {/* Checkmark for selected account */}
                      {selectedAccount?._id === acc._id && (
                        <svg
                          className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19-7"
                          />
                        </svg>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">No accounts found</p>
                </div>
              )}
            </div>

            {/* Manage Accounts Footer - Image के "Manage in Business Manager" जैसा */}
            <div className="border-t border-gray-200 bg-gray-50">
              <div
                onClick={() => {
                  setDropdownOpen(false);
                  setShowAccountManagement(true);
                }}
                className="flex items-center justify-center p-3 hover:bg-gray-200 cursor-pointer transition"
              >
                <span className="text-sm text-gray-700 font-medium">Manage accounts</span>
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE SECTION WITH DROPDOWN - Image जैसा Design */}
        <div className="relative" ref={profileDropdownRef}>
          <div
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="cursor-pointer"
          >
            {/* Avatar - Show Google profile picture, or first letter if no image */}
            {hasValidImage ? (
              <img
                src={user.image}
                alt="Profile"
                className="w-9 h-9 rounded-full border-2 border-gray-300 object-cover hover:border-gray-400 transition-colors"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold border-2 border-gray-300 hover:border-gray-400 transition-colors">
                {avatarLetter}
              </div>
            )}
          </div>

          {/* PROFILE DROPDOWN MENU - Image जैसा Exact Design */}
          <div
  className={`absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden transform transition-all duration-200 z-50 ${
    profileDropdownOpen
      ? "opacity-100 scale-100 translate-y-0"
      : "opacity-0 scale-95 pointer-events-none -translate-y-2"
  }`}
>
  {/* User Info Section (Redesigned: Email top center, bigger image, name below image) */}
  <div className="p-4 border-b border-gray-200 text-center">
    {/* Email Top Center */}
    <p className="text-sm text-gray-500 truncate mb-2">
      {user?.email || ""}
    </p>

    {/* Bigger Avatar Center */}
    <div className="flex justify-center mb-2">
      {hasValidImage ? (
        <img
          src={user.image}
          alt="Profile"
          className="w-16 h-16 rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
          {avatarLetter}
        </div>
      )}
    </div>

    {/* Name below Image */}
    <p className="text-sm font-medium text-gray-900 truncate">
      {user?.name || "User"}
    </p>
  </div>

  {/* Manage Google Account */}
  <div className="p-1 border-b border-gray-200">
    <button
      onClick={() => {
        setProfileDropdownOpen(false);
      }}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-left"
    >
      <svg
        className="w-5 h-5 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.36-2.38.996.61 2.296.07 2.572-1.06z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <span>Manage your Google Account</span>
    </button>
  </div>

  {/* Logout */}
  <div className="p-1">
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-left"
    >
      <svg
        className="w-5 h-5 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      <span>Sign out</span>
    </button>
  </div>

  {/* Footer */}
  <div className="p-4 border-t border-gray-200 bg-gray-50">
    <div className="flex justify-center gap-4 text-xs">
      <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">
        Privacy Policy
      </a>
      <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">
        Terms of Service
      </a>
    </div>
  </div>
</div>
        </div>
      </div>

      {/* Account Management Modal */}
      <AccountManagement
        isOpen={showAccountManagement}
        onClose={() => setShowAccountManagement(false)}
      />
    </header>
  );
};

export default Navbar;