// contexts/GlobalFilterContext.tsx (New File)
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import type { Task, Project } from '../types';
// import { ownerOptions as allOwnerOptions , statusOptions } from '../constants'; 

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
  setFilter: (type: keyof FilterSelections, value: string | null) => void;
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
  const { allTasks, tasks, projects, isLoadingAllTasks } = useData();
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

  // ===================================================================
  // [✅✅✅ หัวใจสำคัญ: Logic การกรองแบบ Faceted Search]
  // ===================================================================
  // คำนวณทั้งผลลัพธ์และตัวเลือกแบบ Dynamic ในคราวเดียวเพื่อประสิทธิภาพ (O(N))
  const { filteredTasks, options } = useMemo(() => {
    const { owner, projectId, status, searchQuery, startDate, endDate } = selections;
    const query = searchQuery.toLowerCase().trim();

    // Sets สำหรับเก็บ Options ที่ยังใช้ได้ (Faceted)
    const availableOwners = new Set<string>();
    const availableProjectIds = new Set<string>();
    const availableStatuses = new Set<string>();
    const finalFilteredTasks: Task[] = [];

    // Helper: ตรวจสอบการค้นหา
    const matchesSearch = (task: Task): boolean => {
        if (!query) return true;
        const fieldsToSearch = [
            task.Task,
            task["Notes / Result"],
            task.Owner,
            task.HelpAssignee, // รวม HelpAssignee ในการค้นหา
        ];
        return fieldsToSearch.some(field =>
            typeof field === 'string' && field.toLowerCase().includes(query)
        );
    };

    // Helper: ตรวจสอบช่วงวันที่ (ใช้การเปรียบเทียบ String YYYY-MM-DD)
    const matchesDateRange = (task: Task): boolean => {
        if (!startDate && !endDate) return true;
        if (!task.Deadline) return false; // ถ้ากรองวันที่ Task ที่ไม่มี Deadline จะไม่แสดง

        if (startDate && task.Deadline < startDate) return false;
        if (endDate && task.Deadline > endDate) return false;
        return true;
    };

    // Loop ผ่าน Task ทั้งหมดเพียงรอบเดียว
    for (const task of allTasks) {

      // 1. คำนวณว่า Task นี้ตรงกับเงื่อนไขแต่ละข้อหรือไม่
      // [✅] Logic การกรอง Owner รวม HelpAssignee
      const matchesOwner = !owner || task.Owner === owner || task.HelpAssignee === owner;
      const matchesProject = !projectId || task.ProjectID === projectId;
      const matchesStatus = !status || task.Status === status;
      const matchesSearchCheck = matchesSearch(task);
      const matchesDateRangeCheck = matchesDateRange(task);

      // 2. กรองผลลัพธ์สุดท้าย (ต้องตรงกับทุกเงื่อนไข - AND Logic)
      if (matchesOwner && matchesProject && matchesStatus && matchesSearchCheck && matchesDateRangeCheck) {
          finalFilteredTasks.push(task);
      }

      // 3. คำนวณ Options สำหรับ Faceted Search (ต้องตรงกับเงื่อนไขอื่นๆ แต่ไม่สนเงื่อนไขของตัวเอง)

      // 3a. หา Projects ที่ยังใช้ได้ (ไม่สนใจ Project filter)
      if (matchesOwner && matchesStatus && matchesSearchCheck && matchesDateRangeCheck) {
          if (task.ProjectID) availableProjectIds.add(task.ProjectID);
      }

      // 3b. หา Statuses ที่ยังใช้ได้ (ไม่สนใจ Status filter)
      if (matchesOwner && matchesProject && matchesSearchCheck && matchesDateRangeCheck) {
          if (task.Status) availableStatuses.add(task.Status);
      }

      // 3c. หา Owners/Assignees ที่ยังใช้ได้ (ไม่สนใจ Owner filter)
      if (matchesProject && matchesStatus && matchesSearchCheck && matchesDateRangeCheck) {
          if (task.Owner) availableOwners.add(task.Owner);
          if (task.HelpAssignee) availableOwners.add(task.HelpAssignee);
      }
    }

    // สร้าง Object ของ Options ที่กรองแล้ว
    const calculatedOptions: AvailableOptions = {
        owners: Array.from(availableOwners).sort(),
        // กรองเฉพาะ Project ที่ยังอยู่ในรายการที่คำนวณได้
        projects: projects.filter(p => availableProjectIds.has(p.ProjectID)),
        statuses: Array.from(availableStatuses).sort(),
    };

    return { filteredTasks: finalFilteredTasks, options: calculatedOptions };

  }, [allTasks, projects, selections]);

  // [✅ เพิ่ม] Auto-Reset Logic
  // หากตัวเลือกที่เคยเลือกไว้ หายไปจาก Options ใหม่ (เพราะถูกกรองออก)
  // ควรรีเซ็ตค่านั้นเป็น null เพื่อป้องกันสภาวะที่กรองแล้วไม่เจออะไรเลย (Dead-end)
  useEffect(() => {
    let changed = false;
    const newSelections = { ...selections };

    if (selections.owner && !options.owners.includes(selections.owner)) {
        newSelections.owner = null;
        changed = true;
    }
    if (selections.projectId && !options.projects.some(p => p.ProjectID === selections.projectId)) {
        newSelections.projectId = null;
        changed = true;
    }
    if (selections.status && !options.statuses.includes(selections.status)) {
        newSelections.status = null;
        changed = true;
    }

    if (changed) {
        // ตรวจสอบก่อน Set State เพื่อป้องกันการ Re-render ที่ไม่จำเป็น
        if (JSON.stringify(newSelections) !== JSON.stringify(selections)) {
           setSelections(newSelections);
        }
    }
  }, [options, selections]);
  // ===================================================================


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
