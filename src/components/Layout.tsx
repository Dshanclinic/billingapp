import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react';
import Logo from './Logo';

export default function Layout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-500 text-white'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  const isRoomUser = profile?.role === 'room_user';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="no-print bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="sm" />

            {!isRoomUser && (
              <nav className="flex items-center gap-1">
                <NavLink to="/" className={navLinkClass} end>
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">ড্যাশবোর্ড</span>
                </NavLink>
                <NavLink to="/history?type=hospital" className={navLinkClass}>
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">বিল ইতিহাস</span>
                </NavLink>
                {profile?.role === 'admin' && (
                  <NavLink to="/settings" className={navLinkClass}>
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">সেটিংস</span>
                  </NavLink>
                )}
              </nav>
            )}

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden sm:block">
                {profile?.full_name || profile?.email}
                {isRoomUser && profile?.room_type && (
                  <span className="ml-1 text-xs text-gray-400">({profile.room_type})</span>
                )}
              </span>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="লগআউট"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
