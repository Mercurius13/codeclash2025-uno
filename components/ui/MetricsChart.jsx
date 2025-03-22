"use client";
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const MetricsChart = ({ dataChart }) => (
  <LineChart width={400} height={300} data={dataChart}>
    <XAxis dataKey="name" />
    <YAxis allowDecimals={false} />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="value" stroke="#8884d8" />
  </LineChart>
);

export default MetricsChart;
