import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import RightRail from './RightRail';
import { useAuth } from '../hooks/useAuth';
import './app-ui.css';

export default function Layout() {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-container app-main">
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
