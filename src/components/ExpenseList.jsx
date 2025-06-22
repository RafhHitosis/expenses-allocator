// components/ExpenseList.js
import React from "react";
import { Minus, Trash2 } from "lucide-react";

const ExpenseList = ({ expenses, budgets, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Expenses
      </h3>
      <div className="space-y-3">
        {Object.entries(expenses).length === 0 ? (
          <p className="text-gray-500 text-center py-8">No expenses yet</p>
        ) : (
          Object.entries(expenses).map(([id, expense]) => (
            <div
              key={id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <Minus className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {expense.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {budgets[expense.budgetId]?.name} • {expense.date}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-red-600">
                  -${expense.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => onDelete(id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExpenseList;
