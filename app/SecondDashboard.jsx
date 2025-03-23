"use client";

export default function SecondDashboard() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen">
      <h1 className="text-2xl font-bold mb-4">Security Dashboard</h1>
      <iframe
        src="/dashboard.html"
        className="w-full h-360 rounded-lg shadow-lg border"
      />
    </div>
  );
}
