import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
        {
            source: "/attack_locations",
            destination: "http://localhost:5000/attack_locations"
        },
        {
          source: "/intrusion_data",
          destination: "http://localhost:5000/intrusion_data"
        },
        {
          source: "/logs",
          destination: "http://localhost:5000/logs"
        },
        {
          source: "/critical_alerts",
          destination: "http://localhost:5000/critical_alerts"
        },
        {
          source: "/predict_next_attack",
          destination: "http://localhost:5000/predict_next_attack"
        },
        {
          source: "/trigger_recovery",
          destination: "http://localhost:5000/trigger_recovery"
        },
    ];
}
};

export default nextConfig;
