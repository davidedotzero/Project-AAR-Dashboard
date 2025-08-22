import type { Task, Project } from './types';

export const ownerOptions: string[] = ["PRODUCT", "PRODUCTION", "PLATFORM", "MARKETING", "DEALERS", "WEB", "MANAGEMENT"];
export const statusOptions: string[] = ["Not Started", "In Progress", "Done", "Blocked"];
export const phaseOptions: string[] = ["Research & Planning", "Strategy & Positioning", "Content Preparation", "Pre-Launch", "Launch Day", "Post-Launch", "Measurement & Optimization"];
export const impactScoreOptions: number[] = [5, 4, 3, 2, 1];
export const timelinessOptions: string[] = ["Early", "On-Time", "Delayed"];

export const statusColorMap: { [key: string]: string } = {
  'Done': 'text-green-500',
  'In Progress': 'text-blue-500',
  'Blocked': 'text-red-500',
  'Not Started': 'text-gray-400'
};

export const PIE_COLORS: string[] = ['#ff8c58', '#ff6b2c', '#e05a20', '#c24e18', '#a34211', '#85360a', '#662b04'];

export const phaseColorMap: { [key: string]: { bg: string; text: string } } = {
  "Research & Planning":    { bg: 'bg-sky-100',    text: 'text-sky-800' },
  "Strategy & Positioning": { bg: 'bg-blue-100',   text: 'text-blue-800' },
  "Content Preparation":    { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  "Pre-Launch":             { bg: 'bg-purple-100', text: 'text-purple-800' },
  "Launch Day":             { bg: 'bg-pink-100',   text: 'text-pink-800' },
  "Post-Launch":            { bg: 'bg-rose-100',   text: 'text-rose-800' },
  "Measurement & Optimization": { bg: 'bg-green-100',  text: 'text-green-800' },
};