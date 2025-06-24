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
    <div className="bg-[#F3E5D8] rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-[#543310] mb-4">
        Add New Expense
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#543310] mb-2">
            Expense Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-[#B8906B] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8906B]"
            placeholder="e.g., Grocery, Gas"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#543310] mb-2">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 border border-[#B8906B] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8906B]"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#543310] mb-2">
            Budget Category
          </label>
          <div className="relative">
            <select
              value={budgetId}
              onChange={(e) => setBudgetId(e.target.value)}
              className="w-full px-4 py-3 border border-[#B8906B] rounded-lg appearance-none bg-transparent text-[#543310] focus:outline-none focus:ring-2 focus:ring-[#B8906B] pr-10"
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
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#543310]">
              ▼
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-[#B8906B] text-white py-3 px-4 rounded-lg whitespace-nowrap hover:bg-[#a97c59]"
          >
            Add Expense
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-[#e2d2c0] text-[#543310] py-3 px-4 rounded-lg whitespace-nowrap hover:bg-[#d4c3b0]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
