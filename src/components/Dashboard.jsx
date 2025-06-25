// components/Dashboard.js
import React, { useEffect, useState, useRef } from "react";
import {
  Plus,
  Minus,
  Calendar,
  Menu,
  X,
  Download,
  Clock,
  FileText,
} from "lucide-react";
import BudgetCard from "./BudgetCard";
import BudgetForm from "./BudgetForm";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import ExportReport from "./ExportReport";
import { database } from "../firebase";
import { ref, onValue, push, set, remove, get } from "firebase/database";

const Dashboard = ({ user, onLogout }) => {
  const [budgets, setBudgets] = useState({});
  const [expenses, setExpenses] = useState({});
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showExportReport, setShowExportReport] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(() => () => {});
  const [modalTitle, setModalTitle] = useState("Are you sure?");
  const [modalMessage, setModalMessage] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFABMenu, setShowFABMenu] = useState(false);

  // Refs for auto-scroll
  const budgetFormRef = useRef(null);
  const expenseFormRef = useRef(null);

  // Auto-scroll function
  const scrollToElement = (elementRef) => {
    if (elementRef.current) {
      elementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  };

  // Update current date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const openConfirmModal = (action, title = "Are you sure?", message = "") => {
    setConfirmAction(() => action);
    setModalTitle(title);
    setModalMessage(message);
    setModalOpen(true);
  };

  const handleSignOut = () => {
    openConfirmModal(
      () => onLogout(),
      "Sign Out",
      "Are you sure you want to sign out?"
    );
  };

  const handleAddBudget = async (budgetData) => {
    const newRef = push(ref(database, `budgets/${user.uid}`));
    await set(newRef, { ...budgetData, id: newRef.key });
    setShowBudgetForm(false);
    setShowFABMenu(false);
  };

  const handleEditBudget = async (budgetData) => {
    await set(ref(database, `budgets/${user.uid}/${editingBudget.id}`), {
      ...budgetData,
      id: editingBudget.id,
    });
    setEditingBudget(null);
  };

  const handleDeleteBudget = (budgetId) => {
    openConfirmModal(
      async () => {
        await remove(ref(database, `budgets/${user.uid}/${budgetId}`));
      },
      "Delete Budget",
      "This action cannot be undone."
    );
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
    setShowFABMenu(false);
  };

  const handleDeleteExpense = (expenseId) => {
    const expense = expenses[expenseId];
    if (!expense) return;
    openConfirmModal(
      async () => {
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
      },
      "Delete Expense",
      "This action cannot be undone."
    );
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
    setShowFABMenu(false);
    // Auto-scroll to budget form after a small delay
    setTimeout(() => scrollToElement(budgetFormRef), 100);
  };

  const handleBudgetFormToggle = () => {
    setShowBudgetForm((prev) => !prev);
    setShowExpenseForm(false);
    setEditingBudget(null);
    setShowFABMenu(false);
    // Auto-scroll to budget form after a small delay
    if (!showBudgetForm) {
      setTimeout(() => scrollToElement(budgetFormRef), 100);
    }
  };

  const handleExpenseFormToggle = () => {
    setShowExpenseForm((prev) => !prev);
    setShowBudgetForm(false);
    setEditingBudget(null);
    setShowFABMenu(false);
    // Auto-scroll to expense form after a small delay
    if (!showExpenseForm) {
      setTimeout(() => scrollToElement(expenseFormRef), 100);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-PH", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateTime = (date) => {
    return `${formatDate(date)} | ${formatTime(date)}`;
  };

  const formatMobileDate = (date) => {
    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
  };

  const formatMobileTime = (date) => {
    return date.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const closeMobileActions = () => {
    setShowBudgetForm(false);
    setShowExpenseForm(false);
    setEditingBudget(null);
    setMobileMenuOpen(false);
    setShowFABMenu(false);
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "white" }}>
      {/* Enhanced Header with Mobile Optimization and Brown Theme */}
      <header
        className="shadow-lg border-b sticky top-0 z-40 transition-all duration-300"
        style={{
          backgroundColor: "#F8F4E1",
          borderBottomColor: "#AF8F6F",
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Logo Section - Enhanced with Animation */}
            <div className="flex items-center min-w-0 flex-1">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div
                  className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-xl shadow-md transform hover:scale-105 transition-all duration-300 flex-shrink-0"
                  style={{ backgroundColor: "#74512D" }}
                >
                  <span
                    className="text-xl sm:text-3xl font-semibold"
                    style={{ color: "#F8F4E1" }}
                  >
                    ₱
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h1
                    className="text-base sm:text-2xl font-bold truncate"
                    style={{ color: "#543310" }}
                  >
                    Expense Tracker
                  </h1>
                  {/* Mobile Date and Time - Always Visible */}
                  <div className="lg:hidden flex items-center space-x-1 mt-0.5">
                    <Clock className="w-3 h-3" style={{ color: "#74512D" }} />
                    <span
                      className="text-xs font-medium"
                      style={{ color: "#74512D" }}
                    >
                      {formatMobileDate(currentDateTime)} •{" "}
                      {formatMobileTime(currentDateTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Combined Date and Time Display */}
              <div
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl shadow-sm transform hover:scale-105 transition-all duration-300"
                style={{
                  backgroundColor: "#E8DCC0",
                  color: "#543310",
                }}
              >
                <span className="text-sm font-medium">
                  {formatDateTime(currentDateTime)}
                </span>
              </div>

              {/* Export Button */}
              <button
                onClick={() => setShowExportReport(true)}
                disabled={Object.keys(budgets).length === 0}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "#AF8F6F",
                  color: "#F8F4E1",
                }}
                title="Export Report"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </button>

              <span
                className="text-sm max-w-[150px] truncate px-3 py-2 rounded-lg"
                style={{
                  color: "#543310",
                  backgroundColor: "#E8DCC0",
                }}
              >
                Welcome, {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-300 whitespace-nowrap"
                style={{
                  backgroundColor: "#B8906B",
                  color: "#543310",
                }}
              >
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 sm:p-3 rounded-xl shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-300 flex-shrink-0"
                style={{
                  backgroundColor: "#AF8F6F",
                  color: "#F8F4E1",
                }}
              >
                {mobileMenuOpen ? (
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu - Enhanced */}
          {mobileMenuOpen && (
            <div
              className="lg:hidden border-t py-4 px-3 space-y-4 animate-slide-down"
              style={{
                backgroundColor: "#F8F4E1",
                borderTopColor: "#AF8F6F",
              }}
            >
              {/* User Info */}
              <div
                className="text-sm truncate px-3 py-2 rounded-lg text-center"
                style={{
                  color: "#543310",
                  backgroundColor: "#E8DCC0",
                }}
              >
                Welcome, {user.email}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowExportReport(true);
                    setMobileMenuOpen(false);
                  }}
                  disabled={Object.keys(budgets).length === 0}
                  className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl hover:shadow-md transition-all duration-300 disabled:opacity-50"
                  style={{
                    backgroundColor: "#AF8F6F",
                    color: "#F8F4E1",
                  }}
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export Report</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-3 rounded-xl hover:shadow-md transition-all duration-300 text-sm font-medium"
                  style={{
                    backgroundColor: "#B8906B",
                    color: "#543310",
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content with Enhanced Mobile Padding */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-10 pb-24 lg:pb-10">
        {/* Summary Cards - Enhanced with Brown Theme and Animations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10">
          <div
            className="rounded-2xl p-6 sm:p-8 shadow-lg transform hover:scale-105 transition-all duration-300"
            style={{
              backgroundColor: "#D4C4A8",
              color: "#543310",
            }}
          >
            <p className="text-sm sm:text-base font-medium opacity-80 mb-2">
              Total Budget
            </p>
            <p className="text-2xl sm:text-3xl font-bold">
              ₱{totalBudget.toFixed(2)}
            </p>
          </div>
          <div
            className="rounded-2xl p-6 sm:p-8 shadow-lg transform hover:scale-105 transition-all duration-300"
            style={{
              backgroundColor: "#B8906B",
              color: "#543310",
            }}
          >
            <p className="text-sm sm:text-base font-medium opacity-80 mb-2">
              Total Spent
            </p>
            <p className="text-2xl sm:text-3xl font-bold">
              ₱{totalSpent.toFixed(2)}
            </p>
          </div>
          <div
            className="rounded-2xl p-6 sm:p-8 shadow-lg transform hover:scale-105 transition-all duration-300 sm:col-span-2 lg:col-span-1"
            style={{
              backgroundColor: "#AF8F6F",
              color: "#F8F4E1",
            }}
          >
            <p className="text-sm sm:text-base font-medium opacity-90 mb-2">
              Remaining
            </p>
            <p className="text-2xl sm:text-3xl font-bold">
              ₱{(totalBudget - totalSpent).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Desktop Action Buttons - Only show on desktop */}
        <div className="hidden lg:flex flex-row gap-6 mb-8">
          <button
            onClick={handleBudgetFormToggle}
            className={`px-8 py-4 rounded-2xl font-semibold text-base flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
              showBudgetForm ? "scale-105 shadow-xl" : ""
            }`}
            style={{
              backgroundColor: showBudgetForm ? "#74512D" : "#AF8F6F",
              color: "#F8F4E1",
            }}
          >
            <Plus className="w-6 h-6 mr-3" />
            {showBudgetForm ? "Close Budget Form" : "Add New Budget"}
          </button>
          <button
            onClick={handleExpenseFormToggle}
            disabled={Object.keys(budgets).length === 0}
            className={`px-8 py-4 rounded-2xl font-semibold text-base flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              showExpenseForm ? "scale-105 shadow-xl" : ""
            }`}
            style={{
              backgroundColor: showExpenseForm ? "#74512D" : "#B8906B",
              color: showExpenseForm ? "#F8F4E1" : "#543310",
            }}
          >
            <Minus className="w-6 h-6 mr-3" />
            {showExpenseForm ? "Close Expense Form" : "Add New Expense"}
          </button>
        </div>

        {/* Forms Section - Enhanced with Smooth Animations */}
        <div className="space-y-6 mb-8 sm:mb-10">
          {showBudgetForm && (
            <div
              ref={budgetFormRef}
              className="p-6 sm:p-8 rounded-2xl shadow-xl border-2 animate-slide-down"
              style={{
                backgroundColor: "#F8F4E1",
                borderColor: "#AF8F6F",
              }}
            >
              <BudgetForm
                onSubmit={handleAddBudget}
                onCancel={closeMobileActions}
              />
            </div>
          )}
          {editingBudget && (
            <div
              ref={budgetFormRef}
              className="p-6 sm:p-8 rounded-2xl shadow-xl border-2 animate-slide-down"
              style={{
                backgroundColor: "#F8F4E1",
                borderColor: "#74512D",
              }}
            >
              <BudgetForm
                initialData={editingBudget}
                onSubmit={handleEditBudget}
                onCancel={() => setEditingBudget(null)}
              />
            </div>
          )}
          {showExpenseForm && (
            <div
              ref={expenseFormRef}
              className="p-6 sm:p-8 rounded-2xl shadow-xl border-2 animate-slide-down"
              style={{
                backgroundColor: "#F8F4E1",
                borderColor: "#B8906B",
              }}
            >
              <ExpenseForm
                budgets={budgets}
                onSubmit={handleAddExpense}
                onCancel={closeMobileActions}
              />
            </div>
          )}
        </div>

        {/* Main Content Grid - Enhanced Mobile Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-10">
          {/* Budgets Section */}
          <div className="space-y-6">
            <h2
              className="text-xl sm:text-2xl font-bold"
              style={{ color: "#543310" }}
            >
              Your Budgets
            </h2>
            {Object.keys(budgets).length === 0 ? (
              <div
                className="p-8 sm:p-12 rounded-2xl shadow-lg text-center"
                style={{
                  backgroundColor: "#F8F4E1",
                  border: `2px dashed #AF8F6F`,
                }}
              >
                <p
                  className="text-base sm:text-lg font-medium"
                  style={{ color: "#74512D" }}
                >
                  No budgets yet. Create your first one!
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {Object.entries(budgets).map(([id, budget], index) => (
                  <div
                    key={id}
                    className="rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-fade-in"
                    style={{
                      backgroundColor: "#F8F4E1",
                      animationDelay: `${index * 100}ms`,
                    }}
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

          {/* Expenses Section - Reduced padding for mobile */}
          <div
            className="rounded-2xl shadow-lg p-1 sm:p-6 md:p-8"
            style={{ backgroundColor: "#F8F4E1" }}
          >
            <ExpenseList
              expenses={expenses}
              budgets={budgets}
              onDelete={handleDeleteExpense}
            />
          </div>
        </div>
      </div>

      {/* Mobile FAB (Floating Action Button) - Only show on mobile */}
      <div className="lg:hidden">
        {/* FAB Menu Background Overlay */}
        {showFABMenu && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40 animate-fade-in"
            onClick={() => setShowFABMenu(false)}
          />
        )}

        {/* FAB Menu Items */}
        {showFABMenu && (
          <div className="fixed bottom-24 right-4 z-50 space-y-3 animate-slide-up">
            {/* Export Report FAB */}
            <div className="flex items-center space-x-3">
              <div
                className="px-3 py-2 rounded-full shadow-lg"
                style={{
                  backgroundColor: "#F8F4E1",
                  color: "#543310",
                }}
              >
                <span className="text-sm font-medium whitespace-nowrap">
                  Export Report
                </span>
              </div>
              <button
                onClick={() => {
                  setShowExportReport(true);
                  setShowFABMenu(false);
                }}
                disabled={Object.keys(budgets).length === 0}
                className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-all duration-300 disabled:opacity-50"
                style={{
                  backgroundColor: "#D4C4A8",
                  color: "#543310",
                }}
              >
                <FileText className="w-5 h-5" />
              </button>
            </div>

            {/* Add Expense FAB */}
            <div className="flex items-center space-x-3">
              <div
                className="px-3 py-2 rounded-full shadow-lg"
                style={{
                  backgroundColor: "#F8F4E1",
                  color: "#543310",
                }}
              >
                <span className="text-sm font-medium whitespace-nowrap">
                  Add Expense
                </span>
              </div>
              <button
                onClick={handleExpenseFormToggle}
                disabled={Object.keys(budgets).length === 0}
                className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-all duration-300 disabled:opacity-50"
                style={{
                  backgroundColor: "#B8906B",
                  color: "#F8F4E1",
                }}
              >
                <Minus className="w-5 h-5" />
              </button>
            </div>

            {/* Add Budget FAB */}
            <div className="flex items-center space-x-3">
              <div
                className="px-3 py-2 rounded-full shadow-lg"
                style={{
                  backgroundColor: "#F8F4E1",
                  color: "#543310",
                }}
              >
                <span className="text-sm font-medium whitespace-nowrap">
                  Add Budget
                </span>
              </div>
              <button
                onClick={handleBudgetFormToggle}
                className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-all duration-300"
                style={{
                  backgroundColor: "#AF8F6F",
                  color: "#F8F4E1",
                }}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={() => setShowFABMenu(!showFABMenu)}
          className={`fixed bottom-6 right-4 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 transform transition-all duration-300 ${
            showFABMenu ? "rotate-45 scale-110" : "hover:scale-110"
          }`}
          style={{
            backgroundColor: showFABMenu ? "#74512D" : "#AF8F6F",
            color: "#F8F4E1",
          }}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Export Report Modal */}
      {showExportReport && (
        <ExportReport
          budgets={budgets}
          expenses={expenses}
          user={user}
          onClose={() => setShowExportReport(false)}
        />
      )}

      {/* Enhanced Modal with Traditional Background */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70 p-4 animate-fade-in">
          <div
            className="p-6 sm:p-8 rounded-2xl shadow-2xl max-w-sm w-full border-2 transform scale-100 animate-scale-in"
            style={{
              backgroundColor: "#F8F4E1",
              borderColor: "#AF8F6F",
            }}
          >
            <h2
              className="text-lg sm:text-xl font-bold mb-3"
              style={{ color: "#543310" }}
            >
              {modalTitle}
            </h2>
            {modalMessage && (
              <p className="text-sm mb-6" style={{ color: "#74512D" }}>
                {modalMessage}
              </p>
            )}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-3 rounded-xl font-medium hover:shadow-md transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                style={{
                  backgroundColor: "#E8DCC0",
                  color: "#543310",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmAction();
                  setModalOpen(false);
                }}
                className="px-6 py-3 rounded-xl font-medium hover:shadow-md transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                style={{
                  backgroundColor: "#B8906B",
                  color: "#543310",
                }}
              >
                {modalTitle === "Sign Out" ? "Sign Out" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom CSS for Animations */}
      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }

        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }

        /* FAB ripple effect */
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }

        .fab-ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          transform: scale(0);
          animation: ripple 0.6s ease-out;
        }

        /* Hide scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: #af8f6f;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #74512d;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
