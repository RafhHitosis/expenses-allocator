// components/ExportReport.js
import React, { useState, useMemo } from "react";
import {
  Download,
  FileText,
  Calendar,
  Filter,
  CheckSquare,
  Square,
  X,
  FileSpreadsheet,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
} from "lucide-react";

const ExportReport = ({ budgets, expenses, onClose, user }) => {
  const [exportFormat, setExportFormat] = useState("pdf");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [selectedBudgets, setSelectedBudgets] = useState({});
  const [includeOptions, setIncludeOptions] = useState({
    summary: true,
    budgetDetails: true,
    expenseDetails: true,
    charts: false,
    timeline: true,
  });
  const [reportName, setReportName] = useState("expense-report");
  const [isExporting, setIsExporting] = useState(false);

  // Initialize selected budgets
  React.useEffect(() => {
    const initialSelection = {};
    Object.keys(budgets).forEach((id) => {
      initialSelection[id] = true;
    });
    setSelectedBudgets(initialSelection);
  }, [budgets]);

  // Filter expenses based on selected criteria
  const filteredData = useMemo(() => {
    let filteredExpenses = { ...expenses };
    let filteredBudgets = { ...budgets };

    // Filter by selected budgets
    const selectedBudgetIds = Object.keys(selectedBudgets).filter(
      (id) => selectedBudgets[id]
    );
    filteredBudgets = Object.fromEntries(
      Object.entries(budgets).filter(([id]) => selectedBudgetIds.includes(id))
    );

    // Filter expenses by selected budgets
    filteredExpenses = Object.fromEntries(
      Object.entries(expenses).filter(([, expense]) =>
        selectedBudgetIds.includes(expense.budgetId)
      )
    );

    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      filteredExpenses = Object.fromEntries(
        Object.entries(filteredExpenses).filter(([, expense]) => {
          const expenseDate = new Date(expense.date);
          const startDate = new Date(dateRange.startDate);
          const endDate = new Date(dateRange.endDate);
          return expenseDate >= startDate && expenseDate <= endDate;
        })
      );
    }

    return { budgets: filteredBudgets, expenses: filteredExpenses };
  }, [budgets, expenses, selectedBudgets, dateRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const budgetValues = Object.values(filteredData.budgets);
    const expenseValues = Object.values(filteredData.expenses);

    const totalBudget = budgetValues.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = expenseValues.reduce((sum, e) => sum + e.amount, 0);
    const remaining = totalBudget - totalSpent;
    const averageExpense =
      expenseValues.length > 0 ? totalSpent / expenseValues.length : 0;

    return {
      totalBudget,
      totalSpent,
      remaining,
      averageExpense,
      budgetCount: budgetValues.length,
      expenseCount: expenseValues.length,
    };
  }, [filteredData]);

  const handleBudgetToggle = (budgetId) => {
    setSelectedBudgets((prev) => ({
      ...prev,
      [budgetId]: !prev[budgetId],
    }));
  };

  const handleSelectAllBudgets = () => {
    const allSelected = Object.keys(budgets).every((id) => selectedBudgets[id]);
    const newSelection = {};
    Object.keys(budgets).forEach((id) => {
      newSelection[id] = !allSelected;
    });
    setSelectedBudgets(newSelection);
  };

  const handleIncludeToggle = (option) => {
    setIncludeOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const generateFileName = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    const extension = exportFormat === "pdf" ? "html" : "csv";
    return `${reportName}-${timestamp}.${extension}`;
  };

  const generateCSVContent = () => {
    let csvContent = "Expense Tracker Report\n\n";

    // Summary Section
    if (includeOptions.summary) {
      csvContent += "SUMMARY\n";
      csvContent += `Report Generated,${new Date().toLocaleString()}\n`;
      csvContent += `User,${user.email}\n`;
      csvContent += `Total Budgets,${stats.budgetCount}\n`;
      csvContent += `Total Budget Amount,₱${stats.totalBudget.toFixed(2)}\n`;
      csvContent += `Total Spent,₱${stats.totalSpent.toFixed(2)}\n`;
      csvContent += `Remaining,₱${stats.remaining.toFixed(2)}\n`;
      csvContent += `Total Expenses,${stats.expenseCount}\n`;
      csvContent += `Average Expense,₱${stats.averageExpense.toFixed(2)}\n\n`;
    }

    // Budget Details
    if (includeOptions.budgetDetails) {
      csvContent += "BUDGET DETAILS\n";
      csvContent += "Budget Name,Amount,Spent,Remaining,Progress %\n";
      Object.values(filteredData.budgets).forEach((budget) => {
        const progress =
          budget.amount > 0
            ? ((budget.spent / budget.amount) * 100).toFixed(1)
            : 0;
        csvContent += `${budget.name},₱${budget.amount.toFixed(
          2
        )},₱${budget.spent.toFixed(2)},₱${(
          budget.amount - budget.spent
        ).toFixed(2)},${progress}%\n`;
      });
      csvContent += "\n";
    }

    // Expense Details
    if (includeOptions.expenseDetails) {
      csvContent += "EXPENSE DETAILS\n";
      csvContent += "Date,Name,Amount,Budget\n";
      Object.values(filteredData.expenses)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach((expense) => {
          const budget = filteredData.budgets[expense.budgetId];
          const budgetName = budget ? budget.name : "Unknown Budget";
          csvContent += `${expense.date},"${
            expense.name || "Unnamed Expense"
          }",₱${expense.amount.toFixed(2)},"${budgetName}"\n`;
        });
    }

    return csvContent;
  };

  const generateHTMLContent = () => {
    const formatCurrency = (amount) => `₱${amount.toFixed(2)}`;
    const formatDate = (dateString) =>
      new Date(dateString).toLocaleDateString("en-PH");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expense Tracker Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #4f46e5;
            font-size: 1.8rem;
            margin-bottom: 20px;
            border-bottom: 3px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            border: 1px solid #d1d5db;
        }
        .stat-card h3 {
            color: #4f46e5;
            font-size: 1.2rem;
            margin-bottom: 10px;
        }
        .stat-card .value {
            font-size: 2rem;
            font-weight: bold;
            color: #1f2937;
        }
        .budget-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .budget-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 15px;
            padding: 20px;
            transition: transform 0.2s;
        }
        .budget-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .budget-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .budget-name {
            font-size: 1.2rem;
            font-weight: 600;
            color: #1f2937;
        }
        .budget-amount {
            font-size: 1.1rem;
            color: #4f46e5;
            font-weight: bold;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #059669);
            transition: width 0.3s ease;
        }
        .progress-fill.over-budget {
            background: linear-gradient(90deg, #ef4444, #dc2626);
        }
        .expense-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .expense-table th {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        .expense-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e5e7eb;
        }
        .expense-table tr:nth-child(even) {
            background: #f9fafb;
        }
        .expense-table tr:hover {
            background: #f3f4f6;
        }
        .amount {
            font-weight: bold;
            color: #ef4444;
        }
        .footer {
            background: #f9fafb;
            padding: 20px 30px;
            text-align: center;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
        .timeline {
            position: relative;
            padding-left: 30px;
        }
        .timeline::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #4f46e5;
        }
        .timeline-item {
            position: relative;
            margin-bottom: 20px;
            background: white;
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
        }
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -22px;
            top: 20px;
            width: 12px;
            height: 12px;
            background: #4f46e5;
            border-radius: 50%;
            border: 3px solid white;
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Expense Tracker Report</h1>
            <p>Generated on ${new Date().toLocaleString("en-PH")}</p>
            <p>User: ${user.email}</p>
        </div>
        
        <div class="content">
            ${
              includeOptions.summary
                ? `
            <div class="section">
                <h2>📊 Summary Overview</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Total Budget</h3>
                        <div class="value">${formatCurrency(
                          stats.totalBudget
                        )}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Total Spent</h3>
                        <div class="value">${formatCurrency(
                          stats.totalSpent
                        )}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Remaining</h3>
                        <div class="value">${formatCurrency(
                          stats.remaining
                        )}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Total Expenses</h3>
                        <div class="value">${stats.expenseCount}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Budget Categories</h3>
                        <div class="value">${stats.budgetCount}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Average Expense</h3>
                        <div class="value">${formatCurrency(
                          stats.averageExpense
                        )}</div>
                    </div>
                </div>
            </div>
            `
                : ""
            }

            ${
              includeOptions.budgetDetails
                ? `
            <div class="section">
                <h2>💼 Budget Details</h2>
                <div class="budget-grid">
                    ${Object.values(filteredData.budgets)
                      .map((budget) => {
                        const progress =
                          budget.amount > 0
                            ? (budget.spent / budget.amount) * 100
                            : 0;
                        const isOverBudget = progress > 100;
                        return `
                        <div class="budget-card">
                            <div class="budget-header">
                                <div class="budget-name">${budget.name}</div>
                                <div class="budget-amount">${formatCurrency(
                                  budget.amount
                                )}</div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill ${
                                  isOverBudget ? "over-budget" : ""
                                }" 
                                     style="width: ${Math.min(
                                       progress,
                                       100
                                     )}%"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 0.9rem;">
                                <span>Spent: ${formatCurrency(
                                  budget.spent
                                )}</span>
                                <span>Progress: ${progress.toFixed(1)}%</span>
                            </div>
                        </div>`;
                      })
                      .join("")}
                </div>
            </div>
            `
                : ""
            }

            ${
              includeOptions.timeline &&
              Object.values(filteredData.expenses).length > 0
                ? `
            <div class="section">
                <h2>⏰ Expense Timeline</h2>
                <div class="timeline">
                    ${Object.values(filteredData.expenses)
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 10)
                      .map((expense) => {
                        <td>${expense.name || "Unnamed Expense"}</td>;
                        const budget = filteredData.budgets[expense.budgetId];
                        return `
                            <div class="timeline-item">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong>${
                                          expense.name || "Unnamed Expense"
                                        }</strong>
                                        <div style="color: #6b7280; font-size: 0.9rem;">
                                            ${
                                              budget
                                                ? budget.name
                                                : "Unknown Budget"
                                            } • ${formatDate(expense.date)}
                                        </div>
                                    </div>
                                    <div class="amount">${formatCurrency(
                                      expense.amount
                                    )}</div>
                                </div>
                                ${
                                  expense.notes
                                    ? `<div style="margin-top: 5px; color: #6b7280; font-size: 0.9rem;">${expense.notes}</div>`
                                    : ""
                                }
                            </div>`;
                      })
                      .join("")}
                </div>
            </div>
            `
                : ""
            }

            ${
              includeOptions.expenseDetails
                ? `
            <div class="section">
                <h2>📝 Detailed Expenses</h2>
                <table class="expense-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Name</th>
                            <th>Budget</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.values(filteredData.expenses)
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((expense) => {
                            const budget =
                              filteredData.budgets[expense.budgetId];
                            return `
                                <tr>
                                    <td>${formatDate(expense.date)}</td>
                                    <td>${
                                      expense.name || "Unnamed Expense"
                                    }</td>
                                    <td>${
                                      budget ? budget.name : "Unknown Budget"
                                    }</td>
                                    <td class="amount">${formatCurrency(
                                      expense.amount
                                    )}</td>
                                </tr>`;
                          })
                          .join("")}
                    </tbody>
                </table>
            </div>
            `
                : ""
            }
        </div>
        
        <div class="footer">
            <p>📱 Generated by Expense Tracker App • Built with ❤️</p>
            <p>This report contains ${stats.expenseCount} expenses across ${
      stats.budgetCount
    } budget categories</p>
        </div>
    </div>
