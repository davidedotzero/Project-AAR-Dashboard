import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector, PieProps } from 'recharts';
import { StatCard } from './StatCard';
import type { TasksByOwner, TasksByStatus } from '../types';
import { PIE_COLORS } from '../constants';

// This is a workaround for a potential issue with outdated recharts type definitions
// that may not include the 'activeIndex' prop. We create a correctly typed component.
type PatchedPieProps = PieProps & {
  activeIndex?: number;
  activeShape?: React.ReactElement | ((props: any) => React.ReactElement<SVGElement>);
  onMouseEnter?: (data: any, index: number) => void;
};
const PatchedPie = Pie as React.ComponentType<PatchedPieProps>;


const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
  return (
    <g>
      <text x={cx} y={cy} dy={-5} textAnchor="middle" fill="#333" className="font-bold text-lg">{payload.name}</text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#666">{`${payload.value} Tasks`}</text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

interface AarTabProps {
    operationScore: string;
    efficiencyRatio: string;
    onTimePerformance: string;
    tasksByStatus: TasksByStatus;
    tasksByOwner: TasksByOwner;
}

export const AarTab: React.FC<AarTabProps> = ({ operationScore, efficiencyRatio, onTimePerformance, tasksByStatus, tasksByOwner }) => {
    const [pieIndex, setPieIndex] = useState(0);

    const onPieEnter = (_: any, index: number) => {
        setPieIndex(index);
    };

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard title="คะแนนปฏิบัติการ (OPS)" value={operationScore} unit="/ 5" color="text-orange-500" />
              <StatCard title="อัตราส่วนประสิทธิภาพ (EFF)" value={efficiencyRatio} unit="%" color="text-green-500" />
              <StatCard title="ประสิทธิภาพตรงต่อเวลา (OTP)" value={onTimePerformance} unit="%" color="text-blue-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-4">ภาพรวมสถานะ Task</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={tasksByStatus} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#fff7f2'}} contentStyle={{ borderRadius: '0.75rem', borderColor: '#fee2d5' }} />
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="Tasks" fill="#ff6b2c" barSize={40} radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-4">สัดส่วน Task ตามทีม</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <PatchedPie
                                activeIndex={pieIndex}
                                activeShape={renderActiveShape}
                                data={tasksByOwner}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                dataKey="value"
                                onMouseEnter={onPieEnter}
                            >
                                {tasksByOwner.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </PatchedPie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}