import React from 'react'

const FeedData = () => {
  return (
    <div>
<<<<<<< HEAD
      Feed Data Component
=======
      FeedData
>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe
    </div>
  )
}

export default FeedData
<<<<<<< HEAD
=======





// import React, { useState, useEffect } from "react";
// import {
//   Search,
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
//   Eye,
//   X,
// } from "lucide-react";
// import { useAuth } from "../context/AuthContext";

// const FeedData = () => {
//   const { fetchProducts, selectedAccount } = useAuth();
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [rowsPerPage, setRowsPerPage] = useState(50);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [totalProducts, setTotalProducts] = useState(0);
//   const [totalPages, setTotalPages] = useState(0);
//   const [selectedDescription, setSelectedDescription] = useState(null);

//   // Debounce search to avoid too many API calls
//   const [searchDebounce, setSearchDebounce] = useState("");

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setSearchDebounce(searchQuery);
//       setCurrentPage(1); // Reset to first page on search
//     }, 500); // 500ms debounce

//     return () => clearTimeout(timer);
//   }, [searchQuery]);

//   useEffect(() => {
//     const loadProducts = async () => {
//       if (!selectedAccount) {
//         setLoading(false);
//         setProducts([]);
//         setTotalProducts(0);
//         setTotalPages(0);
//         return;
//       }

//       setLoading(true);
//       try {
//         const result = await fetchProducts(currentPage, rowsPerPage, searchDebounce);
//         console.log("Products result:", result); // Debug log
//         setProducts(result.products || []);
//         setTotalProducts(result.pagination?.total || 0);
//         setTotalPages(result.pagination?.totalPages || 0);
//       } catch (err) {
//         console.error("Error loading products:", err);
//         setProducts([]);
//         setTotalProducts(0);
//         setTotalPages(0);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadProducts();
//   }, [fetchProducts, currentPage, rowsPerPage, searchDebounce, selectedAccount]);

//   const handlePrev = () => {
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   };

//   const handleNext = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage(currentPage + 1);
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   };

//   const handleFirst = () => {
//     setCurrentPage(1);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const handleLast = () => {
//     setCurrentPage(totalPages);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const handleOptimize = (id) => {
//     alert(`Optimizing product ID: ${id}`);
//   };

//   const handleViewDescription = (description) => {
//     setSelectedDescription(description);
//   };

//   // Function to clean ID by removing online:en:GB: prefix
//   const cleanId = (id) => {
//     if (!id) return '';
//     return id.replace(/^online:en:GB:/, '');
//   };

//   return (
//     <div className="p-4 sm:p-6 relative min-h-[calc(100vh-64px)] flex flex-col">
//       {/* Description Modal - Improved responsive design */}
//       {selectedDescription && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
//             <div className="p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-lg font-semibold text-slate-800">Product Description</h3>
//                 <button
//                   onClick={() => setSelectedDescription(null)}
//                   className="p-2 hover:bg-slate-100 rounded-lg transition"
//                 >
//                   <X className="w-5 h-5 text-slate-600" />
//                 </button>
//               </div>
//             </div>
//             <div className="flex-1 overflow-y-auto p-4 sm:p-6">
//               <p className="text-slate-700 whitespace-pre-wrap">{selectedDescription}</p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Header with title and search */}
//       <div className="flex flex-col sm:flex-row  p-3 rounded-md sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
//         <div>
//           <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Feed Data</h1>
//           <p className="text-sm text-slate-600 mt-1">
//             Manage and optimize your product feed data
//           </p>
//         </div>
        
//         {/* Search Bar */}
//         <div className="w-full sm:w-260 sm:max-w-md">
//           <div className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-white border border-slate-300 shadow-sm hover:shadow-md transition duration-300 focus-within:border-blue-500 focus-within:shadow-blue-100">
//             <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
//             <input
//               type="text"
//               placeholder="Search feed data..."
//               className="w-full bg-transparent outline-none text-slate-700 text-sm sm:text-base"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Table Container with Horizontal Scroll */}
//       <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white flex-1">
//         <div className="min-w-[1400px]">
//           <table className="w-full text-left text-sm">
//             <thead className="bg-slate-100 text-slate-700 text-xs uppercase">
//               <tr>
//                 <th className="px-3 py-3 w-24">Status</th>
//                 <th className="px-3 py-3 w-64">ID</th>
//                 <th className="px-3 py-3 w-20">Image</th>
//                 <th className="px-3 py-3 w-96">Title</th>
//                 <th className="px-3 py-3 w-64">Description</th>
//                 <th className="px-3 py-3 w-40">Brand</th>
//                 <th className="px-3 py-3 w-40">Feed Label</th>
//                 <th className="px-3 py-3 w-48">Product Type</th>
//                 <th className="px-3 py-3 w-56">Google Category</th>
//                 <th className="px-3 py-3 w-24">Action</th>
//               </tr>
//             </thead>