</body>
</html>`;
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const fileName = generateFileName();
      let content, mimeType;

      if (exportFormat === "csv") {
        content = generateCSVContent();
        mimeType = "text/csv";
      } else {
        content = generateHTMLContent();
        mimeType = "text/html";
      }

      // Create and download the file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success message (you could replace this with a toast notification)
      alert(`Report exported successfully as ${fileName}!`);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const selectedBudgetCount =
    Object.values(selectedBudgets).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 sm:p-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center">
                <Download className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Export Report
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-white hover:bg-opacity-100 rounded-lg transition-colors group"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-pink-600 transition-colors" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-280px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column - Export Settings */}
            <div className="space-y-6">
              {/* Report Name & Format */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-600" />
                  Report Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Name
                    </label>
                    <input
                      type="text"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                      placeholder="expense-report"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Export Format
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <button
                        onClick={() => setExportFormat("pdf")}
                        className={`p-2 sm:p-3 rounded-lg border-2 transition-colors ${
                          exportFormat === "pdf"
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" />
                        <div className="text-xs sm:text-sm font-medium">
                          HTML/PDF
                        </div>
                      </button>
                      <button
                        onClick={() => setExportFormat("csv")}
                        className={`p-2 sm:p-3 rounded-lg border-2 transition-colors ${
                          exportFormat === "csv"
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" />
                        <div className="text-xs sm:text-sm font-medium">
                          CSV
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Date Range Filter
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>

                {(dateRange.startDate || dateRange.endDate) && (
                  <button
                    onClick={() => setDateRange({ startDate: "", endDate: "" })}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear date filter
                  </button>
                )}
              </div>

              {/* Budget Selection */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                  <h3 className="font-semibold text-gray-900 flex items-center text-sm sm:text-base">
                    <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
                    Budget Selection ({selectedBudgetCount}/
                    {Object.keys(budgets).length})
                  </h3>
                  <button
                    onClick={handleSelectAllBudgets}
                    className="text-xs sm:text-sm text-green-600 hover:text-green-800 underline flex items-center self-start sm:self-auto"
                  >
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    {Object.keys(budgets).every((id) => selectedBudgets[id])
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {Object.entries(budgets).map(([id, budget]) => (
                    <div
                      key={id}
                      onClick={() => handleBudgetToggle(id)}
                      className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="mr-2 sm:mr-3 text-green-600 flex-shrink-0">
                          {selectedBudgets[id] ? (
                            <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {budget.name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">
                            ₱{budget.amount.toFixed(2)} • Spent: ₱
                            {budget.spent.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Content Options & Preview */}
            <div className="space-y-6">
              {/* Include Options */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-pink-600" />
                  Include in Report
                </h3>

                <div className="space-y-3">
                  {[
                    {
                      key: "summary",
                      label: "Summary Overview",
                      icon: TrendingUp,
                      desc: "Total budgets, expenses, and key metrics",
                    },
                    {
                      key: "budgetDetails",
                      label: "Budget Details",
                      icon: DollarSign,
                      desc: "Individual budget breakdowns and progress",
                    },
                    {
                      key: "expenseDetails",
                      label: "Expense Details",
                      icon: FileText,
                      desc: "Complete list of all expenses",
                    },
                    {
                      key: "timeline",
                      label: "Recent Timeline",
                      icon: Clock,
                      desc: "Latest 10 expenses in chronological order",
                    },
                    // eslint-disable-next-line no-unused-vars
                  ].map(({ key, label, icon: Icon, desc }) => (
                    <div
                      key={key}
                      onClick={() => handleIncludeToggle(key)}
                      className="flex items-start justify-between p-2 sm:p-3 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-start min-w-0 flex-1">
                        <div className="mr-2 sm:mr-3 text-pink-600 flex-shrink-0">
                          {includeOptions[key] ? (
                            <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center">
                            <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-600 flex-shrink-0" />
                            <span className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {label}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                            {desc}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Stats */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Report Preview
                </h3>

                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="text-center p-2">
                    <div className="text-lg sm:text-2xl font-bold text-blue-600">
                      {selectedBudgetCount}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      Budgets Selected
                    </div>
                  </div>
                  <div className="text-center p-2">
                    <div className="text-lg sm:text-2xl font-bold text-green-600">
                      {stats.expenseCount}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      Expenses Found
                    </div>
                  </div>
                  <div className="text-center p-2">
                    <div className="text-lg sm:text-2xl font-bold text-purple-600">
                      ₱{stats.totalBudget.toFixed(0)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      Total Budget
                    </div>
                  </div>
                  <div className="text-center p-2">
                    <div className="text-lg sm:text-2xl font-bold text-red-600">
                      ₱{stats.totalSpent.toFixed(0)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      Total Spent
                    </div>
                  </div>
                </div>

                {/* Date Range Info */}
                {(dateRange.startDate || dateRange.endDate) && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      Date Range Applied:
                    </div>
                    <div className="text-sm text-gray-600">
                      {dateRange.startDate && dateRange.endDate
                        ? `${new Date(
                            dateRange.startDate
                          ).toLocaleDateString()} - ${new Date(
                            dateRange.endDate
                          ).toLocaleDateString()}`
                        : dateRange.startDate
                        ? `From ${new Date(
                            dateRange.startDate
                          ).toLocaleDateString()}`
                        : `Until ${new Date(
                            dateRange.endDate
                          ).toLocaleDateString()}`}
                    </div>
                  </div>
                )}

                {/* No Data Warning */}
                {(selectedBudgetCount === 0 || stats.expenseCount === 0) && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm text-yellow-800">
                      ⚠️{" "}
                      {selectedBudgetCount === 0
                        ? "No budgets selected. Please select at least one budget to export."
                        : "No expenses found with current filters. Consider adjusting your date range or budget selection."}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Quick Presets
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const today = new Date();
                      const firstDay = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        1
                      );
                      setDateRange({
                        startDate: firstDay.toISOString().split("T")[0],
                        endDate: today.toISOString().split("T")[0],
                      });
                    }}
                    className="p-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const lastMonth = new Date(
                        today.getFullYear(),
                        today.getMonth() - 1,
                        1
                      );
                      const lastMonthEnd = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        0
                      );
                      setDateRange({
                        startDate: lastMonth.toISOString().split("T")[0],
                        endDate: lastMonthEnd.toISOString().split("T")[0],
                      });
                    }}
                    className="p-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Last Month
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const lastWeek = new Date(
                        today.getTime() - 7 * 24 * 60 * 60 * 1000
                      );
                      setDateRange({
                        startDate: lastWeek.toISOString().split("T")[0],
                        endDate: today.toISOString().split("T")[0],
                      });
                    }}
                    className="p-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => {
                      setDateRange({ startDate: "", endDate: "" });
                      const allSelected = {};
                      Object.keys(budgets).forEach((id) => {
                        allSelected[id] = true;
                      });
                      setSelectedBudgets(allSelected);
                    }}
                    className="p-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Export Button */}
        <div className="bg-gray-50 p-3 sm:p-6 border-t border-gray-200">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Ready to export {stats.expenseCount} expenses from{" "}
              {selectedBudgetCount} budget{selectedBudgetCount !== 1 ? "s" : ""}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={selectedBudgetCount === 0 || isExporting}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
              >
                {isExporting ? (
                  <>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Export Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportReport;
