'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Settings, Users, LogOut } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const isSuccess = pathname === '/sucesso';
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('logged_in_user') || 'null');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(loggedInUser);
  }, [pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem('logged_in_user');
    window.location.href = '/login';
  };

  if (isLogin || isSuccess) return null;

  return (
    <header className="w-full bg-white border-b border-blue-200 sticky top-0 z-50 shadow-sm shadow-blue-900/5">
      <nav className="flex justify-between items-center w-full px-6 py-3 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-14 h-14 overflow-hidden">
             <Image 
                src="http://janerik.com.br/wp-content/uploads/2026/03/LOGO-PAROQUIAAtivo-1.png" 
                alt="Logo Paróquia" 
                fill 
                className="object-contain"
                unoptimized
             />
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {user?.role === 'Administrador' && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link 
                href="/admin/usuarios" 
                className="flex flex-col items-center justify-center text-[#1E3A8A] hover:text-blue-600 transition-colors group"
              >
                <div className="w-10 h-10 bg-[#F0F6FF] rounded-xl flex items-center justify-center mb-1 group-hover:bg-blue-100 transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase">Usuários</span>
              </Link>
            </motion.div>
          )}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
          >
            <Link 
              href={user ? "/admin" : "/login"} 
              className="flex flex-col items-center justify-center text-[#1E3A8A] hover:text-blue-600 transition-colors group"
            >
              <div className="w-10 h-10 bg-[#F0F6FF] rounded-xl flex items-center justify-center mb-1 group-hover:bg-blue-100 transition-colors">
                <Settings className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase">{user ? "Painel" : "Gerenciar"}</span>
            </Link>
          </motion.div>

          {user && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
            >
              <button 
                onClick={handleLogout}
                className="flex flex-col items-center justify-center text-red-600 hover:text-red-700 transition-colors group"
              >
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-1 group-hover:bg-red-100 transition-colors">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase">Sair</span>
              </button>
            </motion.div>
          )}
        </div>
      </nav>
    </header>
  );
}
