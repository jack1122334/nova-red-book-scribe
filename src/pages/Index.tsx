
import { Navbar } from '@/components/Navbar';
import { ProjectsManager } from '@/components/ProjectsManager';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

const Index = () => {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <Navbar />
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <ProjectsManager />
          </div>
        </div>
      </SidebarInset>
    </>
  );
};

export default Index;
