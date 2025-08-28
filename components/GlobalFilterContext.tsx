// contexts/GlobalFilterContext.tsx (New File)
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import type { Task, Project } from '../types';

// --- Types ---
interface FilterSelections {
  owner: string | null;
  projectId: string | null;
  status: string | null;
  searchQuery: string;
  
}

interface AvailableOptions {
  owners: string[];
  projects: Project[];
  statuses: string[];
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

const INITIAL_SELECTIONS: FilterSelections = { owner: null, projectId: null, status: null, searchQuery: "" };

// --- Provider Component ---
export const GlobalFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { allTasks, projects, isLoadingAllTasks } = useData();
  const [selections, setSelections] = useState<FilterSelections>(INITIAL_SELECTIONS);

  // --- Core Logic: Faceted Search (Cascading Options) & Filtering ---
  // คำนวณทั้งหมดใน Memo เดียว (Single-pass optimization)
  const { options, filteredTasks } = useMemo(() => {
    const { owner, projectId, status, searchQuery } = selections;
    const query = searchQuery.toLowerCase().trim();

    const owners = new Set<string>();
    const projectIds = new Set<string>();
    const statuses = new Set<string>();
    const finalFilteredTasks: Task[] = [];

    // Helper function สำหรับการค้นหา (Action/Task/Notes)
    const matchesSearch = (task: Task): boolean => {
        if (!query) return true;
        const fieldsToSearch = [
            task.Task,                  // Action (Task Name)
            task["Notes / Result"],     // Notes
            task.Owner,                 // ค้นหา Owner จากช่อง Search ได้ด้วย
        ];
        return fieldsToSearch.some(field =>
            typeof field === 'string' && field.toLowerCase().includes(query)
        );
    };

    // วนลูป Task ทั้งหมดเพียงครั้งเดียว
    for (const task of allTasks) {
        const taskOwner = task.Owner || 'Unassigned';

        // Helper flags
        const matchesOwner = !owner || taskOwner === owner;
        const matchesProject = !projectId || task.ProjectID === projectId;
        const matchesStatus = !status || task.Status === status;
        const matchesSearchCheck = matchesSearch(task);

        // 1. Calculate Filtered Tasks (Matches ALL criteria)
        if (matchesOwner && matchesProject && matchesStatus && matchesSearchCheck) {
            finalFilteredTasks.push(task);
        }

        // 2. Calculate Available Options (Cascading Logic)

        // 2a. Owners (Apply Project, Status, Search filters)
        if (matchesProject && matchesStatus && matchesSearchCheck) {
            owners.add(taskOwner);
        }

        // 2b. Projects (Apply Owner, Status, Search filters)
        if (matchesOwner && matchesStatus && matchesSearchCheck) {
            projectIds.add(task.ProjectID);
        }

        // 2c. Statuses (Apply Owner, Project, Search filters)
        if (matchesOwner && matchesProject && matchesSearchCheck) {
            if (task.Status) statuses.add(task.Status);
        }
    }

    // แปลง Set เป็น Array และเรียงลำดับ
    const calculatedOptions: AvailableOptions = {
        owners: Array.from(owners).sort(),
        // ใช้รายชื่อโปรเจกต์หลัก (ที่เรียงตาม Priority แล้ว) และกรองเฉพาะที่มีข้อมูล
        projects: projects.filter(p => projectIds.has(p.ProjectID)),
        statuses: Array.from(statuses).sort(),
    };

    return { options: calculatedOptions, filteredTasks: finalFilteredTasks };

  }, [allTasks, projects, selections]);


  // --- Actions ---
  const setFilter = useCallback((type: keyof Omit<FilterSelections, 'searchQuery'>, value: string | null) => {
    setSelections(prev => ({ ...prev, [type]: value }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setSelections(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const resetFilters = useCallback(() => {
    setSelections(INITIAL_SELECTIONS);
  }, []);

  // --- Auto-Reset Logic (UX Improvement) ---
  // หากตัวเลือกที่เลือกไว้ไม่มีอยู่ใน Options ปัจจุบัน ให้ Reset ตัวเลือกนั้น
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
        setSelections(newSelections);
    }
  }, [options, selections]);


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