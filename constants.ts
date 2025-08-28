export const ownerOptions: string[] = [
  "PRODUCT",
  "PRODUCTION",
  "PLATFORM",
  "MARKETING",
  "DEALERS",
  "WEB",
  "MANAGEMENT",
  "STORES(หน้าร้าน)",
];
export const statusOptions: string[] = [
  "Not Started",
  "In Progress",
  "Done",
  "Blocked",
];
export const phaseOptions: string[] = [
  "Research & Planning",
  "Strategy & Positioning",
  "Content Preparation",
  "Pre-Launch",
  "Launch Day",
  "Post-Launch",
  "Measurement & Optimization",
];
export const impactScoreOptions: number[] = [5, 4, 3, 2, 1];
export const timelinessOptions: string[] = ["Early", "On-Time", "Delayed"];

export const statusColorMap: { [key: string]: string } = {
  Done: "text-green-500",
  "In Progress": "text-blue-500",
  Blocked: "text-red-500",
  "Not Started": "text-gray-400",
};

export const PIE_COLORS: string[] = [
  "#ff8c58",
  "#ff6b2c",
  "#e05a20",
  "#c24e18",
  "#a34211",
  "#85360a",
  "#662b04",
];

export const phaseColorMap: {
  [key: string]: { bg: string; text: string; border: string };
} = {
  "Research & Planning": {
    bg: "bg-sky-600",
    text: "text-white",
    border: "border-sky-700",
  },
  "Strategy & Positioning": {
    bg: "bg-blue-600",
    text: "text-white",
    border: "border-blue-700",
  },
  "Content Preparation": {
    bg: "bg-indigo-600",
    text: "text-white",
    border: "border-indigo-700",
  },
  "Pre-Launch": {
    bg: "bg-purple-600",
    text: "text-white",
    border: "border-purple-700",
  },
  "Launch Day": {
    bg: "bg-pink-600",
    text: "text-white",
    border: "border-pink-700",
  },
  "Post-Launch": {
    bg: "bg-rose-600",
    text: "text-white",
    border: "border-rose-700",
  },
  "Measurement & Optimization": {
    bg: "bg-green-600",
    text: "text-white",
    border: "border-green-700",
  },
};
