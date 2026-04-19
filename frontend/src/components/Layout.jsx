import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import RightRail from './RightRail';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-[#16171d] text-gray-900 dark:text-gray-100">
      <Navbar />
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-6">
          <aside className="hidden lg:block">
            <Sidebar user={user} />
          </aside>

          <main className="min-w-0">
            <Outlet />
          </main>

          <aside className="hidden lg:block">
            <RightRail />
          </aside>
        </div>
      </div>
    </div>
  );
}

