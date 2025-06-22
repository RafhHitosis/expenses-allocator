// components/Dashboard.js
import React, { useEffect, useState } from "react";
import { Plus, Minus, DollarSign } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  Expense Tracker
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 hidden sm:block">
                Welcome, {user.email}
              </span>
              <button
                onClick={onLogout}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-600 rounded-xl p-6 text-white">
            <p className="text-sm">Total Budget</p>
            <p className="text-2xl font-bold">${totalBudget.toFixed(2)}</p>
          </div>
          <div className="bg-red-600 rounded-xl p-6 text-white">
            <p className="text-sm">Total Spent</p>
            <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
          </div>
          <div className="bg-green-600 rounded-xl p-6 text-white">
            <p className="text-sm">Remaining</p>
            <p className="text-2xl font-bold">
              ${(totalBudget - totalSpent).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <button
            onClick={() => {
              setShowBudgetForm((prev) => !prev);
              setShowExpenseForm(false);
              setEditingBudget(null);
            }}
            className={`${
              showBudgetForm ? "bg-indigo-800" : "bg-indigo-600"
            } text-white px-6 py-3 rounded-lg`}
          >
            <Plus className="inline w-5 h-5 mr-2" />{" "}
            {showBudgetForm ? "Close Budget" : "Add Budget"}
          </button>
          <button
            onClick={() => {
              setShowExpenseForm((prev) => !prev);
              setShowBudgetForm(false);
              setEditingBudget(null);
            }}
            disabled={Object.keys(budgets).length === 0}
            className={`${
              showExpenseForm ? "bg-red-800" : "bg-red-600"
            } text-white px-6 py-3 rounded-lg disabled:opacity-50`}
          >
            <Minus className="inline w-5 h-5 mr-2" />{" "}
            {showExpenseForm ? "Close Expense" : "Add Expense"}
          </button>
        </div>

        <div className="space-y-4 mb-8">
          {showBudgetForm && (
            <BudgetForm
              onSubmit={handleAddBudget}
              onCancel={() => setShowBudgetForm(false)}
            />
          )}
          {editingBudget && (
            <BudgetForm
              initialData={editingBudget}
              onSubmit={handleEditBudget}
              onCancel={() => setEditingBudget(null)}
            />
          )}
          {showExpenseForm && (
            <ExpenseForm
              budgets={budgets}
              onSubmit={handleAddExpense}
              onCancel={() => setShowExpenseForm(false)}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Budgets
            </h2>
            {Object.keys(budgets).length === 0 ? (
              <p className="text-gray-500">No budgets yet. Create one!</p>
            ) : (
              Object.entries(budgets).map(([id, budget]) => (
                <BudgetCard
                  key={id}
                  budget={budget}
                  onEdit={() => handleEditClick(budget)}
                  onDelete={() => handleDeleteBudget(id)}
                />
              ))
            )}
          </div>

          <ExpenseList
            expenses={expenses}
            budgets={budgets}
            onDelete={handleDeleteExpense}
          />
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Are you sure?</h2>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmAction();
                  setModalOpen(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded"
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
