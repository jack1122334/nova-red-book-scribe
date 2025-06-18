
import React from 'react';
import { Navbar } from '@/components/Navbar';
import { UserBackgroundCards } from '@/components/UserBackgroundCards';

const Profile = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2">个人资料</h1>
          <p className="text-stone-600">管理您的个人信息和背景设置</p>
        </div>
        
        <div className="space-y-8">
          <UserBackgroundCards />
        </div>
      </div>
    </div>
  );
};

export default Profile;