//             <tbody>
//               {loading ? (
//                 // Skeleton Loading Rows - Fixed alignment
//                 Array.from({ length: rowsPerPage }).map((_, index) => (
//                   <tr key={`skeleton-${index}`} className="border-t animate-pulse">
//                     {/* Status Skeleton */}
//                     <td className="px-3 py-3">
//                       <div className="h-[60px] flex items-center justify-center">
//                         <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
//                       </div>
//                     </td>
//                     {/* ID Skeleton - Fixed alignment */}
//                     <td className="px-3 py-3">
//                       <div className="h-[60px] flex items-center justify-center">
//                         <div className="h-4 w-48 bg-slate-200 rounded"></div>
//                       </div>
//                     </td>
//                     {/* Image Skeleton */}
//                     <td className="px-3 py-3">
//                       <div className="h-[60px] flex items-center justify-center">
//                         <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
//                       </div>
//                     </td>
//                     {/* Title Skeleton */}
//                     <td className="px-3 py-3">
//                       <div className="h-[60px] flex items-center">
//                         <div className="h-4 w-full bg-slate-200 rounded"></div>
//                       </div>
//                     </td>
//                     {/* Description Skeleton */}
//                     <td className="px-3 py-3">
//                       <div className="h-[60px] flex items-center gap-2">
//                         <div className="flex-1 space-y-2">
//                           <div className="h-3 w-full bg-slate-200 rounded"></div>
//                           <div className="h-3 w-4/5 bg-slate-200 rounded"></div>
//                           <div className="h-3 w-3/5 bg-slate-200 rounded"></div>
//                         </div>
//                         <div className="w-4 h-4 bg-slate-200 rounded"></div>
//                       </div>
//                     </td>
//                     {/* Brand Skeleton */}
//                     <td className="px-3 py-3">
//                       <div className="h-[60px] flex items-center justify-center">
//                         <div className="h-4 w-24 bg-slate-200 rounded"></div>
//                       </div>
//                     </td>
//                     {/* Feed Label Skeleton */}
//                     <td className="px-3 py-3">
//                       <div className="h-[60px] flex items-center justify-center">
//                         <div className="h-4 w-20 bg-slate-200 rounded"></div>
//                       </div>
//                     </td>
//                     {/* Product Type Skeleton */}
//                     <td className="px-3 py-3">
//                       <div className="h-[60px] flex items-center justify-center">
//                         <div className="h-4 w-32 bg-slate-200 rounded"></div>
//                       </div>
//                     </td>
//                     {/* Google Category Skeleton */}
//                     <td className="px-3 py-3">
//                       <div className="h-[60px] flex items-center justify-center">
//                         <div className="h-4 w-40 bg-slate-200 rounded"></div>
//                       </div>
//                     </td>
//                     {/* Action Skeleton */}
//                     <td className="px-3 py-3">
//                       <div className="h-[60px] flex items-center justify-center">
//                         <div className="h-8 w-20 bg-slate-200 rounded"></div>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               ) : products.length === 0 ? (
//                 <tr>
//                   <td colSpan="10" className="px-4 py-8 text-center text-slate-500">
//                     No products found
//                   </td>
//                 </tr>
//               ) : (
//                 products.map((item, index) => (
//                     <tr key={item.id || index} className="border-t hover:bg-slate-50 transition">
//                       {/* Status */}
//                       <td className="px-3 py-3">
//                         <div className="h-[60px] flex items-center justify-center">
//                           <span
//                             className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === "approved"
//                                 ? "bg-green-100 text-green-700"
//                                 : item.status === "disapproved"
//                                   ? "bg-red-100 text-red-700"
//                                   : "bg-yellow-100 text-yellow-700"
//                               }`}
//                           >
//                             {item.status}
//                           </span>
//                         </div>
//                       </td>

//                       {/* ID - Cleaned and properly centered */}
//                       <td className="px-3 py-3">
//                         <div className="h-[60px] flex items-center justify-center">
//                           <span className="font-mono text-xs text-slate-700 leading-tight break-all whitespace-normal line-clamp-3">
//                             {cleanId(item.id)}
//                           </span>
//                         </div>
//                       </td>

