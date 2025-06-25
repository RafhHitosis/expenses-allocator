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
    // Use PHP symbol as fallback for peso
    const formatCurrency = (amount) => `PHP ${amount.toFixed(2)}`;
    const formatDate = (date) => new Date(date).toLocaleDateString();

    // Modern color palette - Professional browns
    const colors = {
      primary: [101, 67, 33], // Dark brown
      secondary: [139, 69, 19], // Saddle brown
      accent: [160, 82, 45], // Sienna
      light: [250, 245, 240], // Light cream
      text: [62, 39, 35], // Very dark brown
      background: [248, 248, 248], // Light gray
      border: [180, 140, 100], // Light brown border
    };

    let yPos = 30;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - margin * 2;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace = 30) => {
      if (yPos + requiredSpace > doc.internal.pageSize.height - 35) {
        doc.addPage();
        yPos = 30;
        return true;
      }
      return false;
    };

    // Helper function to draw a clean box with better borders
    const drawBox = (
      x,
      y,
      width,
      height,
      fillColor,
      borderColor,
      borderWidth = 0.3
    ) => {
      doc.setFillColor(...fillColor);
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(borderWidth);
      doc.rect(x, y, width, height, "FD");
    };

    // Header with improved design
    drawBox(margin, yPos, contentWidth, 32, colors.primary, colors.primary);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("times", "bold");
    doc.text("EXPENSE REPORT", pageWidth / 2, yPos + 12, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("times", "normal");
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Manila",
    });
    doc.text(`Generated: ${currentDate}`, pageWidth / 2, yPos + 20, {
      align: "center",
    });
    doc.text(`User: ${user.email}`, pageWidth / 2, yPos + 26, {
      align: "center",
    });
    yPos += 42;

    // Summary Section with fixed alignment
    if (includeOptions.summary) {
      checkPageBreak(70);

      // Section header
      doc.setTextColor(...colors.primary);
      doc.setFontSize(16);
      doc.setFont("times", "bold");
      doc.text("FINANCIAL SUMMARY", margin, yPos);
      yPos += 18;

      // Calculate card dimensions for proper alignment
      const totalCards = 3;
      const cardSpacing = 8;
      const totalSpacing = cardSpacing * (totalCards - 1);
      const cardWidth = (contentWidth - totalSpacing) / totalCards;
      const cardHeight = 28;

      const summaryCards = [
        {
          label: "Total Budget",
          value: formatCurrency(stats.totalBudget),
          color: [34, 139, 34], // Green
        },
        {
          label: "Total Spent",
          value: formatCurrency(stats.totalSpent),
          color: [220, 20, 60], // Red
        },
        {
          label: "Remaining",
          value: formatCurrency(stats.remaining),
          color: stats.remaining >= 0 ? [34, 139, 34] : [220, 20, 60],
        },
      ];

      // Draw cards with perfect alignment
      summaryCards.forEach((card, index) => {
        const x = margin + index * (cardWidth + cardSpacing);

        // Card background with subtle border
        drawBox(
          x,
          yPos,
          cardWidth,
          cardHeight,
          colors.background,
          colors.border,
          0.5
        );

        // Card label
        doc.setTextColor(...colors.text);
        doc.setFontSize(9);
        doc.setFont("times", "normal");
        const labelY = yPos + 10;
        doc.text(card.label, x + cardWidth / 2, labelY, { align: "center" });

        // Card value - properly centered
        doc.setTextColor(...card.color);
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        const valueY = yPos + 20;
        doc.text(card.value, x + cardWidth / 2, valueY, { align: "center" });
      });

      yPos += cardHeight + 15;

      // Additional stats bar
      drawBox(margin, yPos, contentWidth, 12, colors.light, colors.border);
      doc.setTextColor(...colors.text);
      doc.setFontSize(10);
      doc.setFont("times", "normal");
      doc.text(
        `Report includes ${stats.budgetCount} budgets and ${stats.expenseCount} transactions`,
        margin + 8,
        yPos + 8
      );
      yPos += 22;
    }

    // Budget Details Section with improved table
    if (
      includeOptions.budgetDetails &&
      Object.keys(filteredData.budgets).length > 0
    ) {
      checkPageBreak(55);

      doc.setTextColor(...colors.primary);
      doc.setFontSize(16);
      doc.setFont("times", "bold");
      doc.text("BUDGET BREAKDOWN", margin, yPos);
      yPos += 18;

      // Table with precise column widths
      const tableWidth = contentWidth;
      const colWidths = [
        tableWidth * 0.4, // Budget name
        tableWidth * 0.2, // Allocated
        tableWidth * 0.2, // Spent
        tableWidth * 0.2, // Progress
      ];
      const headers = ["Budget Category", "Allocated", "Spent", "Progress"];
      const headerHeight = 12;
      const rowHeight = 10;

      // Table header
      drawBox(
        margin,
        yPos,
        tableWidth,
        headerHeight,
        colors.secondary,
        colors.secondary
      );

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("times", "bold");

      let xPos = margin;
      headers.forEach((header, index) => {
        const centerX = xPos + colWidths[index] / 2;
        doc.text(header, centerX, yPos + 8, { align: "center" });
        xPos += colWidths[index];
      });
      yPos += headerHeight;

      // Table rows with alternating colors
      doc.setFontSize(9);
      doc.setFont("times", "normal");

      Object.values(filteredData.budgets).forEach((budget, index) => {
        checkPageBreak(12);

        const rowColor = index % 2 === 0 ? colors.background : [255, 255, 255];
        drawBox(
          margin,
          yPos,
          tableWidth,
          rowHeight,
          rowColor,
          colors.border,
          0.2
        );

        const progress =
          budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
        const progressText = `${progress.toFixed(1)}%`;

        // Row data with proper text truncation
        const rowData = [
          budget.name.length > 28
            ? budget.name.substring(0, 25) + "..."
            : budget.name,
          formatCurrency(budget.amount),
          formatCurrency(budget.spent),
          progressText,
        ];

        xPos = margin;
        rowData.forEach((data, colIndex) => {
          doc.setTextColor(...colors.text);

          if (colIndex === 3) {
            // Progress with color coding
            if (progress > 90) doc.setTextColor(220, 20, 60);
            else if (progress > 70) doc.setTextColor(255, 140, 0);
            else doc.setTextColor(34, 139, 34);
          }

          const centerX = xPos + colWidths[colIndex] / 2;
          const textAlign = colIndex === 0 ? "left" : "center";
          const textX = colIndex === 0 ? xPos + 5 : centerX;

          doc.text(data, textX, yPos + 7, { align: textAlign });
          xPos += colWidths[colIndex];
        });
        yPos += rowHeight;
      });
      yPos += 15;
    }

    // Expense Details Section with better formatting
    if (
      includeOptions.expenseDetails &&
      Object.keys(filteredData.expenses).length > 0
    ) {
      checkPageBreak(55);

      doc.setTextColor(...colors.primary);
      doc.setFontSize(16);
      doc.setFont("times", "bold");
      doc.text("TRANSACTION DETAILS", margin, yPos);
      yPos += 18;

      // Table with optimized column widths
      const tableWidth = contentWidth;
      const colWidths = [
        tableWidth * 0.15, // Date
        tableWidth * 0.45, // Description
        tableWidth * 0.2, // Amount
        tableWidth * 0.2, // Category
      ];
      const headers = ["Date", "Description", "Amount", "Category"];
      const headerHeight = 12;
      const rowHeight = 9;

      drawBox(
        margin,
        yPos,
        tableWidth,
        headerHeight,
        colors.secondary,
        colors.secondary
      );

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("times", "bold");

      let xPos = margin;
      headers.forEach((header, index) => {
        const centerX = xPos + colWidths[index] / 2;
        doc.text(header, centerX, yPos + 8, { align: "center" });
        xPos += colWidths[index];
      });
      yPos += headerHeight;

      // Table rows
      doc.setFontSize(8);
      doc.setFont("times", "normal");

      const sortedExpenses = Object.values(filteredData.expenses).sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      sortedExpenses.forEach((expense, index) => {
        checkPageBreak(10);

        const rowColor = index % 2 === 0 ? colors.background : [255, 255, 255];
        drawBox(
          margin,
          yPos,
          tableWidth,
          rowHeight,
          rowColor,
          colors.border,
          0.2
        );

        const budget = filteredData.budgets[expense.budgetId];

        // Prepare row data with proper truncation
        const expenseName = expense.name || "Unnamed Transaction";
        const truncatedName =
          expenseName.length > 38
            ? expenseName.substring(0, 35) + "..."
            : expenseName;
        const budgetName = budget?.name || "Unknown";
        const truncatedBudget =
          budgetName.length > 18
            ? budgetName.substring(0, 15) + "..."
            : budgetName;

        const rowData = [
          formatDate(expense.date),
          truncatedName,
          formatCurrency(expense.amount),
          truncatedBudget,
        ];

        xPos = margin;
        rowData.forEach((data, colIndex) => {
          doc.setTextColor(...colors.text);

          if (colIndex === 2) {
            // Amount in accent color and bold
            doc.setTextColor(...colors.accent);
            doc.setFont("times", "bold");
          } else {
            doc.setFont("times", "normal");
          }

          const centerX = xPos + colWidths[colIndex] / 2;
          const textAlign = colIndex === 1 ? "left" : "center";
          const textX = colIndex === 1 ? xPos + 3 : centerX;

          doc.text(data, textX, yPos + 6.5, { align: textAlign });
          xPos += colWidths[colIndex];
        });
        yPos += rowHeight;
      });
      yPos += 15;
    }

    // Recent Timeline Section with clean design
    if (
      includeOptions.timeline &&
      Object.keys(filteredData.expenses).length > 0
    ) {
      checkPageBreak(45);

      doc.setTextColor(...colors.primary);
      doc.setFontSize(16);
      doc.setFont("times", "bold");
      doc.text("RECENT ACTIVITY", margin, yPos);
      yPos += 18;

      const recentExpenses = Object.values(filteredData.expenses)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8);

      recentExpenses.forEach((expense) => {
        checkPageBreak(14);

        const budget = filteredData.budgets[expense.budgetId];
        const itemHeight = 12;

        // Timeline item background
        drawBox(
          margin,
          yPos,
          contentWidth,
          itemHeight,
          colors.background,
          colors.border,
          0.2
        );

        // Timeline indicator (dot)
        doc.setFillColor(...colors.accent);
        doc.circle(margin + 8, yPos + 6, 1.5, "F");

        // Main content
        doc.setTextColor(...colors.text);
        doc.setFontSize(9);
        doc.setFont("times", "normal");

        const expenseName = expense.name || "Transaction";
        const truncatedName =
          expenseName.length > 40
            ? expenseName.substring(0, 37) + "..."
            : expenseName;
        const mainText = `${formatDate(
          expense.date
        )} - ${truncatedName} - ${formatCurrency(expense.amount)}`;

        doc.text(mainText, margin + 15, yPos + 5);

        // Category info
        doc.setTextColor(...colors.secondary);
        doc.setFontSize(8);
        const categoryText = `Category: ${budget?.name || "Unknown"}`;
        doc.text(categoryText, margin + 15, yPos + 9);

        yPos += itemHeight + 1;
      });
      yPos += 10;
    }

    // Professional footer with improved spacing
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      const footerY = doc.internal.pageSize.height - 15;

      // Footer separator line
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

      // Footer content
      doc.setTextColor(...colors.secondary);
      doc.setFontSize(8);
      doc.setFont("times", "normal");

      // Left side - Report title
      doc.text("Expense Tracker Report", margin, footerY);

      // Center - Page numbers
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, footerY, {
        align: "center",
      });

      // Right side - Generation timestamp
      const timestamp = new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Manila",
      });
      doc.text(timestamp, pageWidth - margin, footerY, { align: "right" });
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
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
                    className="w-full p-3 border rounded-lg text-sm text-amber-900 bg-amber-50 appearance-none min-h-[44px] focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
                    style={{
                      WebkitAppearance: "none",
                      MozAppearance: "textfield",
                    }}
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
                    className="w-full p-3 border rounded-lg text-sm text-amber-900 bg-amber-50 appearance-none min-h-[44px] focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
                    style={{
                      WebkitAppearance: "none",
                      MozAppearance: "textfield",
                    }}
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
            {exportFormat === "pdf"}
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
