import { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { seedIfEmpty } from './lib/db';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import GamesPage from './pages/GamesPage';
import CommunityPage from './pages/CommunityPage';
import NewsPage from './pages/NewsPage';
import ProfilePage from './pages/ProfilePage';
import MaintenancePage from './pages/MaintenancePage';
// Void Grid — loaded lazily
const VoidLore       = lazy(() => import('./pages/void/VoidLore'));
const VoidGames      = lazy(() => import('./pages/void/VoidGames'));
const VoidNews       = lazy(() => import('./pages/void/VoidNews'));
const VoidCharacters = lazy(() => import('./pages/void/VoidCharacters'));
// Admin — loaded lazily (recharts lives here)
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminStats     = lazy(() => import('./pages/admin/AdminStats'));
const AdminGames     = lazy(() => import('./pages/admin/AdminGames'));
const AdminAccounts  = lazy(() => import('./pages/admin/AdminAccounts'));
const AdminRoles     = lazy(() => import('./pages/admin/AdminRoles'));

// Seed localStorage with initial data
seedIfEmpty();

const PAGE_MAP = {
  home: () => <HomePage />,
  games: () => <GamesPage />,
  community: () => <CommunityPage />,
  news: () => <NewsPage />,
  profile: () => <ProfilePage />,
  'void-lore': () => <VoidLore />,
  'void-games': () => <VoidGames />,
  'void-news': () => <VoidNews />,
  'void-characters': () => <VoidCharacters />,
  'admin-analytics': () => <AdminAnalytics />,
  'admin-stats': () => <AdminStats />,
  'admin-games': () => <AdminGames />,
  'admin-accounts': () => <AdminAccounts />,
  'admin-roles': () => <AdminRoles />,
};

function AppInner() {
  const { user, userRole, loading, isAdmin } = useAuth();
  const [activePage, setActivePage] = useState('home');
  // 'landing' | 'login' | 'register'
  const [authView, setAuthView] = useState('landing');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-3 h-3 rounded-full animate-glow" style={{ background: '#8b5cf6', animationDelay: `${i * 0.3}s` }} />
          ))}
        </div>
      </div>
    );
  }

  // --- BAKIM MODU ŞALTERİ ---
  const isMaintenanceMode = false;

  if (isMaintenanceMode && !isAdmin && authView !== 'login') {
    return <MaintenancePage onAdminLogin={() => setAuthView('login')} />;
  }

  if (!user) {
    if (authView === 'login')
      return <LoginPage onGoRegister={() => setAuthView('register')} onBack={() => setAuthView('landing')} />;
    if (authView === 'register')
      return <RegisterPage onGoLogin={() => setAuthView('login')} onBack={() => setAuthView('landing')} />;
    return (
      <LandingPage
        onLogin={() => setAuthView('login')}
        onRegister={() => setAuthView('register')}
      />
    );
  }

  const getPage = PAGE_MAP[activePage] || PAGE_MAP['home'];
  
  const DEFAULT_ALLOWED = ['home', 'profile'];
  const hasAccess = isAdmin
    || DEFAULT_ALLOWED.includes(activePage) 
    || (userRole?.allowedPages && (userRole.allowedPages.includes('all') || userRole.allowedPages.includes(activePage)));

  const currentPage = hasAccess ? getPage() : (
    <div className="flex flex-col items-center justify-center p-12 text-center h-full animate-fade-in">
      <div className="mb-4 text-red-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Yetkisiz Erişim</h2>
      <p className="text-slate-400 max-w-md">Bu sayfayı görüntüleme yetkiniz bulunmuyor. Bir hata olduğunu düşünüyorsanız yöneticinizle iletişime geçin.</p>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Sidebar active={activePage} onNav={setActivePage} />
      <main className="flex-1 overflow-y-auto" style={{ minWidth: 0 }}>
        <Suspense fallback={<div style={{ padding: 40, color: '#8b5cf6' }}>Yükleniyor...</div>}>
          <div key={activePage} className="animate-fade-in">
            {currentPage}
          </div>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
