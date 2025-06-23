// components/ExpenseList.js
import React, { useState, useMemo } from "react";
import {
  Minus,
  Trash2,
  Filter,
  ChevronDown,
  Calendar,
  Search,
  Eye,
  EyeOff,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

const ExpenseList = ({ expenses, budgets, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filterBudget, setFilterBudget] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("date-desc");
  const [selectedCategory, setSelectedCategory] = useState(null);

  const expenseArray = Object.entries(expenses).map(([id, expense]) => ({
    id,
    ...expense,
  }));

  // Filter and sort expenses
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenseArray;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (expense) =>
          expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          budgets[expense.budgetId]?.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Budget filter
    if (filterBudget !== "all") {
      filtered = filtered.filter(
        (expense) => expense.budgetId === filterBudget
      );
    }

    // Date range filter
    if (filterDateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (filterDateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(
            (expense) => new Date(expense.date) >= filterDate
          );
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(
            (expense) => new Date(expense.date) >= filterDate
          );
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(
            (expense) => new Date(expense.date) >= filterDate
          );
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          filtered = filtered.filter(
            (expense) => new Date(expense.date) >= filterDate
          );
          break;
      }
    }

    // Sort expenses
    switch (sortBy) {
      case "date-desc":
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "date-asc":
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "amount-desc":
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case "amount-asc":
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [
    expenseArray,
    filterBudget,
    filterDateRange,
    searchTerm,
    sortBy,
    budgets,
  ]);

  // Get expense categories (group by budget) - apply filters first
  const expensesByCategory = useMemo(() => {
    const categories = {};
    filteredAndSortedExpenses.forEach((expense) => {
      const budgetName = budgets[expense.budgetId]?.name || "Unknown";
      const budgetId = expense.budgetId || "unknown";
      if (!categories[budgetId]) {
        categories[budgetId] = {
          name: budgetName,
          expenses: [],
          color: budgets[expense.budgetId]?.color || "purple",
        };
      }
      categories[budgetId].expenses.push(expense);
    });
    return categories;
  }, [filteredAndSortedExpenses, budgets]);

  // Check if any filters are active
  const hasActiveFilters =
    filterBudget !== "all" ||
    filterDateRange !== "all" ||
    searchTerm !== "" ||
    sortBy !== "date-desc";

  // Determine what to show - don't show categories if filters are active
  const shouldShowCategories =
    filteredAndSortedExpenses.length > 3 &&
    !selectedCategory &&
    !hasActiveFilters;

  const displayExpenses = selectedCategory
    ? expensesByCategory[selectedCategory]?.expenses || []
    : filteredAndSortedExpenses;

  // Pagination for expenses
  const totalPages = Math.ceil(displayExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = displayExpenses.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterBudget, filterDateRange, searchTerm, sortBy, selectedCategory]);

  // Clear selected category when filters are applied
  React.useEffect(() => {
    if (hasActiveFilters && selectedCategory) {
      setSelectedCategory(null);
    }
  }, [hasActiveFilters, selectedCategory]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTotalAmount = () => {
    return displayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const clearFilters = () => {
    setFilterBudget("all");
    setFilterDateRange("all");
    setSearchTerm("");
    setSortBy("date-desc");
    setCurrentPage(1);
    // Don't reset selectedCategory when clearing filters
    // Only reset it if we want to go back to category view
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
            {selectedCategory && (
              <button
                onClick={handleBackToCategories}
                className="p-1.5 sm:p-2 hover:bg-purple-100 rounded-lg transition-colors flex-shrink-0 mt-0.5"
              >
                <ArrowLeft className="w-4 h-4 text-purple-600" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {selectedCategory
                  ? expensesByCategory[selectedCategory]?.name
                  : "Recent Expenses"}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs sm:text-sm text-gray-500">
                <span className="whitespace-nowrap">
                  {displayExpenses.length} expense
                  {displayExpenses.length !== 1 ? "s" : ""}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap font-medium">
                  Total: ₱{getTotalAmount().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {!shouldShowCategories && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors flex-shrink-0 ${
                showFilters
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {showFilters ? (
                <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                {showFilters ? "Hide" : "Show"}
              </span>
            </button>
          )}
        </div>

        {/* Search Bar - Always visible when not in category view or when selected category */}
        {(!shouldShowCategories || selectedCategory) && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
            />
          </div>
        )}

        {/* Filters - Mobile optimized */}
        {showFilters && !shouldShowCategories && (
          <div className="bg-purple-50 p-3 sm:p-4 rounded-lg space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {/* Budget Filter */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Filter by Budget
                </label>
                <select
                  value={filterBudget}
                  onChange={(e) => setFilterBudget(e.target.value)}
                  className="w-full p-2 sm:p-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="all">All Budgets</option>
                  {Object.entries(budgets).map(([id, budget]) => (
                    <option key={id} value={id}>
                      {budget.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Filter by Date
                </label>
                <select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  className="w-full p-2 sm:p-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 sm:p-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                  <option value="amount-desc">Amount (Highest First)</option>
                  <option value="amount-asc">Amount (Lowest First)</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-6">
        {/* Category View - Mobile optimized grid */}
        {shouldShowCategories ? (
          <div>
            <div className="mb-4 sm:mb-6">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">
                Tap a category to view expenses
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {Object.entries(expensesByCategory).map(
                  ([categoryId, category]) => (
                    <button
                      key={categoryId}
                      onClick={() => handleCategoryClick(categoryId)}
                      className="group bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 p-3 sm:p-4 rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-200 text-left hover:shadow-md active:scale-95"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-purple-900 truncate mr-2">
                              {category.name}
                            </div>
                            <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-purple-600 flex-shrink-0" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div>
                              <div className="text-xs text-gray-600 truncate">
                                {category.expenses.length} expense
                                {category.expenses.length !== 1 ? "s" : ""}
                              </div>
                              <div className="text-sm sm:text-lg font-bold text-purple-700 truncate">
                                ₱
                                {category.expenses
                                  .reduce((sum, exp) => sum + exp.amount, 0)
                                  .toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">
                                Latest:
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {formatDate(category.expenses[0]?.date)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Quick Stats - Mobile optimized */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 sm:p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-600">Categories</div>
                  <div className="text-lg sm:text-xl font-bold text-purple-700">
                    {Object.keys(expensesByCategory).length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Expenses</div>
                  <div className="text-lg sm:text-xl font-bold text-purple-700">
                    {filteredAndSortedExpenses.length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Total</div>
                  <div className="text-sm sm:text-lg font-bold text-purple-700 truncate">
                    ₱{getTotalAmount().toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Average</div>
                  <div className="text-sm sm:text-lg font-bold text-purple-700 truncate">
                    ₱
                    {(
                      getTotalAmount() / filteredAndSortedExpenses.length || 0
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Expense List View - Mobile optimized */
          <div className="space-y-2 sm:space-y-3">
            {paginatedExpenses.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="bg-purple-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Minus className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                </div>
                <p className="text-gray-500 mb-2 text-sm sm:text-base">
                  {expenseArray.length === 0
                    ? "No expenses yet"
                    : "No expenses match your filters"}
                </p>
                {expenseArray.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={clearFilters}
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                    >
                      Clear filters to see all expenses
                    </button>
                    <button
                      onClick={handleBackToCategories}
                      className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                    >
                      Back to categories
                    </button>
                  </div>
                )}
              </div>
            ) : (
              paginatedExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg transition-all duration-200 border border-purple-100 hover:border-purple-200 active:scale-95"
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="bg-pink-200 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                          <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-pink-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {expense.name}
                          </h4>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs sm:text-sm text-gray-600">
                            <span className="truncate">
                              {budgets[expense.budgetId]?.name ||
                                "Unknown Budget"}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="whitespace-nowrap">
                              {formatDate(expense.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                        <span className="font-semibold text-pink-700 text-sm sm:text-base whitespace-nowrap">
                          -₱{expense.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => onDelete(expense.id)}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors active:scale-90"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Pagination - Mobile optimized */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-center mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 space-y-3">
                <div className="text-xs sm:text-sm text-gray-600 text-center">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(startIndex + itemsPerPage, displayExpenses.length)}{" "}
                  of {displayExpenses.length} expenses
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50 transition-colors"
                  >
                    Prev
                  </button>
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                      let page;
                      if (totalPages <= 3) {
                        page = i + 1;
                      } else if (currentPage <= 2) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 1) {
                        page = totalPages - 2 + i;
                      } else {
                        page = currentPage - 1 + i;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors ${
                            currentPage === page
                              ? "bg-purple-300 text-purple-900"
                              : "border border-gray-200 hover:bg-purple-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;
