import React, { useState, useEffect } from "react";
import { Target, Calculator } from "lucide-react";

const GoalForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    targetDate: "",
    startDate: new Date().toISOString().split("T")[0],
    saved: 0,
  });

  const [suggestedContribution, setSuggestedContribution] = useState(0);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        amount: initialData.amount || "",
        targetDate: initialData.targetDate || "",
        startDate:
          initialData.startDate || new Date().toISOString().split("T")[0],
        saved: initialData.saved || 0,
      });
    }
  }, [initialData]);

  useEffect(() => {
    calculateSuggestedContribution();
  }, [formData.amount, formData.targetDate, formData.saved]);

  const calculateSuggestedContribution = () => {
    if (formData.amount && formData.targetDate) {
      const today = new Date();
      const targetDate = new Date(formData.targetDate);
      const daysRemaining = Math.max(
        Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)),
        1
      );
      const kinsenasRemaining = Math.max(Math.ceil(daysRemaining / 15), 1);
      const remainingAmount = Math.max(
        parseFloat(formData.amount) - parseFloat(formData.saved || 0),
        0
      );
      const suggestion = remainingAmount / kinsenasRemaining;
      setSuggestedContribution(suggestion);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "amount" || name === "saved"
          ? value === ""
            ? ""
            : parseFloat(value)
          : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.amount && formData.targetDate) {
      onSubmit(formData);
      if (!initialData) {
        setFormData({
          name: "",
          amount: "",
          targetDate: "",
          startDate: new Date().toISOString().split("T")[0],
          saved: 0,
        });
      }
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "#74512D" }}
        >
          <Target className="w-6 h-6" style={{ color: "#F8F4E1" }} />
        </div>
        <div>
          <h2
            className="text-xl sm:text-2xl font-bold"
            style={{ color: "#543310" }}
          >
            {initialData ? "Edit Goal" : "Add New Goal"}
          </h2>
          <p className="text-sm" style={{ color: "#74512D" }}>
            Set a savings target and get bi-monthly contribution suggestions
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Goal Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium mb-2"
            style={{ color: "#543310" }}
          >
            Goal Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Laptop Dell XPS 13"
            required
            className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-300"
            style={{
              backgroundColor: "#F8F4E1",
              borderColor: "#AF8F6F",
              color: "#543310",
            }}
          />
        </div>

        {/* Goal Amount and Current Savings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium mb-2"
              style={{ color: "#543310" }}
            >
              Target Amount (₱)
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="42000"
              min="1"
              step="0.01"
              required
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-300"
              style={{
                backgroundColor: "#F8F4E1",
                borderColor: "#AF8F6F",
                color: "#543310",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="saved"
              className="block text-sm font-medium mb-2"
              style={{ color: "#543310" }}
            >
              Already Saved (₱)
            </label>
            <input
              type="number"
              id="saved"
              name="saved"
              value={formData.saved}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-300"
              style={{
                backgroundColor: "#F8F4E1",
                borderColor: "#AF8F6F",
                color: "#543310",
              }}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium mb-2"
              style={{ color: "#543310" }}
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              max={formData.targetDate || undefined}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-300"
              style={{
                backgroundColor: "#F8F4E1",
                borderColor: "#AF8F6F",
                color: "#543310",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="targetDate"
              className="block text-sm font-medium mb-2"
              style={{ color: "#543310" }}
            >
              Target Date
            </label>
            <input
              type="date"
              id="targetDate"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleInputChange}
              min={formData.startDate || today}
              required
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-300"
              style={{
                backgroundColor: "#F8F4E1",
                borderColor: "#AF8F6F",
                color: "#543310",
              }}
            />
          </div>
        </div>

        {/* Suggested Contribution Preview */}
        {formData.amount && formData.targetDate && (
          <div
            className="p-4 rounded-xl border-2"
            style={{ backgroundColor: "#E8DCC0", borderColor: "#AF8F6F" }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Calculator className="w-4 h-4" style={{ color: "#74512D" }} />
              <span
                className="text-sm font-medium"
                style={{ color: "#74512D" }}
              >
                Suggested Kinsenas Contribution
              </span>
            </div>
            <div className="text-lg font-bold" style={{ color: "#543310" }}>
              ₱{suggestedContribution.toFixed(2)} per kinsenas
            </div>
            <p className="text-xs mt-1" style={{ color: "#74512D" }}>
              Based on your timeline and remaining amount
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 rounded-xl font-medium hover:shadow-md transform hover:scale-105 transition-all duration-300"
            style={{
              backgroundColor: "#E8DCC0",
              color: "#543310",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 rounded-xl font-medium hover:shadow-md transform hover:scale-105 transition-all duration-300"
            style={{
              backgroundColor: "#74512D",
              color: "#F8F4E1",
            }}
          >
            {initialData ? "Update Goal" : "Create Goal"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GoalForm;
