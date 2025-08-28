
export interface Task {
  _id?: string; // Client-side unique identifier
  rowIndex: number;
  ProjectID: string;
  Check: boolean;
  Phase: string;
  Task: string;
  Owner: string;
  Deadline: string;
  Status: string;
  'Est. Hours': number;
  'Actual Hours': number | null;
  'Impact Score': number;
  Timeliness: string;
  'Notes / Result': string;
  'Feedback to Team': string;
  'Owner Feedback': string;
  'Project Feedback': string;
  MilestoneID: string;
  HelpRequestedAt?: string;
  HelpDetails?:string;
  HelpAssignee?:string;
}

export interface Project {
  ProjectID: string;
  Name: string;
  Priority: number;
}

export type TasksByStatus = {
    name: string;
    Tasks: number;
}[];

export type TasksByOwner = {
    name: string;
    value: number;
}[];