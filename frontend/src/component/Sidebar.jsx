import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Database, Users, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin"
    },
    {
      label: "Feed Data",
      icon: Database,
      path: "/admin/feeddata"
    },
    {
      label: "Users",
      icon: Users,
      path: "/admin/users"
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/admin/settings"
    }
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
    setShowLogoutConfirm(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Extract first letter from name
  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <>
      <aside className="w-64 bg-white h-screen flex flex-col border-r border-slate-200 shadow-sm">
      

        {/* Main Navigation */}
        <div className="flex-1 p-6">
          <nav className="flex flex-col space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === "/admin" 
                ? (location.pathname === "/admin" || location.pathname === "/admin/dashboard")
                : location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? "bg-blue-50 text-green-600 border border-blue-100" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                    }
                  `}
                >
                  <div className={`
                    absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full transition-all duration-200
                    ${isActive 
                      ? "bg-green-600 opacity-100" 
                      : "bg-slate-300 opacity-0 group-hover:opacity-100"
                    }
                  `} />
                  
                  <Icon
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive 
                        ? "text-green-600" 
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

      </aside>

    
   
    </>
  );
};

export default Sidebar;