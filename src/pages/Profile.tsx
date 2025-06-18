
import React from 'react';
import { Navbar } from '@/components/Navbar';
import { UserBackgroundCards } from '@/components/UserBackgroundCards';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarInset } from '@/components/ui/sidebar';

const Profile = () => {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <Navbar />
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2">个人资料</h1>
              <p className="text-stone-600">管理您的个人信息和背景设置</p>
            </div>
            
            <div className="space-y-8">
              <UserBackgroundCards />
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
};

export default Profile;
