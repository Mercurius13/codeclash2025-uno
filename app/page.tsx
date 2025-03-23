"use client";

import { useState } from "react";
import Link from "next/link";
import Dashboard from "./Dashboard";
import SecondDashboard from "./SecondDashboard";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Threat Detection Dashboard</h1>

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-4 space-x-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "dashboard" ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setActiveTab("dashboard")}
        >
          Threat Identification
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "secondDashboard" ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setActiveTab("secondDashboard")}
        >
          Security Detection
        </button>
      </div>

      {/* Render Selected Dashboard */}
      {activeTab === "dashboard" ? <Dashboard /> : <SecondDashboard />}
    </main>
  );
}
