import React, { useEffect, useState } from "react";
import { expenseAPI } from "../services/api";

const Reports = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportType, setReportType] = useState("category");

    useEffect(() => {
        const fetchAllExpenses = async () => {
            try {
                const data = await expenseAPI.getAll();
                setExpenses(data);
            } catch (error) {
                setError("Failed to fetch expense data");
                console.error("Error fetching expenses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllExpenses();
    }, []);

    const generateCategoryReport = () => {
        // Group expenses by category
        const categories = {};

        expenses.forEach(expense => {
            const { category, amount, status } = expense;

            if (!categories[category]) {
                categories[category] = {
                    totalAmount: 0,
                    count: 0,
                    approved: 0,
                    pending: 0,
                    rejected: 0,
                    approvedAmount: 0,
                    pendingAmount: 0,
                    rejectedAmount: 0
                };
            }

            categories[category].totalAmount += amount;
            categories[category].count += 1;

            // Count by status
            if (status === "Approved") {
                categories[category].approved += 1;
                categories[category].approvedAmount += amount;
            } else if (status === "Pending") {
                categories[category].pending += 1;
                categories[category].pendingAmount += amount;
            } else if (status === "Rejected") {
                categories[category].rejected += 1;
                categories[category].rejectedAmount += amount;
            }
        });

        return Object.entries(categories).map(([category, data]) => ({
            category,
            ...data
        }));
    };

    const generateMonthlyReport = () => {
        // Group expenses by month
        const months = {};

        expenses.forEach(expense => {
            const date = new Date(expense.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

            if (!months[monthKey]) {
                months[monthKey] = {
                    month: monthName,
                    totalAmount: 0,
                    count: 0,
                    approved: 0,
                    pending: 0,
                    rejected: 0,
                    approvedAmount: 0,
                    pendingAmount: 0,
                    rejectedAmount: 0
                };
            }

            months[monthKey].totalAmount += expense.amount;
            months[monthKey].count += 1;

            // Count by status
            if (expense.status === "Approved") {
                months[monthKey].approved += 1;
                months[monthKey].approvedAmount += expense.amount;
            } else if (expense.status === "Pending") {
                months[monthKey].pending += 1;
                months[monthKey].pendingAmount += expense.amount;
            } else if (expense.status === "Rejected") {
                months[monthKey].rejected += 1;
                months[monthKey].rejectedAmount += expense.amount;
            }
        });

        // Sort by month (newest first)
        return Object.entries(months)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([key, data]) => ({
                monthKey: key,
                ...data
            }));
    };

    const reportData = reportType === "category"
        ? generateCategoryReport()
        : generateMonthlyReport();

    const handleExportCSV = () => {
        // Create CSV content
        let csvContent = "";

        if (reportType === "category") {
            // Headers for category report
            csvContent = "Category,Total Amount,Count,Approved,Pending,Rejected,Approved Amount,Pending Amount,Rejected Amount\n";

            // Data rows
            reportData.forEach(row => {
                csvContent += `"${row.category}",${row.totalAmount.toFixed(2)},${row.count},${row.approved},${row.pending},${row.rejected},${row.approvedAmount.toFixed(2)},${row.pendingAmount.toFixed(2)},${row.rejectedAmount.toFixed(2)}\n`;
            });
        } else {
            // Headers for monthly report
            csvContent = "Month,Total Amount,Count,Approved,Pending,Rejected,Approved Amount,Pending Amount,Rejected Amount\n";

            // Data rows
            reportData.forEach(row => {
                csvContent += `"${row.month}",${row.totalAmount.toFixed(2)},${row.count},${row.approved},${row.pending},${row.rejected},${row.approvedAmount.toFixed(2)},${row.pendingAmount.toFixed(2)},${row.rejectedAmount.toFixed(2)}\n`;
            });
        }

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `expense-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="text-center p-10">Loading...</div>;
    if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;

    return (
        <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Expense Reports</h2>
                <button
                    onClick={handleExportCSV}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                    Export CSV
                </button>
            </div>

            <div className="mb-6">
                <label className="block text-sm text-gray-600 mb-2">Report Type</label>
                <div className="flex space-x-4">
                    <button
                        onClick={() => setReportType("category")}
                        className={`px-4 py-2 rounded-lg ${reportType === "category"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                    >
                        By Category
                    </button>
                    <button
                        onClick={() => setReportType("monthly")}
                        className={`px-4 py-2 rounded-lg ${reportType === "monthly"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                    >
                        By Month
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {reportType === "category" ? "Category" : "Month"}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Count
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Approved
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Pending
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rejected
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.map((row, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {reportType === "category" ? row.category : row.month}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        ${row.totalAmount.toFixed(2)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{row.count}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {row.approved} (${row.approvedAmount.toFixed(2)})
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {row.pending} (${row.pendingAmount.toFixed(2)})
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {row.rejected} (${row.rejectedAmount.toFixed(2)})
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;