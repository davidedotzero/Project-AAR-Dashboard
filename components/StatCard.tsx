
import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    unit: string;
    color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, unit, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col justify-between border border-gray-200 hover:shadow-lg transition-shadow duration-300">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className={`text-4xl font-bold ${color} mt-2`}>
      {value}
      <span className="text-lg ml-1 font-medium text-gray-400">{unit}</span>
    </p>
  </div>
);
