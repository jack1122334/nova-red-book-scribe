import { create } from 'zustand';
import { Project } from '@/pages/Creation';
import { projectsApi } from '@/lib/api';
import { UserBackgroundData } from '@/types/userBackground';
import { Json } from '@/integrations/supabase/types';

// 类型转换辅助函数
const convertJsonToUserBackground = (json: Json | null): UserBackgroundData | undefined => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return undefined;
  }
  return json as UserBackgroundData;
};

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<Project | null>;
  createProject: (projectData: { title: string; user_background?: UserBackgroundData }) => Promise<Project>;
  updateProject: (id: string, updates: { title?: string; user_background?: UserBackgroundData }) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  fetchProjects: async () => {
    try {
      set({ loading: true, error: null });
      const projects = await projectsApi.list();
      const formattedProjects: Project[] = projects.map(p => ({
        id: p.id,
        title: p.title,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        user_background: convertJsonToUserBackground(p.user_background)
      }));
      set({ projects: formattedProjects });
    } catch (error) {
      console.error('Error fetching projects:', error);
      set({ error: error instanceof Error ? error.message : '获取项目失败' });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchProject: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const project = await projectsApi.get(id);
      const formattedProject: Project = {
        id: project.id,
        title: project.title,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        user_background: convertJsonToUserBackground(project.user_background)
      };
      set({ currentProject: formattedProject });
      return formattedProject;
    } catch (error) {
      console.error('Error fetching project:', error);
      set({ error: error instanceof Error ? error.message : '获取项目失败' });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  createProject: async (projectData) => {
    try {
      set({ loading: true, error: null });
      const project = await projectsApi.create(projectData);
      const formattedProject: Project = {
        id: project.id,
        title: project.title,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        user_background: convertJsonToUserBackground(project.user_background)
      };
      
      const { projects } = get();
      set({ projects: [formattedProject, ...projects] });
      return formattedProject;
    } catch (error) {
      console.error('Error creating project:', error);
      set({ error: error instanceof Error ? error.message : '创建项目失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  updateProject: async (id: string, updates) => {
    try {
      set({ loading: true, error: null });
      const project = await projectsApi.update(id, updates);
      const formattedProject: Project = {
        id: project.id,
        title: project.title,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        user_background: convertJsonToUserBackground(project.user_background)
      };
      
      const { projects, currentProject } = get();
      const updatedProjects = projects.map(p => p.id === id ? formattedProject : p);
      set({ 
        projects: updatedProjects,
        currentProject: currentProject?.id === id ? formattedProject : currentProject
      });
      return formattedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      set({ error: error instanceof Error ? error.message : '更新项目失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  deleteProject: async (id: string) => {
    try {
      set({ loading: true, error: null });
      await projectsApi.delete(id);
      
      const { projects, currentProject } = get();
      const updatedProjects = projects.filter(p => p.id !== id);
      set({ 
        projects: updatedProjects,
        currentProject: currentProject?.id === id ? null : currentProject
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      set({ error: error instanceof Error ? error.message : '删除项目失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));
