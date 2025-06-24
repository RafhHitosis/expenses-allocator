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
} from "lucide-react";

const ExportReport = ({ budgets, expenses, onClose, user }) => {
  const [exportFormat, setExportFormat] = useState("pdf");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [selectedBudgets, setSelectedBudgets] = useState({});
  const [includeOptions, setIncludeOptions] = useState({
    summary: true,
    budgetDetails: true,
    expenseDetails: true,
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

  // Filter and calculate data
  const { filteredData, stats } = useMemo(() => {
    const selectedBudgetIds = Object.keys(selectedBudgets).filter(
      (id) => selectedBudgets[id]
    );

    let filteredBudgets = Object.fromEntries(
      Object.entries(budgets).filter(([id]) => selectedBudgetIds.includes(id))
    );

    let filteredExpenses = Object.fromEntries(
      Object.entries(expenses).filter(([, expense]) =>
        selectedBudgetIds.includes(expense.budgetId)
      )
    );

    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      filteredExpenses = Object.fromEntries(
        Object.entries(filteredExpenses).filter(([, expense]) => {
          const expenseDate = new Date(expense.date);
          return (
            expenseDate >= new Date(dateRange.startDate) &&
            expenseDate <= new Date(dateRange.endDate)
          );
        })
      );
    }

    const budgetValues = Object.values(filteredBudgets);
    const expenseValues = Object.values(filteredExpenses);
    const totalBudget = budgetValues.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = expenseValues.reduce((sum, e) => sum + e.amount, 0);

    return {
      filteredData: { budgets: filteredBudgets, expenses: filteredExpenses },
      stats: {
        totalBudget,
        totalSpent,
        remaining: totalBudget - totalSpent,
        budgetCount: budgetValues.length,
        expenseCount: expenseValues.length,
      },
    };
  }, [budgets, expenses, selectedBudgets, dateRange]);

  const handleBudgetToggle = (budgetId) => {
    setSelectedBudgets((prev) => ({ ...prev, [budgetId]: !prev[budgetId] }));
  };

  const handleSelectAllBudgets = () => {
    const allSelected = Object.keys(budgets).every((id) => selectedBudgets[id]);
    const newSelection = {};
    Object.keys(budgets).forEach((id) => {
      newSelection[id] = !allSelected;
    });
    setSelectedBudgets(newSelection);
  };

  const generateCSVContent = () => {
    const formatCurrency = (amount) => `₱${amount.toFixed(2)}`;
    let csv = "Expense Tracker Report\n\n";

    if (includeOptions.summary) {
      csv += "SUMMARY\n";
      csv += `Report Generated,${new Date().toLocaleString()}\n`;
      csv += `User,${user.email}\n`;
      csv += `Total Budget,${formatCurrency(stats.totalBudget)}\n`;
      csv += `Total Spent,${formatCurrency(stats.totalSpent)}\n`;
      csv += `Remaining,${formatCurrency(stats.remaining)}\n\n`;
    }

    if (includeOptions.budgetDetails) {
      csv += "BUDGET DETAILS\n";
      csv += "Budget Name,Amount,Spent,Remaining\n";
      Object.values(filteredData.budgets).forEach((budget) => {
        csv += `${budget.name},${formatCurrency(
          budget.amount
        )},${formatCurrency(budget.spent)},${formatCurrency(
          budget.amount - budget.spent
        )}\n`;
      });
      csv += "\n";
    }

    if (includeOptions.expenseDetails) {
      csv += "EXPENSE DETAILS\n";
      csv += "Date,Name,Amount,Budget\n";
      Object.values(filteredData.expenses)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach((expense) => {
          const budget = filteredData.budgets[expense.budgetId];
          csv += `${expense.date},"${
            expense.name || "Unnamed"
          }",${formatCurrency(expense.amount)},"${
            budget?.name || "Unknown"
          }"\n`;
        });
    }

    return csv;
  };

  const generatePDF = async () => {
    // Load jsPDF from CDN
    if (!window.jsPDF) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = () => {
        window.jsPDF = window.jspdf.jsPDF;
      };
      document.head.appendChild(script);

      // Wait for script to load
      await new Promise((resolve) => {
        const checkLoaded = () => {
          if (window.jsPDF) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    const doc = new window.jsPDF();
    const formatCurrency = (amount) => `₱${amount.toFixed(2)}`;
    const formatDate = (date) => new Date(date).toLocaleDateString();

    let yPos = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const lineHeight = 6;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace = 20) => {
      if (yPos + requiredSpace > doc.internal.pageSize.height - 20) {
        doc.addPage();
        yPos = 20;
      }
    };

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("EXPENSE REPORT", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 5;
    doc.text(`User: ${user.email}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Summary Section
    if (includeOptions.summary) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("SUMMARY", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      const summaryData = [
        ["Total Budget:", formatCurrency(stats.totalBudget)],
        ["Total Spent:", formatCurrency(stats.totalSpent)],
        ["Remaining:", formatCurrency(stats.remaining)],
        ["Number of Budgets:", stats.budgetCount.toString()],
        ["Number of Expenses:", stats.expenseCount.toString()],
      ];

      summaryData.forEach(([label, value]) => {
        doc.text(label, margin, yPos);
        doc.text(value, margin + 50, yPos);
        yPos += lineHeight;
      });
      yPos += 10;
    }

    // Budget Details Section
    if (
      includeOptions.budgetDetails &&
      Object.keys(filteredData.budgets).length > 0
    ) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("BUDGET DETAILS", margin, yPos);
      yPos += 10;

      // Table headers
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text("Budget Name", margin, yPos);
      doc.text("Amount", margin + 70, yPos);
      doc.text("Spent", margin + 110, yPos);
      doc.text("Remaining", margin + 140, yPos);
      doc.text("Progress", margin + 170, yPos);
      yPos += 8;

      // Draw header line
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += 2;

      doc.setFont(undefined, "normal");
      Object.values(filteredData.budgets).forEach((budget) => {
        checkPageBreak(15);
        const progress =
          budget.amount > 0
            ? ((budget.spent / budget.amount) * 100).toFixed(1)
            : "0.0";

        doc.text(budget.name.substring(0, 25), margin, yPos);
        doc.text(formatCurrency(budget.amount), margin + 70, yPos);
        doc.text(formatCurrency(budget.spent), margin + 110, yPos);
        doc.text(
          formatCurrency(budget.amount - budget.spent),
          margin + 140,
          yPos
        );
        doc.text(`${progress}%`, margin + 170, yPos);
        yPos += lineHeight;
      });
      yPos += 10;
    }

    // Expense Details Section
    if (
      includeOptions.expenseDetails &&
      Object.keys(filteredData.expenses).length > 0
    ) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("EXPENSE DETAILS", margin, yPos);
      yPos += 10;

      // Table headers
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text("Date", margin, yPos);
      doc.text("Expense Name", margin + 30, yPos);
      doc.text("Amount", margin + 100, yPos);
      doc.text("Budget", margin + 140, yPos);
      yPos += 8;

      // Draw header line
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += 2;

      doc.setFont(undefined, "normal");
      Object.values(filteredData.expenses)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach((expense) => {
          checkPageBreak(10);
          const budget = filteredData.budgets[expense.budgetId];

          doc.text(formatDate(expense.date), margin, yPos);
          doc.text(
            (expense.name || "Unnamed").substring(0, 20),
            margin + 30,
            yPos
          );
          doc.text(formatCurrency(expense.amount), margin + 100, yPos);
          doc.text(
            (budget?.name || "Unknown").substring(0, 15),
            margin + 140,
            yPos
          );
          yPos += lineHeight;
        });
      yPos += 10;
    }

    // Recent Timeline Section
    if (
      includeOptions.timeline &&
      Object.keys(filteredData.expenses).length > 0
    ) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("RECENT EXPENSES (Last 10)", margin, yPos);
      yPos += 10;

      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      const recentExpenses = Object.values(filteredData.expenses)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

      recentExpenses.forEach((expense, index) => {
        checkPageBreak(8);
        const budget = filteredData.budgets[expense.budgetId];
        doc.text(
          `${index + 1}. ${formatDate(expense.date)} - ${
            expense.name || "Unnamed"
          } - ${formatCurrency(expense.amount)} (${budget?.name || "Unknown"})`,
          margin,
          yPos
        );
        yPos += lineHeight;
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin,
        doc.internal.pageSize.height - 10,
        { align: "right" }
      );
    }

    return doc;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().split("T")[0];

      if (exportFormat === "csv") {
        const fileName = `${reportName}-${timestamp}.csv`;
        const content = generateCSVContent();
        const blob = new Blob([content], { type: "text/csv" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`Report exported as ${fileName}!`);
      } else {
        // Generate and download PDF
        const fileName = `${reportName}-${timestamp}.pdf`;
        const doc = await generatePDF();
        doc.save(fileName);
        alert(`Report exported as ${fileName}!`);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const selectedCount = Object.values(selectedBudgets).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div
        style={{ backgroundColor: "#F8F4E1" }}
        className="rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-600 text-amber-100 p-3 sm:p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-bold flex items-center">
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Export Report
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 hover:text-amber-900 rounded"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Basic Settings */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-900">
                    Report Name
                  </label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-300 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-900">
                    Format
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {[
                      { value: "pdf", icon: FileText, label: "PDF Report" },
                      {
                        value: "csv",
                        icon: FileSpreadsheet,
                        label: "CSV Data",
                      },
                      // eslint-disable-next-line no-unused-vars
                    ].map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => setExportFormat(value)}
                        className={`p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 ${
                          exportFormat === value
                            ? "border-amber-700 bg-amber-50 shadow-md transform scale-105"
                            : "border-amber-500 hover:border-amber-400 hover:shadow-sm"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 ${
                            exportFormat === value
                              ? "text-amber-600"
                              : "text-amber-800"
                          }`}
                        />
                        <div
                          className={`text-xs sm:text-sm ${
                            exportFormat === value
                              ? "text-amber-600 font-medium"
                              : "text-amber-800"
                          }`}
                        >
                          {label}
                        </div>
                      </button>
                    ))}
                  </div>
                  {exportFormat === "pdf" && (
                    <div className="mt-2 p-2 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200">
                      📄 Exported in PDF format with clean layout and
                      formatting.
                    </div>
                  )}

                  {exportFormat === "csv" && (
                    <div className="mt-2 p-2 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200">
                      📊 Exported in CSV format, suitable for spreadsheets and
                      data analysis.
                    </div>
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div className="border-t pt-3 sm:pt-4">
                <h3 className="font-medium mb-3 flex items-center text-sm sm:text-base">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date Range
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-amber-300 text-sm"
                  />
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-amber-300 text-sm"
                  />
                </div>
                {(dateRange.startDate || dateRange.endDate) && (
                  <button
                    onClick={() => setDateRange({ startDate: "", endDate: "" })}
                    className="text-sm text-amber-600 hover:text-amber-800 mt-2 transition-colors"
                  >
                    Clear dates
                  </button>
                )}
              </div>

              {/* Budget Selection */}
              <div className="border-t pt-3 sm:pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium flex items-center text-sm sm:text-base">
                    <Filter className="w-4 h-4 mr-2" />
                    Budgets ({selectedCount}/{Object.keys(budgets).length})
                  </h3>
                  <button
                    onClick={handleSelectAllBudgets}
                    className="text-xs sm:text-sm text-amber-600 hover:text-amber-800 transition-colors"
                  >
                    {Object.keys(budgets).every((id) => selectedBudgets[id])
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                  {Object.entries(budgets).map(([id, budget]) => (
                    <div
                      key={id}
                      onClick={() => handleBudgetToggle(id)}
                      className="flex items-center p-2 hover:bg-amber-50 rounded cursor-pointer transition-colors"
                    >
                      {selectedBudgets[id] ? (
                        <CheckSquare className="w-4 h-4 mr-2 text-amber-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 mr-2 text-amber-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {budget.name}
                        </div>
                        <div className="text-xs text-amber-500">
                          ₱{budget.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Include Options */}
              <div>
                <h3 className="font-medium mb-3 text-sm sm:text-base">
                  Include in Report
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      key: "summary",
                      label: "Summary Overview",
                      desc: "Total stats and key metrics",
                    },
                    {
                      key: "budgetDetails",
                      label: "Budget Details",
                      desc: "Budget breakdown and analysis",
                    },
                    {
                      key: "expenseDetails",
                      label: "All Expenses",
                      desc: "Complete expense listing",
                    },
                    {
                      key: "timeline",
                      label: "Recent Timeline",
                      desc: "Latest expense activities",
                    },
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      onClick={() =>
                        setIncludeOptions((prev) => ({
                          ...prev,
                          [key]: !prev[key],
                        }))
                      }
                      className="flex items-start p-2 sm:p-3 hover:bg-amber-50 rounded cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                    >
                      {includeOptions[key] ? (
                        <CheckSquare className="w-4 h-4 mr-2 sm:mr-3 text-amber-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 mr-2 sm:mr-3 text-amber-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{label}</div>
                        <div className="text-xs text-amber-500">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Stats */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-50 p-3 sm:p-4 rounded-lg border border-amber-100">
                <h3 className="font-medium mb-3 text-amber-900 text-sm sm:text-base">
                  Report Preview
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center">
                  <div className="bg-amber-50 p-2 sm:p-3 rounded-lg shadow-sm">
                    <div className="text-lg sm:text-2xl font-bold text-amber-600">
                      {selectedCount}
                    </div>
                    <div className="text-xs sm:text-sm text-amber-900">
                      Budgets
                    </div>
                  </div>
                  <div className="bg-amber-50 p-2 sm:p-3 rounded-lg shadow-sm">
                    <div className="text-lg sm:text-2xl font-bold text-amber-600">
                      {stats.expenseCount}
                    </div>
                    <div className="text-xs sm:text-sm text-amber-900">
                      Expenses
                    </div>
                  </div>
                  <div className="bg-amber-50 p-2 sm:p-3 rounded-lg shadow-sm">
                    <div className="text-lg sm:text-2xl font-bold text-amber-600">
                      ₱{stats.totalBudget.toFixed(0)}
                    </div>
                    <div className="text-xs sm:text-sm text-amber-900">
                      Budget
                    </div>
                  </div>
                  <div className="bg-amber-50 p-2 sm:p-3 rounded-lg shadow-sm">
                    <div className="text-lg sm:text-2xl font-bold text-amber-600">
                      ₱{stats.totalSpent.toFixed(0)}
                    </div>
                    <div className="text-xs sm:text-sm text-amber-900">
                      Spent
                    </div>
                  </div>
                </div>

                {selectedCount === 0 && (
                  <div className="mt-3 p-2 sm:p-3 bg-amber-100 text-amber-800 text-xs sm:text-sm rounded border border-amber-200">
                    ⚠️ Please select at least one budget to generate the report
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-amber-50 p-3 sm:p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs sm:text-sm text-amber-600 text-center sm:text-left">
            {stats.expenseCount} expenses from {selectedCount} budgets
            {exportFormat === "pdf" && " • Professional PDF format"}
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={selectedCount === 0 || isExporting}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-800 text-amber-100 rounded-lg hover:from-amber-700 hover:to-amber-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-100 border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportReport;
