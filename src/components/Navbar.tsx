
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/components/AuthProvider';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';

export const Navbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <nav className="border-b border-amber-200/50 backdrop-blur-sm sticky top-0 z-50 bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link
              to="/"
              className="text-xl font-serif font-bold text-amber-900"
            >
              Nova
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user && <UserAvatarMenu />}
          </div>
        </div>
      </div>
    </nav>
  );
};
