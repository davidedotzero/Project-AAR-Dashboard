import { render, screen } from '@testing-library/react';
import App from '../App';
import { describe, it, expect, vi } from 'vitest';
import { useAuth } from '@/contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { UIProvider } from '@/contexts/UIContext';
import { DataProvider } from '@/contexts/DataContext';
import { GlobalFilterProvider } from '@/components/GlobalFilterContext';

// Mock the useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the useData hook
vi.mock('@/contexts/DataContext', () => ({
    useData: () => ({
        projects: [],
        tasks: [],
        initialTasks: [],
        loadingMessage: null,
        error: null,
        selectedProjectId: null,
        setSelectedProjectId: vi.fn(),
        saveTask: vi.fn(),
        createProject: vi.fn(),
        updateProject: vi.fn(),
        createTask: vi.fn(),
        confirmDelete: vi.fn(),
        bulkUpdateDeadline: vi.fn(),
        isOperating: false,
        refreshAllData: vi.fn(),
    }),
}));

// Mock the useUI hook
vi.mock('@/contexts/UIContext', () => ({
    useUI: () => ({
        isEditModalOpen: false,
        isViewModalOpen: false,
        isCreateProjectModalOpen: false,
        isEditProjectModalOpen: false,
        isDeleteModalOpen: false,
        isCreateTaskModalOpen: false,
        currentTask: null,
        currentIndex: null,
        itemToDelete: null,
        currentEditingProject: null,
        newTaskDefaults: null,
        closeModals: vi.fn(),
        openEditModal: vi.fn(),
        openViewModal: vi.fn(),
        navigateTask: vi.fn(),
        openDeleteModal: vi.fn(),
        openCreateTaskModal: vi.fn(),
        openEditProjectModal: vi.fn(),
    }),
    UIProvider: ({ children }) => <>{children}</>,
}));

vi.mock('@/components/GlobalFilterContext', () => ({
    useGlobalFilters: () => ({
        selections: {},
        options: { owners: [], projects: [], statuses: [] },
        setFilter: vi.fn(),
        setSearchQuery: vi.fn(),
        resetFilters: vi.fn(),
        isLoading: false,
        filteredTasks: [],
    }),
    GlobalFilterProvider: ({ children }) => <>{children}</>,
}));

vi.mock('@/contexts/DataContext', () => ({
    useData: () => ({
        projects: [],
        tasks: [],
        initialTasks: [],
        loadingMessage: null,
        error: null,
        selectedProjectId: null,
        setSelectedProjectId: vi.fn(),
        saveTask: vi.fn(),
        createProject: vi.fn(),
        updateProject: vi.fn(),
        createTask: vi.fn(),
        confirmDelete: vi.fn(),
        bulkUpdateDeadline: vi.fn(),
        isOperating: false,
        refreshAllData: vi.fn(),
    }),
    DataProvider: ({ children }) => <>{children}</>,
}));


const GOOGLE_CLIENT_ID = "test-client-id";

const AllTheProviders = ({ children }) => {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <MemoryRouter>
                <UIProvider>
                    <DataProvider>
                        <GlobalFilterProvider>
                            {children}
                        </GlobalFilterProvider>
                    </DataProvider>
                </UIProvider>
            </MemoryRouter>
        </GoogleOAuthProvider>
    )
}

const customRender = (ui, options) =>
  render(ui, {wrapper: AllTheProviders, ...options})


describe('App', () => {
  it('renders loading indicator while authenticating', () => {
    // Arrange
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    });

    // Act
    customRender(<App />);

    // Assert
    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
  });

  it('renders login screen when not authenticated', () => {
    // Arrange
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    });

    // Act
    customRender(<App />);

    // Assert
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('renders dashboard when authenticated', () => {
    // Arrange
    (useAuth as jest.Mock).mockReturnValue({
      user: { email: 'test@example.com' },
      isLoading: false,
    });

    // Act
    customRender(<App />);

    // Assert
    expect(screen.getByText('Dashboard & Global Filters')).toBeInTheDocument();
  });
});