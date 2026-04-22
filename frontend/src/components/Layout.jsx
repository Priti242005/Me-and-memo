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
        <div className="app-layout">
          <aside className="app-left-col">
            <Sidebar user={user} />
          </aside>

          <main className="app-center-col">
            <Outlet />
          </main>

          <aside className="app-right-col">
            <RightRail />
          </aside>
        </div>
      </div>
    </div>
  );
}
