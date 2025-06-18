
import { Navbar } from '@/components/Navbar';
import { ProjectsManager } from '@/components/ProjectsManager';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4">
        <ProjectsManager />
      </div>
    </div>
  );
};

export default Index;