//                       {/* Image */}
//                       <td className="px-3 py-3">
//                         <div className="h-[60px] flex items-center justify-center">
//                           <img
//                             src={item.imageLink}
//                             alt={item.title}
//                             className="w-10 h-10 rounded-lg object-cover border"
//                             onError={(e) => {
//                               e.target.src = "https://via.placeholder.com/60";
//                             }}
//                           />
//                         </div>
//                       </td>

//                       {/* Title - Full content show with increased width */}
//                       <td className="px-3 py-3">
//                         <div className="h-[60px] flex items-center">
//                           <span className="font-medium text-slate-800 text-sm leading-tight whitespace-normal line-clamp-3">
//                             {item.title}
//                           </span>
//                         </div>
//                       </td>

//                       {/* Description - 3 lines with view icon that shows only on hover */}
//                       <td className="px-3 py-3">
//                         <div className="h-[60px] flex items-center gap-2 group">
//                           <div className="flex-1">
//                             <span className="text-slate-600 text-sm leading-tight line-clamp-3">
//                               {item.description}
//                             </span>
//                           </div>
//                           {item.description && item.description.length > 100 && (
//                             <button
//                               onClick={() => handleViewDescription(item.description)}
//                               className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-slate-200 rounded"
//                               title="View full description"
//                             >
//                               <Eye className="w-4 h-4 text-slate-500" />
//                             </button>
//                           )}
//                         </div>
//                       </td>

//                       {/* Brand */}
//                       <td className="px-3 py-3">
//                         <div className="h-[60px] flex items-center justify-center">
//                           <span className="text-slate-700 text-sm line-clamp-2">
//                             {item.brand}
//                           </span>
//                         </div>
//                       </td>

//                       {/* Feed Label */}
//                       <td className="px-3 py-3">
//                         <div className="h-[60px] flex items-center justify-center">
//                           <span className="text-slate-700 text-sm line-clamp-2">
//                             {item.feedLabel}
//                           </span>
//                         </div>
//                       </td>

//                       {/* Product Type */}
//                       <td className="px-3 py-3">
//                         <div className="h-[60px] flex items-center justify-center">
//                           <span className="text-slate-700 text-sm leading-tight line-clamp-3">
//                             {item.productType}
//                           </span>
//                         </div>
//                       </td>

//                       {/* Google Category */}
//                       <td className="px-3 py-3">
//                         <div className="h-[60px] flex items-center justify-center">
//                           <span className="text-slate-700 text-sm leading-tight line-clamp-3">
//                             {item.googleCategory}
//                           </span>
//                         </div>
//                       </td>

//                       {/* Action */}
//                       <td className="px-3 py-3">
//                         <div className="h-[60px] flex items-center justify-center">
//                           <button
//                             onClick={() => handleOptimize(item.id)}
//                             className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-blue-700 transition text-sm whitespace-nowrap"
//                           >
//                             Optimize
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//       </div>

//       {/* Pagination / Rows Selector */}
//       <div className="sticky bottom-0 w-full bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end px-3 sm:px-4 py-3 shadow-md mt-4">
//         <div className="flex items-center gap-2 mb-2 sm:mb-0">
//           <label className="text-slate-700 text-sm font-medium">Show rows</label>
//           <select
//             value={rowsPerPage}
//             onChange={(e) => {
//               setRowsPerPage(Number(e.target.value));
//               setCurrentPage(1);
//             }}
//             className="px-2 py-1 rounded border border-slate-300 bg-white text-sm"
//           >
//             <option value={20}>20</option>
//             <option value={50}>50</option>
//             <option value={100}>100</option>
//             <option value={200}>200</option>
//             <option value={500}>500</option>
//           </select>
//         </div>

//         <div className="text-slate-700 text-sm mb-2 sm:mb-0">
//           {`${(currentPage - 1) * rowsPerPage + 1}–${Math.min(
//             currentPage * rowsPerPage,
//             totalProducts
//           )} of ${totalProducts}`}
//         </div>

//         <div className="flex items-center gap-1 sm:gap-2">
//           <button
//             onClick={handleFirst}
//             disabled={currentPage === 1}
//             className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50 transition"
//           >
//             <ChevronsLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
//           </button>
//           <button
//             onClick={handlePrev}
//             disabled={currentPage === 1}
//             className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50 transition"
//           >
//             <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
//           </button>
//           <button
//             onClick={handleNext}
//             disabled={currentPage === totalPages}
//             className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50 transition"
//           >
//             <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
//           </button>
//           <button
//             onClick={handleLast}
//             disabled={currentPage === totalPages}
//             className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50 transition"
//           >
//             <ChevronsRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FeedData;
>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe
