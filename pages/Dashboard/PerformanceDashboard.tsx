// ไฟล์: PerformanceDashboard.tsx (Refactor จาก AarTab.tsx)
import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  PieProps,
} from "recharts";
// โปรดตรวจสอบ Path การ Import ให้ถูกต้อง
import { StatCard } from "@/components/StatCard";
import type { TasksByOwner, TasksByStatus } from "@/types";
import { PIE_COLORS } from "@/constants";

// Workaround สำหรับ Recharts (เหมือนเดิม)
type PatchedPieProps = PieProps & {
  activeIndex?: number;
  activeShape?:
    | React.ReactElement
    | ((props: any) => React.ReactElement<SVGElement>);
  onMouseEnter?: (data: any, index: number) => void;
};
const PatchedPie = Pie as React.ComponentType<PatchedPieProps>;

const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
  } = props;
  return (
    <g>
      <text
        x={cx}
        y={cy}
        dy={-5}
        textAnchor="middle"
        fill="#333"
        className="font-bold text-lg"
      >
        {payload.name}
      </text>
      <text
        x={cx}
        y={cy}
        dy={15}
        textAnchor="middle"
        fill="#666"
      >{`${payload.value} Tasks`}</text>
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

// [✅ อัปเดต Interface] รับ Props ใหม่
interface PerformanceDashboardProps {
  // [✅ เพิ่มใหม่] Productivity Metrics
  totalCompletedTasks: number;
  totalImpactDelivered: number;
  workInProgressCount: number;
  overdueTaskCount: number;

  tasksByStatus: TasksByStatus;
  tasksByOwner: TasksByOwner;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  totalCompletedTasks,
  totalImpactDelivered,
  workInProgressCount,
  overdueTaskCount,
  tasksByStatus,
  tasksByOwner,
}) => {
  const [pieIndex, setPieIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setPieIndex(index);
  };

  // [✅ ปรับปรุง] จัดการกรณีไม่มีข้อมูล
  if (
    tasksByOwner.length === 0 &&
    tasksByStatus.every((s) => s.Tasks === 0) &&
    totalCompletedTasks === 0 &&
    workInProgressCount === 0
  ) {
    return (
      <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm border">
        ยังไม่มีข้อมูลเพียงพอสำหรับแสดงสถิติ
      </div>
    );
  }

  return (
    <div>
      {/* [✅ อัปเดต Stat Cards] แสดง Metrics ใหม่ (เปลี่ยนเป็น Grid 4 ช่อง) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="งานที่ทำสำเร็จ (Throughput)"
          value={String(totalCompletedTasks)}
          unit="Tasks"
          color="text-green-500"
        />
        <StatCard
          title="คะแนน Impact ที่ส่งมอบ"
          value={String(totalImpactDelivered)}
          unit="Points"
          color="text-blue-500"
        />
        <StatCard
          title="งานที่กำลังดำเนินการ (WIP)"
          value={String(workInProgressCount)}
          unit="Tasks"
          color="text-orange-500"
        />
        <StatCard
          title="งานที่เกินกำหนด (Overdue)"
          value={String(overdueTaskCount)}
          unit="Tasks"
          color="text-red-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-3 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-4">ภาพรวมสถานะ Task</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={tasksByStatus}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "#fff7f2" }}
                contentStyle={{
                  borderRadius: "0.75rem",
                  borderColor: "#fee2d5",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "14px" }} />
              <Bar
                dataKey="Tasks"
                fill="#ff6b2c"
                barSize={40}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-4">
            สัดส่วน Task ตามทีม/ผู้รับผิดชอบ
          </h3>
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
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </PatchedPie>
              {/* เพิ่ม Legend เพื่อให้อ่านง่ายขึ้นเมื่อมีผู้รับผิดชอบหลายคน */}
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
