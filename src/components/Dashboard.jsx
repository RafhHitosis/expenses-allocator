// components/Dashboard.js
import React, { useEffect, useState } from "react";
import { Plus, Minus, DollarSign, Calendar, Menu, X } from "lucide-react";
import BudgetCard from "./BudgetCard";
import BudgetForm from "./BudgetForm";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import { database } from "../firebase";
import { ref, onValue, push, set, remove, get } from "firebase/database";

const Dashboard = ({ user, onLogout }) => {
  const [budgets, setBudgets] = useState({});
  const [expenses, setExpenses] = useState({});
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(() => () => {});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const budgetsRef = ref(database, `budgets/${user.uid}`);
    const expensesRef = ref(database, `expenses/${user.uid}`);

    const unsubscribeBudgets = onValue(budgetsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setBudgets(data);
    });

    const unsubscribeExpenses = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setExpenses(data);
    });

    return () => {
      unsubscribeBudgets();
      unsubscribeExpenses();
    };
  }, [user.uid]);

  const openConfirmModal = (action) => {
    setConfirmAction(() => action);
    setModalOpen(true);
  };

  const handleAddBudget = async (budgetData) => {
    const newRef = push(ref(database, `budgets/${user.uid}`));
    await set(newRef, { ...budgetData, id: newRef.key });
    setShowBudgetForm(false);
  };

  const handleEditBudget = async (budgetData) => {
    await set(ref(database, `budgets/${user.uid}/${editingBudget.id}`), {
      ...budgetData,
      id: editingBudget.id,
    });
    setEditingBudget(null);
  };

  const handleDeleteBudget = (budgetId) => {
    openConfirmModal(async () => {
      await remove(ref(database, `budgets/${user.uid}/${budgetId}`));
    });
  };

  const handleAddExpense = async (expenseData) => {
    const newRef = push(ref(database, `expenses/${user.uid}`));
    await set(newRef, { ...expenseData, id: newRef.key });

    const budgetRef = ref(
      database,
      `budgets/${user.uid}/${expenseData.budgetId}`
    );
    const snapshot = await get(budgetRef);
    const currentBudget = snapshot.val();
    if (currentBudget) {
      await set(budgetRef, {
        ...currentBudget,
        spent: currentBudget.spent + expenseData.amount,
      });
    }

    setShowExpenseForm(false);
  };

  const handleDeleteExpense = (expenseId) => {
    const expense = expenses[expenseId];
    if (!expense) return;
    openConfirmModal(async () => {
      const budgetRef = ref(
        database,
        `budgets/${user.uid}/${expense.budgetId}`
      );
      const snapshot = await get(budgetRef);
      const currentBudget = snapshot.val();
      if (currentBudget) {
        await set(budgetRef, {
          ...currentBudget,
          spent: currentBudget.spent - expense.amount,
        });
      }
      await remove(ref(database, `expenses/${user.uid}/${expenseId}`));
    });
  };

  const totalBudget = Object.values(budgets).reduce(
    (sum, b) => sum + b.amount,
    0
  );
  const totalSpent = Object.values(budgets).reduce(
    (sum, b) => sum + b.spent,
    0
  );

  const handleEditClick = (budget) => {
    setShowBudgetForm(false);
    setShowExpenseForm(false);
    setEditingBudget(budget);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PH", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const closeMobileActions = () => {
    setShowBudgetForm(false);
    setShowExpenseForm(false);
    setEditingBudget(null);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-purple-50">
      {/* Enhanced Header with Mobile Optimization */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo Section - Responsive */}
            <div className="flex items-center min-w-0 flex-1">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="bg-purple-300 p-1.5 sm:p-2 rounded-lg">
                  <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-purple-800" />
                </div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                  Expense Tracker
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="flex items-center space-x-2 bg-pink-100 text-pink-800 px-3 py-2 rounded-lg hover:bg-pink-200 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {formatDate(selectedDate)}
                  </span>
                </button>

                {showCalendar && (
                  <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border p-4 z-10 min-w-[200px]">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setShowCalendar(false);
                      }}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                  </div>
                )}
              </div>

              <span className="text-sm text-gray-700 max-w-[150px] truncate">
                Welcome, {user.email}
              </span>
              <button
                onClick={onLogout}
                className="bg-rose-100 text-rose-700 px-4 py-2 rounded-lg hover:bg-rose-200 transition-colors whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-white py-3 px-3 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="flex items-center space-x-2 bg-pink-100 text-pink-800 px-3 py-2 rounded-lg hover:bg-pink-200 transition-colors flex-1 mr-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium truncate">
                    {formatDate(selectedDate)}
                  </span>
                </button>
                <button
                  onClick={onLogout}
                  className="bg-rose-100 text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-200 transition-colors text-sm"
                >
                  Sign Out
                </button>
              </div>

              {showCalendar && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setShowCalendar(false);
                    }}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
              )}

              <div className="text-xs text-gray-600 truncate">
                Welcome, {user.email}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content with Enhanced Mobile Padding */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Summary Cards - Enhanced Mobile Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-blue-300 rounded-xl p-4 sm:p-6 text-blue-900">
            <p className="text-xs sm:text-sm font-medium">Total Budget</p>
            <p className="text-lg sm:text-2xl font-bold">
              ₱{totalBudget.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-300 rounded-xl p-4 sm:p-6 text-red-900">
            <p className="text-xs sm:text-sm font-medium">Total Spent</p>
            <p className="text-lg sm:text-2xl font-bold">
              ₱{totalSpent.toFixed(2)}
            </p>
          </div>
          <div className="bg-green-300 rounded-xl p-4 sm:p-6 text-green-900 sm:col-span-2 lg:col-span-1">
            <p className="text-xs sm:text-sm font-medium">Remaining</p>
            <p className="text-lg sm:text-2xl font-bold">
              ₱{(totalBudget - totalSpent).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Action Buttons - Mobile-First Design */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => {
              setShowBudgetForm((prev) => !prev);
              setShowExpenseForm(false);
              setEditingBudget(null);
              setMobileMenuOpen(false);
            }}
            className={`${
              showBudgetForm ? "bg-purple-400" : "bg-purple-300"
            } text-purple-900 px-4 sm:px-6 py-3 rounded-lg hover:bg-purple-400 transition-colors font-medium text-sm sm:text-base flex items-center justify-center`}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {showBudgetForm ? "Close Budget" : "Add Budget"}
          </button>
          <button
            onClick={() => {
              setShowExpenseForm((prev) => !prev);
              setShowBudgetForm(false);
              setEditingBudget(null);
              setMobileMenuOpen(false);
            }}
            disabled={Object.keys(budgets).length === 0}
            className={`${
              showExpenseForm ? "bg-pink-400" : "bg-pink-300"
            } text-pink-900 px-4 sm:px-6 py-3 rounded-lg disabled:opacity-50 hover:bg-pink-400 transition-colors font-medium text-sm sm:text-base flex items-center justify-center`}
          >
            <Minus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {showExpenseForm ? "Close Expense" : "Add Expense"}
          </button>
        </div>

        {/* Forms Section - Enhanced Mobile Layout */}
        <div className="space-y-4 mb-6 sm:mb-8">
          {showBudgetForm && (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-purple-200">
              <BudgetForm
                onSubmit={handleAddBudget}
                onCancel={closeMobileActions}
              />
            </div>
          )}
          {editingBudget && (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-purple-200">
              <BudgetForm
                initialData={editingBudget}
                onSubmit={handleEditBudget}
                onCancel={() => setEditingBudget(null)}
              />
            </div>
          )}
          {showExpenseForm && (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-pink-200">
              <ExpenseForm
                budgets={budgets}
                onSubmit={handleAddExpense}
                onCancel={closeMobileActions}
              />
            </div>
          )}
        </div>

        {/* Main Content Grid - Mobile-Optimized */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {/* Budgets Section */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Your Budgets
            </h2>
            {Object.keys(budgets).length === 0 ? (
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
                <p className="text-gray-500 text-center text-sm sm:text-base">
                  No budgets yet. Create one!
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {Object.entries(budgets).map(([id, budget]) => (
                  <div
                    key={id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200"
                  >
                    <BudgetCard
                      budget={budget}
                      onEdit={() => handleEditClick(budget)}
                      onDelete={() => handleDeleteBudget(id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expenses Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <ExpenseList
              expenses={expenses}
              budgets={budgets}
              onDelete={handleDeleteExpense}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Modal for Mobile */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-30 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg max-w-sm w-full border border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">
              Are you sure?
            </h2>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmAction();
                  setModalOpen(false);
                }}
                className="px-4 py-2 bg-red-300 text-red-900 rounded-lg hover:bg-red-400 transition-colors text-sm sm:text-base"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
