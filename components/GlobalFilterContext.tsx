// contexts/GlobalFilterContext.tsx (New File)
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import type { Task, Project } from '../types';
import { ownerOptions as allOwnerOptions , statusOptions } from '../constants'; 

// --- Types ---
interface FilterSelections {
  owner: string | null;
  projectId: string | null;
  status: string | null;
  startDate: string | null; // <-- เพิ่ม
  endDate: string | null;   // <-- เพิ่ม
  searchQuery: string;
}

interface AvailableOptions {
  owners: string[];
  statuses: string[];
  projects: Project[];
}

interface GlobalFilterContextType {
  selections: FilterSelections;
  options: AvailableOptions;
  filteredTasks: Task[];
  isLoading: boolean;
  setFilter: (type: keyof Omit<FilterSelections, 'searchQuery'>, value: string | null) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

const GlobalFilterContext = createContext<GlobalFilterContextType | undefined>(undefined);

// --- เพิ่ม startDate และ endDate เข้าไปในค่าเริ่มต้น ---
const INITIAL_SELECTIONS: FilterSelections = { 
  owner: null, 
  projectId: null, 
  status: null, 
  startDate: null, 
  endDate: null,
  searchQuery: "", 
}; 

// --- Provider Component ---
export const GlobalFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { allTasks, projects, isLoadingAllTasks } = useData();
  const [selections, setSelections] = useState<FilterSelections>(INITIAL_SELECTIONS);

  // --- Actions ---
  const setFilter = (key: keyof FilterSelections, value: string | null) => {
    setSelections(prev => ({ ...prev, [key]: value }));
  }

  // const setFilter = useCallback((type: keyof Omit<FilterSelections, 'searchQuery'>, value: string | null) => {
  //   setSelections(prev => ({ ...prev, [type]: value }));
  // }, []);

  const setSearchQuery = (query: string) => {
    setSelections(prev => ({ ...prev, searchQuery: query }));
  };

  const resetFilters = () => {
    setSelections(INITIAL_SELECTIONS);
  };

  // --- Core Logic: Faceted Search (Cascading Options) & Filtering ---
  // [✅ ปรับปรุง] คำนวณ Options แบบ Dynamic
  const options = useMemo(() => {
    const ownersSet = new Set<string>();
    allTasks.forEach(task => {
      // รวบรวม Owner และ HelpAssignee ทั้งหมดที่มีในระบบ
      if (task.Owner) ownersSet.add(task.Owner);
      if (task.HelpAssignee) ownersSet.add(task.HelpAssignee);
    });

    return {
        owners: Array.from(ownersSet).sort(),
        statuses: statusOptions,
        projects: projects,
    };
  }, [allTasks, projects]);

  // *** หัวใจสำคัญ: Logic การกรองข้อมูล (Filtering Logic) ***
  const filteredTasks = useMemo(() => {
    const query = selections.searchQuery.toLowerCase().trim();

    return allTasks.filter(task => {
      // 1. Owner Filter (ตรวจสอบทั้ง Owner และ HelpAssignee)
      if (selections.owner) {
        const isOwner = task.Owner === selections.owner;
        const isAssignee = task.HelpAssignee === selections.owner;
        if (!isOwner && !isAssignee) return false;
      }

      // 2. Project Filter
      if (selections.projectId && task.ProjectID !== selections.projectId) {
        return false;
      }

      // 3. Status Filter
      if (selections.status && task.Status !== selections.status) {
        return false;
      }

      // 4. Date Range Filter (Deadline)
      // [✅ ปรับปรุง] ใช้การเปรียบเทียบ String (YYYY-MM-DD)
      if (selections.startDate) {
        if (!task.Deadline || task.Deadline < selections.startDate) {
          return false;
        }
      }
      if (selections.endDate) {
        if (!task.Deadline || task.Deadline > selections.endDate) {
          return false;
        }
      }

      // 5. Search Query Filter
      if (query) {
        const matchesTaskName = task.Task.toLowerCase().includes(query);
        const matchesOwner = task.Owner?.toLowerCase().includes(query);
        const matchesNotes = task['Notes / Result']?.toLowerCase().includes(query);

        if (!matchesTaskName && !matchesOwner && !matchesNotes) {
          return false;
        }
      }

      return true; // Task ผ่านทุกตัวกรอง
    });
  }, [allTasks, selections]);

