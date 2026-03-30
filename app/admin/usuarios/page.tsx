'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Shield, User, Mail, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Administrador' });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    setUsers(data || []);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('logged_in_user') || 'null');
    if (!user || user.role !== 'Administrador') {
      router.push('/admin');
      return;
    }

    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  if (!isMounted) return null;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    setIsSubmitting(true);

    if (editingUser) {
      const { error } = await supabase
        .from('users')
        .update({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        })
        .eq('id', editingUser.id);

      if (error) {
        console.error('Error updating user:', error);
        alert('Erro ao atualizar usuário.');
        setIsSubmitting(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('users')
        .insert([{
          ...newUser,
          password: 'changeme', // Default password
          status: 'Ativo'
        }]);

      if (error) {
        console.error('Error adding user:', error);
        alert('Erro ao adicionar usuário. Verifique se o e-mail já existe.');
        setIsSubmitting(false);
        return;
      }
    }

    fetchUsers();
    setNewUser({ name: '', email: '', role: 'Administrador' });
    setEditingUser(null);
    setIsSubmitting(false);
  };

  const startEdit = (user: any) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role
    });
    focusNewUser();
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setNewUser({ name: '', email: '', role: 'Administrador' });
  };

  const handleDeleteUser = async (id: any) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      // Auto-reset after 3 seconds if not clicked again
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      alert('Erro ao excluir usuário.');
      return;
    }

    fetchUsers();
    setConfirmDeleteId(null);
  };

  const focusNewUser = () => {
    nameInputRef.current?.focus();
    nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl text-[#0F172A] font-bold">Gerenciar Usuários</h1>
          <p className="text-slate-500">Controle de acesso da equipe paroquial.</p>
        </div>
        <button 
          onClick={focusNewUser}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Usuário
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* New User Form (Sidebar) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h3 className="text-xl text-[#0F172A] font-bold mb-6">
            {editingUser ? 'Editar Membro' : 'Adicionar Membro'}
          </h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  ref={nameInputRef}
                  type="text" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="Ex: Ana Silva" 
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="ana@paroquia.org" 
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nível de Acesso</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                >
                  <option>Administrador</option>
                  <option>Editor</option>
                  <option>Visualizador</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 mt-2 bg-[#1E3A8A] text-white font-bold rounded-xl hover:bg-blue-900 transition-colors active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : (editingUser ? 'Atualizar Usuário' : 'Salvar Usuário')}
              </button>
              {editingUser && (
                <button 
                  type="button" 
                  onClick={cancelEdit}
                  className="w-full py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                >
                  Cancelar Edição
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-xl text-[#0F172A] font-bold">Equipe Cadastrada</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="p-4 font-bold">Usuário</th>
                  <th className="p-4 font-bold">Função</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#2563EB] font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2563EB]">
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                        ${user.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Ativo' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => startEdit(user)}
                          className={`p-2 rounded-lg transition-colors active:scale-95 ${editingUser?.id === user.id ? 'bg-blue-100 text-[#1E3A8A]' : 'text-slate-400 hover:text-[#1E3A8A] hover:bg-slate-100'}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className={`p-2 rounded-lg transition-all active:scale-95 flex items-center gap-1 ${confirmDeleteId === user.id ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                          {confirmDeleteId === user.id && <span className="text-[10px] font-bold">Confirmar?</span>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
