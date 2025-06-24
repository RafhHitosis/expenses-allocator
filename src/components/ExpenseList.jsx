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
  const [isInCategoryView, setIsInCategoryView] = useState(false);

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
    // Only build categories if we're not in a specific category view
    const expensesToProcess =
      isInCategoryView && selectedCategory
        ? expenseArray.filter(
            (expense) => expense.budgetId === selectedCategory
          )
        : filteredAndSortedExpenses;

    expensesToProcess.forEach((expense) => {
      const budgetName = budgets[expense.budgetId]?.name || "Unknown";
      const budgetId = expense.budgetId || "unknown";
      if (!categories[budgetId]) {
        categories[budgetId] = {
          name: budgetName,
          expenses: [],
          color: budgets[expense.budgetId]?.color || "#B8906B",
        };
      }
      categories[budgetId].expenses.push(expense);
    });
    return categories;
  }, [
    expenseArray,
    filteredAndSortedExpenses,
    budgets,
    isInCategoryView,
    selectedCategory,
  ]);

  // When inside a category, don't consider budget filter as "active" since it's hidden
  const hasActiveFilters = isInCategoryView
    ? filterDateRange !== "all" ||
      searchTerm.trim() !== "" ||
      sortBy !== "date-desc"
    : filterBudget !== "all" ||
      filterDateRange !== "all" ||
      searchTerm.trim() !== "" ||
      sortBy !== "date-desc";

  // Determine what to show - don't show categories if filters are active
  const shouldShowCategories =
    filteredAndSortedExpenses.length > 3 &&
    !isInCategoryView &&
    !hasActiveFilters;

  const displayExpenses =
    isInCategoryView && selectedCategory
      ? expenseArray
          .filter((expense) => expense.budgetId === selectedCategory)
          .filter((expense) => {
            // Apply the same filters as in filteredAndSortedExpenses but only for this category
            let matches = true;

            // Search filter
            if (searchTerm) {
              matches =
                matches &&
                (expense.name
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                  budgets[expense.budgetId]?.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()));
            }

            // Date range filter
            if (filterDateRange !== "all") {
              const now = new Date();
              const filterDate = new Date();

              switch (filterDateRange) {
                case "today":
                  filterDate.setHours(0, 0, 0, 0);
                  matches = matches && new Date(expense.date) >= filterDate;
                  break;
                case "week":
                  filterDate.setDate(now.getDate() - 7);
                  matches = matches && new Date(expense.date) >= filterDate;
                  break;
                case "month":
                  filterDate.setMonth(now.getMonth() - 1);
                  matches = matches && new Date(expense.date) >= filterDate;
                  break;
                case "3months":
                  filterDate.setMonth(now.getMonth() - 3);
                  matches = matches && new Date(expense.date) >= filterDate;
                  break;
              }
            }

            return matches;
          })
          .sort((a, b) => {
            // Apply sorting
            switch (sortBy) {
              case "date-desc":
                return new Date(b.date) - new Date(a.date);
              case "date-asc":
                return new Date(a.date) - new Date(b.date);
              case "amount-desc":
                return b.amount - a.amount;
              case "amount-asc":
                return a.amount - b.amount;
              case "name":
                return a.name.localeCompare(b.name);
              default:
                return new Date(b.date) - new Date(a.date);
            }
          })
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

  // Only clear selected category when budget filter changes to a different category
  React.useEffect(() => {
    if (
      selectedCategory &&
      filterBudget !== "all" &&
      filterBudget !== selectedCategory
    ) {
      setSelectedCategory(null);
    }
  }, [filterBudget, selectedCategory]);

  // Reset isInCategoryView when selectedCategory is null and we're not actively in a category
  React.useEffect(() => {
    if (!selectedCategory && !isInCategoryView) {
      setShowFilters(false);
    }
  }, [selectedCategory, isInCategoryView]);

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
    // Don't clear selectedCategory or isInCategoryView - stay in the current category view
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setIsInCategoryView(true);
    setCurrentPage(1);
  };

  const handleBackToCategories = () => {
    // Clear all filters and search when going back
    setSelectedCategory(null);
    setIsInCategoryView(false);
    setShowFilters(false);
    setSearchTerm(""); // Clear search term
    setFilterDateRange("all"); // Reset date filter
    setSortBy("date-desc"); // Reset sort
    setCurrentPage(1);
  };

  return (
    <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-6 border-b border-amber-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
            {isInCategoryView && (
              <button
                onClick={handleBackToCategories}
                className="p-1.5 sm:p-2 hover:bg-amber-100 rounded-lg transition-colors flex-shrink-0 mt-0.5"
                title={
                  searchTerm ||
                  filterDateRange !== "all" ||
                  sortBy !== "date-desc"
                    ? "Clear filters"
                    : "Back to categories"
                }
              >
                <ArrowLeft className="w-4 h-4 text-amber-600" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-amber-900 truncate">
                {isInCategoryView
                  ? budgets[selectedCategory]?.name || "Category"
                  : "Recent Expenses"}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs sm:text-sm text-amber-700">
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

          {(!shouldShowCategories || isInCategoryView) && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors flex-shrink-0 ${
                showFilters
                  ? "bg-amber-100 text-amber-700"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              {showFilters ? (
                <>
                  <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                  <p className="text-xs sm:text-sm font-medium sm:inline">
                    Filter
                  </p>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <p className="text-xs sm:text-sm font-medium sm:inline">
                    Filter
                  </p>
                </>
              )}
            </button>
          )}
        </div>

        {/* Search Bar - Always visible when not in category view or when selected category */}
        {(!shouldShowCategories || isInCategoryView) && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
            />
          </div>
        )}

        {/* Filters - Mobile optimized */}
        {showFilters && (!shouldShowCategories || isInCategoryView) && (
          <div className="bg-amber-50 p-3 sm:p-4 rounded-lg space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {/* Budget Filter - Hide when inside a specific category */}
              {!isInCategoryView && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-amber-700 mb-1.5 sm:mb-2">
                    Filter by Budget
                  </label>
                  <select
                    value={filterBudget}
                    onChange={(e) => setFilterBudget(e.target.value)}
                    className="w-full p-2 sm:p-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
                  >
                    <option value="all">All Budgets</option>
                    {Object.entries(budgets).map(([id, budget]) => (
                      <option key={id} value={id}>
                        {budget.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Range Filter */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-amber-700 mb-1.5 sm:mb-2">
                  Filter by Date
                </label>
                <select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  className="w-full p-2 sm:p-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
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
                <label className="block text-xs sm:text-sm font-medium text-amber-700 mb-1.5 sm:mb-2">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 sm:p-2.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
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
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-amber-600 hover:text-amber-800 font-medium"
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
              <h4 className="text-xs sm:text-sm font-semibold text-amber-900 mb-3">
                Tap a category to view expenses
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {Object.entries(expensesByCategory).map(
                  ([categoryId, category]) => (
                    <button
                      key={categoryId}
                      onClick={() => handleCategoryClick(categoryId)}
                      className="group bg-gradient-to-br from-amber-50 to-amber-50 hover:from-amber-100 hover:to-amber-100 p-3 sm:p-4 rounded-xl border border-amber-200 hover:border-amber-300 transition-all duration-200 text-left hover:shadow-md active:scale-95"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-semibold text-amber-900 group-hover:text-amber-900 truncate mr-2">
                              {category.name}
                            </div>
                            <ChevronRight className="w-4 h-4 text-amber-500 group-hover:text-amber-700 flex-shrink-0" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div>
                              <div className="text-xs text-amber-600 truncate">
                                {category.expenses.length} expense
                                {category.expenses.length !== 1 ? "s" : ""}
                              </div>
                              <div className="text-sm sm:text-lg font-bold text-amber-700 truncate">
                                ₱
                                {category.expenses
                                  .reduce((sum, exp) => sum + exp.amount, 0)
                                  .toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-amber-500">
                                Latest:
                              </div>
                              <div className="text-xs text-amber-600 truncate">
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
            <div className="bg-gradient-to-r from-amber-50 to-amber-50 p-3 sm:p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                <div>
                  <div className="text-xs text-amber-600">Categories</div>
                  <div className="text-lg sm:text-xl font-bold text-amber-700">
                    {Object.keys(expensesByCategory).length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-amber-600">Expenses</div>
                  <div className="text-lg sm:text-xl font-bold text-amber-700">
                    {filteredAndSortedExpenses.length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-amber-600">Total</div>
                  <div className="text-sm sm:text-lg font-bold text-amber-700 truncate">
                    ₱{getTotalAmount().toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-amber-600">Average</div>
                  <div className="text-sm sm:text-lg font-bold text-amber-700 truncate">
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
                <div className="bg-amber-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Minus className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
                </div>
                <p className="text-amber-500 mb-2 text-sm sm:text-base">
                  {expenseArray.length === 0
                    ? "No expenses yet"
                    : "No expenses match your filters"}
                </p>
                {expenseArray.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={clearFilters}
                      className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                    >
                      Clear filters to see all expenses
                    </button>
                    <button
                      onClick={handleBackToCategories}
                      className="text-amber-600 hover:text-amber-800 text-sm font-medium"
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
                  className="bg-gradient-to-r from-amber-50 to-amber-50 hover:from-amber-100 hover:to-amber-100 rounded-lg transition-all duration-200 border border-amber-100 hover:border-amber-200 active:scale-95"
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="bg-amber-200 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                          <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-amber-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-amber-900 text-sm sm:text-base truncate">
                            {expense.name}
                          </h4>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs sm:text-sm text-amber-600">
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
                        <span className="font-semibold text-amber-700 text-sm sm:text-base whitespace-nowrap">
                          -₱{expense.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => onDelete(expense.id)}
                          className="p-1.5 sm:p-2 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors active:scale-90"
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
              <div className="flex flex-col items-center justify-center mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-amber-200 space-y-3">
                <div className="text-xs sm:text-sm text-amber-600 text-center">
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
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-amber-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-50 transition-colors"
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
                              ? "bg-amber-300 text-amber-900"
                              : "border border-amber-200 hover:bg-amber-50"
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
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-amber-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-50 transition-colors"
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
