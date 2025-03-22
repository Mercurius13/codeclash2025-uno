"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { motion } from "framer-motion";

const Dashboard = () => {
  const [threats, setThreats] = useState([]);
  const [metrics, setMetrics] = useState({
    truePositives: 0,
    falsePositives: 0,
    trueNegatives: 0,
    falseNegatives: 0,
  });

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/threats");

    ws.onmessage = (event) => {
      const threat = JSON.parse(event.data);
      setThreats((prev) => [threat, ...prev.slice(0, 19)]); // Keep last 20

      setMetrics((prev) => {
        const updated = { ...prev };
        if (threat.prediction === 1 && threat.actual === 1) updated.truePositives++;
        if (threat.prediction === 1 && threat.actual === 0) updated.falsePositives++;
        if (threat.prediction === 0 && threat.actual === 0) updated.trueNegatives++;
        if (threat.prediction === 0 && threat.actual === 1) updated.falseNegatives++;
        return updated;
      });
    };

    ws.onerror = (err) => console.error("WebSocket Error:", err);
    ws.onclose = () => console.log("WebSocket Disconnected");

    return () => ws.close();
  }, []);

  const metricsData = [
    { name: "TP", value: metrics.truePositives },
    { name: "FP", value: metrics.falsePositives },
    { name: "TN", value: metrics.trueNegatives },
    { name: "FN", value: metrics.falseNegatives },
  ];

  const realVsFakeData = [
    {
      name: "Successful Identification",
      value: metrics.truePositives + metrics.trueNegatives,
    },
    {
      name: "Unsuccessful Identification",
      value: metrics.falsePositives + metrics.falseNegatives,
    },
  ];

  const total = metrics.truePositives + metrics.falsePositives + metrics.trueNegatives + metrics.falseNegatives;
  const pieData = [
    { name: "TP: True Positives", value: metrics.truePositives, percent: total ? ((metrics.truePositives / total) * 100).toFixed(2) : 0 },
    { name: "FP: False Positives", value: metrics.falsePositives, percent: total ? ((metrics.falsePositives / total) * 100).toFixed(2) : 0 },
    { name: "TN: True Negatives", value: metrics.trueNegatives, percent: total ? ((metrics.trueNegatives / total) * 100).toFixed(2) : 0 },
    { name: "FN: False Negatives", value: metrics.falseNegatives, percent: total ? ((metrics.falseNegatives / total) * 100).toFixed(2) : 0 },
  ];

  const COLORS = ["#4caf50", "#f44336", "#2196f3", "#ff9800"];

  return (
    <div className="p-6 bg-black min-h-screen text-white flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="bg-gray-900 flex-1">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-4 text-white">Prediction Metrics</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metricsData}>
                <XAxis dataKey="name" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-sm text-gray-400 text-center mt-2">
              TP = True Positives | FP = False Positives
            </div>
            <div className="text-sm text-gray-400 text-center mt-2">
              TN = True Negatives | FN = False Negatives
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 flex-1">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-4 text-white">Identification Accuracy</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={realVsFakeData}>
                <XAxis dataKey="name" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-sm text-gray-400 text-center mt-2">
              Successful = Correctly Detected
            </div>
            <div className="text-sm text-gray-400 text-center mt-2">
              Unsuccessful = Missed or Incorrectly Flagged
            </div>
          </CardContent>
        </Card>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className="bg-gray-900">
        <CardContent className="flex flex-row items-center justify-between p-6">
          {/* Left: Pie Chart */}
          <div className="w-2/3">
            <h2 className="text-xl font-bold mb-4 text-white">Prediction Metrics Pie Chart</h2>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie 
                  data={pieData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={120} 
                  fill="#8884d8" 
                  label={({ name, percent }) => `${name}: ${percent}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} (${(value / total * 100).toFixed(2)}%)`, name]} />
                <Legend verticalAlign="middle" align="right" layout="vertical" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      </motion.div> 
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="border border-red-500 max-h-[400px] overflow-y-auto bg-gray-900">
          <CardContent className="p-4 space-y-4">
            <h2 className="text-xl font-bold mb-2 text-white">Threat Logs</h2>
            {threats.slice(0, 3).map((threat, idx) => (
              <div key={idx} className="border-b border-gray-700 pb-2 mb-2">
                <p className="text-lg font-semibold">Device: {threat.device}</p>
                <p>Prediction: {threat.prediction ? "Threat" : "Safe"}</p>
                <p>Actual: {threat.actual ? "Threat" : "Safe"}</p>
                <p>Action: {threat.action}</p>
                <p>Time: {new Date(threat.timestamp * 1000).toLocaleTimeString()}</p>
                <div className="mt-1">
                  <p className="font-medium">Feature Importance:</p>
                  {threat.feature_importance && threat.feature_importance.length > 0 ? (
                    <ul className="list-disc list-inside text-sm">
                      {threat.feature_importance.map((item, i) => (
                        <li key={i}>{item.feature}: {item.value.toFixed(3)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm">No feature importance data.</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
