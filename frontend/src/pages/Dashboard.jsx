import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Package, CheckCircle2, Clock, TrendingUp, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Area, AreaChart, RadialBarChart, RadialBar, Tooltip } from "recharts";

const API = import.meta.env.VITE_API_BASE_URL;

const Dashboard = () => {
  const { user, selectedAccount } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    disapprovedProducts: 0,
    approvalRate: "0.0%"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedAccount) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(`${API}/api/merchant/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedAccount]);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Mini smooth curve data for stat cards with variation
  const generateSmoothData = (finalValue, points = 12) => {
    if (finalValue === 0) {
      // Generate a nice curve even for 0 values
      return Array.from({ length: points }, (_, i) => ({
        value: Math.sin((i / points) * Math.PI) * 10
      }));
    }
    const data = [];
    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      // Add some wave variation for more attractive curves
      const wave = Math.sin(progress * Math.PI * 2) * 0.08;
      const value = finalValue * (0.2 + (progress * 0.8) + wave);
      data.push({ value: Math.max(0, Math.round(value)) });
    }
    return data;
  };

  const totalProductsData = generateSmoothData(stats.totalProducts);
  const approvedData = generateSmoothData(stats.approvedProducts);
  const pendingData = generateSmoothData(stats.pendingProducts);
  const approvalRateValue = parseFloat(stats.approvalRate) || 0;
  const approvalRateData = generateSmoothData(approvalRateValue);

  // Data for main charts - Real data usage
  const pieChartData = [
    { name: "Approved", value: stats.approvedProducts || 1, color: "#86efac" },
    { name: "Pending", value: stats.pendingProducts || 1, color: "#fde047" },
    { name: "Disapproved", value: stats.disapprovedProducts || 1, color: "#fca5a5" }
  ];

  // Radial chart data for Product Statistics
  const radialChartData = [
    { 
      name: "Approved", 
      value: stats.totalProducts > 0 ? (stats.approvedProducts / stats.totalProducts) * 100 : 0, 
      fill: "#86efac" 
    },
    { 
      name: "Pending", 
      value: stats.totalProducts > 0 ? (stats.pendingProducts / stats.totalProducts) * 100 : 0, 
      fill: "#fde047" 
    },
    { 
      name: "Disapproved", 
      value: stats.totalProducts > 0 ? (stats.disapprovedProducts / stats.totalProducts) * 100 : 0, 
      fill: "#fca5a5" 
    }
  ];

  const statsCards = [
    {
      title: "Total Products",
      value: formatNumber(stats.totalProducts),
      icon: Package,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      chartData: totalProductsData,
      chartColor: "#60a5fa"
    },
    {
      title: "Approved",
      value: formatNumber(stats.approvedProducts),
      icon: CheckCircle2,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      chartData: approvedData,
      chartColor: "#4ade80"
    },
    {
      title: "Pending",
      value: formatNumber(stats.pendingProducts),
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      chartData: pendingData,
      chartColor: "#fbbf24"
    },
    {
      title: "Approval Rate",
      value: stats.approvalRate,
      icon: TrendingUp,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
      chartData: approvalRateData,
      chartColor: "#a78bfa"
    }
  ];

  return (
    <div className="p-6 min-h-[calc(100vh-64px)] bg-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {user?.name || "User"}
        </h1>
        <p className="text-gray-500">
          {selectedAccount 
            ? `Here's what's happening with ${selectedAccount.accountName || 'your account'} today.`
            : "Please select an account to view statistics."}
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg"></div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-20 mb-3"></div>
              <div className="h-7 bg-gray-100 rounded w-28"></div>
            </div>
          ))}
        </div>
      ) : !selectedAccount ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
          <Package className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Please select an account to view statistics.</p>
        </div>
      ) : (
        <>
          {/* Stats Cards with Smooth Curve Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`${stat.iconBg} p-2.5 rounded-lg`}>
                      <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <h3 className="text-gray-500 text-xs font-medium mb-1.5 uppercase tracking-wide">
                    {stat.title}
                  </h3>
                  <p className="text-2xl font-bold text-gray-800 mb-3">{stat.value}</p>
                  
                  {/* Smooth Curly Chart */}
                  <ResponsiveContainer width="100%" height={50}>
                    <AreaChart data={stat.chartData}>
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={stat.chartColor} stopOpacity={0.5}/>
                          <stop offset="50%" stopColor={stat.chartColor} stopOpacity={0.25}/>
                          <stop offset="100%" stopColor={stat.chartColor} stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="natural" 
                        dataKey="value" 
                        stroke={stat.chartColor} 
                        strokeWidth={3}
                        fill={`url(#gradient-${index})`}
                        dot={false}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            {/* Donut Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <PieChartIcon className="w-5 h-5 text-indigo-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Product Distribution
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatNumber(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {pieChartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs font-medium text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Radial Bar Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="bg-emerald-50 p-2 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Product Statistics
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="20%" 
                  outerRadius="90%" 
                  data={radialChartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    minAngle={15}
                    background
                    clockWise
                    dataKey="value"
                    cornerRadius={10}
                  />
                  <Tooltip 
                    formatter={(value) => `${value.toFixed(1)}%`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {radialChartData.map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                      <span className="text-xs font-medium text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{item.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Account Info & Status Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Account Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Account Information
              </h2>
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-600 font-medium mb-1">Account Name</p>
                  <p className="text-base font-semibold text-gray-800">{selectedAccount.accountName || "N/A"}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-xs text-gray-600 font-medium mb-1">Merchant ID</p>
                  <p className="text-base font-mono font-semibold text-gray-800">{selectedAccount.merchantId || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Product Status Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Product Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-800">Approved</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{formatNumber(stats.approvedProducts)}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium text-gray-800">Pending</span>
                  </div>
                  <span className="text-lg font-bold text-amber-600">{formatNumber(stats.pendingProducts)}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-gray-800">Disapproved</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{formatNumber(stats.disapprovedProducts)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;