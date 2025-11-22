import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const FeedData = () => {
  const { fetchProducts } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedDescription, setSelectedDescription] = useState(null);

  // Debounce search to avoid too many API calls
  const [searchDebounce, setSearchDebounce] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const result = await fetchProducts(currentPage, rowsPerPage, searchDebounce);
        setProducts(result.products || []);
        setTotalProducts(result.pagination?.total || 0);
        setTotalPages(result.pagination?.totalPages || 0);
      } catch (err) {
        console.error("Error loading products:", err);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(0);
      }
      setLoading(false);
    };
    loadProducts();
  }, [fetchProducts, currentPage, rowsPerPage, searchDebounce]);

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFirst = () => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLast = () => {
    setCurrentPage(totalPages);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOptimize = (id) => {
    alert(`Optimizing product ID: ${id}`);
  };

  const handleViewDescription = (description) => {
    setSelectedDescription(description);
  };

  return (
    <div className="p-4 sm:p-6 relative min-h-[calc(100vh-64px)] flex flex-col">
      {/* Description Modal */}
      {selectedDescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Product Description</h3>
                <button
                  onClick={() => setSelectedDescription(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-slate-700 whitespace-pre-wrap">{selectedDescription}</p>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setSelectedDescription(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-slate-800">Feed Data</h1>

      {/* Search Bar */}
      <div className="w-full max-w-md mb-4 sm:mb-6">
        <div className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-white border border-slate-300 shadow-sm hover:shadow-md transition duration-300 focus-within:border-blue-500 focus-within:shadow-blue-100">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search feed data..."
            className="w-full bg-transparent outline-none text-slate-700 text-sm sm:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table Container with Horizontal Scroll */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white flex-1">
        {loading ? (
          <div className="p-4 sm:p-6 text-center text-slate-500">Loading products...</div>
        ) : (
          <div className="min-w-[1400px]"> {/* Increased minimum width to accommodate wider columns */}
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 text-xs uppercase">
                <tr>
                  <th className="px-3 py-3 w-24">Status</th>
                  <th className="px-3 py-3 w-64">ID</th> {/* Increased from w-32 to w-64 */}
                  <th className="px-3 py-3 w-20">Image</th>
                  <th className="px-3 py-3 w-96">Title</th> {/* Increased from w-64 to w-96 */}
                  <th className="px-3 py-3 w-64">Description</th>
                  <th className="px-3 py-3 w-40">Brand</th> {/* Increased from w-32 to w-40 */}
                  <th className="px-3 py-3 w-40">Feed Label</th> {/* Increased from w-32 to w-40 */}
                  <th className="px-3 py-3 w-48">Product Type</th> {/* Increased from w-40 to w-48 */}
                  <th className="px-3 py-3 w-56">Google Category</th> {/* Increased from w-48 to w-56 */}
                  <th className="px-3 py-3 w-24">Action</th>
                </tr>
              </thead>

              <tbody>
                {products.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center text-slate-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((item, index) => (
                    <tr key={item.id || index} className="border-t hover:bg-slate-50 transition">
                      {/* Status */}
                      <td className="px-3 py-3">
                        <div className="min-h-[60px] flex items-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : item.status === "disapproved"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </td>

                      {/* ID - Full content show with increased width */}
                      <td className="px-3 py-3">
                        <div className="min-h-[60px] flex items-start">
                          <span className="font-mono text-xs text-slate-700 leading-tight break-all whitespace-normal line-clamp-3">
                            {item.id}
                          </span>
                        </div>
                      </td>

                      {/* Image */}
                      <td className="px-3 py-3">
                        <div className="min-h-[60px] flex items-center">
                          <img
                            src={item.imageLink}
                            alt={item.title}
                            className="w-10 h-10 rounded-lg object-cover border"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/60";
                            }}
                          />
                        </div>
                      </td>

                      {/* Title - Full content show with increased width */}
                      <td className="px-3 py-3">
                        <div className="min-h-[60px] flex items-start">
                          <span className="font-medium text-slate-800 text-sm leading-tight whitespace-normal line-clamp-3">
                            {item.title}
                          </span>
                        </div>
                      </td>

                      {/* Description - 3 lines with view icon */}
                      <td className="px-3 py-3">
                        <div className="min-h-[60px] flex items-start gap-2 group">
                          <div className="flex-1">
                            <span className="text-slate-600 text-sm leading-tight line-clamp-3">
                              {item.description}
                            </span>
                          </div>
                          {item.description && item.description.length > 100 && (
                            <button
                              onClick={() => handleViewDescription(item.description)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-slate-200 rounded"
                              title="View full description"
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="px-3 py-3">
                        <div className="min-h-[60px] flex items-center">
                          <span className="text-slate-700 text-sm line-clamp-2">
                            {item.brand}
                          </span>
                        </div>
                      </td>

                      {/* Feed Label */}
                      <td className="px-3 py-3">
                        <div className="min-h-[60px] flex items-center">
                          <span className="text-slate-700 text-sm line-clamp-2">
                            {item.feedLabel}
                          </span>
                        </div>
                      </td>

                      {/* Product Type */}
                      <td className="px-3 py-3">
                        <div className="min-h-[60px] flex items-center">
                          <span className="text-slate-700 text-sm leading-tight line-clamp-3">
                            {item.productType}
                          </span>
                        </div>
                      </td>

                      {/* Google Category */}
                      <td className="px-3 py-3">
                        <div className="min-h-[60px] flex items-center">
                          <span className="text-slate-700 text-sm leading-tight line-clamp-3">
                            {item.googleCategory}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-3 py-3">
                        <div className="min-h-[60px] flex items-center">
                          <button
                            onClick={() => handleOptimize(item.id)}
                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-blue-700 transition text-sm whitespace-nowrap"
                          >
                            Optimize
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination / Rows Selector */}
      <div className="sticky bottom-0 w-full bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end px-3 sm:px-4 py-3 shadow-md mt-4">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <label className="text-slate-700 text-sm font-medium">Show rows</label>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 mr-3 py-1 sm:px-3 sm:py-1 rounded border border-slate-300 bg-white text-sm"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
        </div>

        <div className="text-slate-700  text-sm mb-2 sm:mb-0">
          {`${(currentPage - 1) * rowsPerPage + 1}–${Math.min(
            currentPage * rowsPerPage,
            totalProducts
          )} of ${totalProducts}`}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleFirst}
            disabled={currentPage === 1}
            className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50"
          >
            <ChevronsLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
          </button>
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
          </button>
          <button
            onClick={handleLast}
            disabled={currentPage === totalPages}
            className="p-1 sm:p-2 rounded hover:bg-slate-100 disabled:opacity-50"
          >
            <ChevronsRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedData;


