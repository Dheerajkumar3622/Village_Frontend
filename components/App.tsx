
import React, { useState, useEffect } from 'react';
import { PassengerView } from './PassengerView';
import { DriverView } from './DriverView';
import { AdminView } from './AdminView';
import { AuthView } from './AuthView';
import { ShopkeeperView } from './ShopkeeperView'; 
import { UserProfile } from './UserProfile';
import { User } from '../types';
import { getCurrentUser, logoutUser, getAuthToken } from '../services/authService';
import { initSocketConnection } from '../services/transportService';
import { getRoutes } from '../services/adminService';
import { setUniversalRoutes } from '../services/graphService';
import { playSonicToken } from '../services/advancedFeatures';
import { initializeGeoData } from '../constants';
import { Moon, Sun, LogOut, Languages } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState<'HOME' | 'PROFILE'>('HOME');
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');

  useEffect(() => {
    // Start fetching map data immediately
    initializeGeoData();
    
    // Fetch Universal Routes and register them to Graph Service
    getRoutes().then(routes => {
       if (routes.length > 0) setUniversalRoutes(routes);
    });

    const currentUser = getCurrentUser();
    const token = getAuthToken();
    if (currentUser && token) {
      setUser(currentUser);
      initSocketConnection();
    }

    const handleAuthError = () => {
      alert("Session Expired: You have logged in on another device.");
      handleLogout();
    };
    window.addEventListener('auth_error', handleAuthError);

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);
  const toggleLang = () => setLang(prev => prev === 'EN' ? 'HI' : 'EN');

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setView('HOME');
  };

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    initSocketConnection();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-500">
      
      <div className="max-w-4xl mx-auto min-h-screen relative flex flex-col p-4">
        
        {/* Fixed Header */}
        <header className="sticky top-0 z-50 flex justify-between items-center py-4 mb-6 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md -mx-4 px-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('HOME')}>
            <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-brand-400 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">V</div>
            <span className="font-bold text-xl tracking-tight dark:text-white">Village<span className="text-brand-600 dark:text-brand-400">Link</span></span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button onClick={toggleLang} className="px-3 py-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1">
               <Languages size={14} />
               {lang === 'EN' ? 'अ' : 'A'}
            </button>

            <button onClick={toggleTheme} className="p-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user && (
              <button onClick={handleLogout} className="p-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-red-500 dark:text-red-400 shadow-sm border border-slate-200 dark:border-slate-700">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </header>

        <main className="relative flex-grow">
          {!user ? (
            <div className="my-auto py-10">
              <AuthView onSuccess={handleLoginSuccess} lang={lang} />
            </div>
          ) : (
            view === 'PROFILE' ? (
              <UserProfile user={user} onBack={() => setView('HOME')} />
            ) : (
              <>
                {user.role === 'ADMIN' && <AdminView user={user} />}
                {user.role === 'PASSENGER' && <PassengerView user={user} lang={lang} />}
                {user.role === 'DRIVER' && <DriverView user={user} lang={lang} />}
                {user.role === 'SHOPKEEPER' && <ShopkeeperView user={user} />}
              </>
            )
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
