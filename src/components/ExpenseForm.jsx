// components/ExpenseForm.js
import React, { useState } from "react";

const ExpenseForm = ({ budgets, onSubmit, onCancel }) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [budgetId, setBudgetId] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !amount || !budgetId) return;
    onSubmit({
      name,
      amount: parseFloat(amount),
      budgetId,
      date: new Date().toISOString().split("T")[0],
    });
    setName("");
    setAmount("");
    setBudgetId("");
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Add New Expense
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expense Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            placeholder="e.g., Grocery, Gas"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Category
          </label>
          <select
            value={budgetId}
            onChange={(e) => setBudgetId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            required
          >
            <option value="">Select a budget</option>
            {Object.entries(budgets).map(([id, budget]) => (
              <option key={id} value={id}>
                {budget.name} (${(budget.amount - budget.spent).toFixed(2)}{" "}
                remaining)
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700"
          >
            Add Expense
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