  // const { options, filteredTasks } = useMemo(() => {
  //   const { owner, projectId, status, searchQuery, startDate, endDate } = selections; // <-- ดึงค่าวันที่มาใช้
  //   const query = searchQuery.toLowerCase().trim();

  //   const projectIds = new Set<string>();
  //   const statuses = new Set<string>();
  //   const finalFilteredTasks: Task[] = [];

  //   const matchesSearch = (task: Task): boolean => {
  //       if (!query) return true;
  //       const fieldsToSearch = [
  //           task.Task,
  //           task["Notes / Result"],
  //           task.Owner,
  //       ];
  //       return fieldsToSearch.some(field =>
  //           typeof field === 'string' && field.toLowerCase().includes(query)
  //       );
  //   };

  //   for (const task of allTasks) {
  //       const taskOwner = task.Owner || 'Unassigned';

  //       const matchesOwner = !owner || taskOwner === owner || task.HelpAssignee === owner;
  //       const matchesProject = !projectId || task.ProjectID === projectId;
  //       const matchesStatus = !status || task.Status === status;
  //       const matchesSearchCheck = matchesSearch(task);

  //       // +++ START: เพิ่ม Logic การกรองตามช่วงวันที่ +++
  //       const matchesDateRange = (() => {
  //           if (!startDate && !endDate) return true; // ถ้าไม่ได้เลือกช่วงวันที่ ให้ผ่าน
  //           if (!task.Deadline) return false; // Task ที่ไม่มี Deadline จะไม่ถูกแสดงเมื่อกรองด้วยวันที่

  //           const taskDate = new Date(task.Deadline);
  //           // ตั้งค่าเวลาเป็น 0 เพื่อเปรียบเทียบเฉพาะวันที่
  //           taskDate.setHours(0, 0, 0, 0);

  //           const start = startDate ? new Date(startDate) : null;
  //           if (start) start.setHours(0, 0, 0, 0);

  //           const end = endDate ? new Date(endDate) : null;
  //           if (end) end.setHours(0, 0, 0, 0);

  //           if (start && end) return taskDate >= start && taskDate <= end;
  //           if (start) return taskDate >= start;
  //           if (end) return taskDate <= end;
  //           return true;
  //       })();
  //       // +++ END: เพิ่ม Logic การกรองตามช่วงวันที่ +++

  //       // --- เพิ่ม matchesDateRange เข้าไปในเงื่อนไขสุดท้าย ---
  //       if (matchesOwner && matchesProject && matchesStatus && matchesSearchCheck && matchesDateRange) {
  //           finalFilteredTasks.push(task);
  //       }

  //       // --- Logic การสร้าง Options (ไม่มีการเปลี่ยนแปลง) ---
  //       if (matchesOwner && matchesStatus && matchesSearchCheck && matchesDateRange) {
  //           projectIds.add(task.ProjectID);
  //       }
  //       if (matchesOwner && matchesProject && matchesSearchCheck && matchesDateRange) {
  //           if (task.Status) statuses.add(task.Status);
  //       }
  //   }

  //   const calculatedOptions: AvailableOptions = {
  //       owners: allOwnerOptions.sort(),
  //       projects: projects.filter(p => projectIds.has(p.ProjectID)),
  //       statuses: Array.from(statuses).sort(),
  //   };

  //   return { options: calculatedOptions, filteredTasks: finalFilteredTasks };

  // }, [allTasks, projects, selections]);

  // --- Auto-Reset Logic ---
  // useEffect(() => {
  //   let changed = false;
  //   const newSelections = { ...selections };

  //   if (selections.projectId && !options.projects.some(p => p.ProjectID === selections.projectId)) {
  //       newSelections.projectId = null;
  //       changed = true;
  //   }
  //   if (selections.status && !options.statuses.includes(selections.status)) {
  //       newSelections.status = null;
  //       changed = true;
  //   }

  //   if (changed) {
  //       setSelections(newSelections);
  //   }
  // }, [options, selections]);


  const value = {
    selections,
    options,
    filteredTasks,
    isLoading: isLoadingAllTasks,
    setFilter,
    setSearchQuery,
    resetFilters,
  };

  return <GlobalFilterContext.Provider value={value}>{children}</GlobalFilterContext.Provider>;
};

// --- Custom Hook ---
export const useGlobalFilters = () => {
  const context = useContext(GlobalFilterContext);
  if (context === undefined) {
    throw new Error('useGlobalFilters must be used within a GlobalFilterProvider');
  }
  return context;
};
