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

    // For CSV export
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
    <div className="analytics-section">
      <h3>Expense Analytics</h3>

      <div className="chart-container">
        <div className="chart-box">
          <h4>Top Spenders</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={userData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#007bff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h4>Category Breakdown</h4>
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

      <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
        <CSVLink
          data={exportData}
          headers={csvHeaders}
          filename={"splitease-analytics.csv"}
          className="button"
        >
          Export to CSV
        </CSVLink>
      </div>
    </div>
  );
};

export default Analytics;
