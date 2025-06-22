// components/BudgetForm.js
import React, { useState } from "react";

const BudgetForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [amount, setAmount] = useState(initialData?.amount || "");

  const handleSubmit = () => {
    if (!name.trim() || !amount) return;
    onSubmit({
      name,
      amount: parseFloat(amount),
      spent: initialData?.spent || 0,
    });
    setName("");
    setAmount("");
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {initialData ? "Edit Budget" : "Add New Budget"}
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            placeholder="e.g., Food, Transportation"
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

        <div className="flex space-x-3">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700"
          >
            {initialData ? "Update" : "Add"} Budget
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

export default BudgetForm;
