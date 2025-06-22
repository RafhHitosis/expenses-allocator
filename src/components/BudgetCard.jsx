// components/BudgetCard.js
import React, { useEffect, useState } from "react";
import { Edit3, Trash2 } from "lucide-react";

const BudgetCard = ({ budget, onEdit, onDelete, onExpenseDeduct }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const percentage = (budget.spent / budget.amount) * 100;
  const remaining = budget.amount - budget.spent;

  useEffect(() => {
    if (onExpenseDeduct) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
  }, [budget.spent]);

  return (
    <div
      className={`bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500 transition-all duration-300 ${
        isAnimating ? "scale-105 shadow-xl" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
          <p className="text-sm text-gray-500">Budget</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(budget)}
            className="p-2 text-gray-400 hover:text-indigo-600"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="p-2 text-gray-400 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-2xl font-bold text-gray-900">
            ${remaining.toFixed(2)}
          </span>
          <span className="text-sm text-gray-500">
            of ${budget.amount.toFixed(2)}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              percentage > 90
                ? "bg-red-500"
                : percentage > 70
                ? "bg-yellow-500"
                : "bg-green-500"
            } ${isAnimating ? "animate-pulse" : ""}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Spent: ${budget.spent.toFixed(2)}
          </span>
          <span
            className={`font-medium ${
              percentage > 90 ? "text-red-600" : "text-green-600"
            }`}
          >
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default BudgetCard;
