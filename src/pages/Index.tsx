
import { Navbar } from '@/components/Navbar';
import { ProjectsManager } from '@/components/ProjectsManager';
import { FloatingSidebar } from '@/components/FloatingSidebar';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <FloatingSidebar currentPage="home" />
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4">
        home
      </div>
    </div>
  );
};

export default Index;
