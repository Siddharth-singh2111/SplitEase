import React from "react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { CSVLink } from "react-csv";

const COLORS = ["#007bff", "#00bcd4", "#ffc107", "#28a745", "#ff5722", "#6f42c1"];

const Analytics = ({ expenses, userMap }) => {
  const userTotals = {};
  const categoryTotals = {};
  const exportData = [];

  expenses.forEach((exp) => {
    const name = userMap[exp.paidBy] || "Unknown";
    userTotals[name] = (userTotals[name] || 0) + exp.amount;

    const category = exp.category || "Uncategorized";
    categoryTotals[category] = (categoryTotals[category] || 0) + exp.amount;

    exportData.push({
      Description: exp.description,
      Amount: exp.amount,
      "Paid By": name,
      Category: category,
      "Split Among": exp.splitBetween?.map((uid) => userMap[uid] || uid).join(", ") || "",
      Date: exp.createdAt?.toDate().toLocaleString() || "",
    });
  });

  const userData = Object.entries(userTotals).map(([name, amount]) => ({ name, amount }));
  const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  const csvHeaders = [
    { label: "Description", key: "Description" },
    { label: "Amount", key: "Amount" },
    { label: "Paid By", key: "Paid By" },
    { label: "Category", key: "Category" },
    { label: "Split Among", key: "Split Among" },
    { label: "Date", key: "Date" }
  ];

  return (
    <div className="mt-12 px-4 py-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl ">
      <h3 className="text-3xl font-extrabold text-gray-800 mb-8 border-b pb-2">Expense Analytics</h3>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Top Spenders */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <h4 className="text-xl font-semibold text-blue-700 mb-4">Top Spenders</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={userData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#007bff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition">
          <h4 className="text-xl font-semibold text-blue-700 mb-4">Category Breakdown</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {categoryData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-10 text-right">
        <CSVLink
          data={exportData}
          headers={csvHeaders}
          filename={"splitease-analytics.csv"}
          className="inline-block bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium px-5 py-2 rounded-lg hover:scale-105 transition duration-200"
        >
          📁 Export to CSV
        </CSVLink>
      </div>
    </div>
  );
};

export default Analytics;
