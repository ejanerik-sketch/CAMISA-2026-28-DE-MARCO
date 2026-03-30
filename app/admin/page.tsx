'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Filter, Download, CheckCircle, Clock, AlertCircle, Users, PlusCircle, LogOut, Trash2, X, Edit2, Minus, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Categories for editing
const CATEGORIES = [
  { 
    id: 'babylook', 
    name: 'Baby Look (R$ 40,00)', 
    sizes: [
      { name: 'PP BABY', price: 40 },
      { name: 'P BABY', price: 40 },
      { name: 'M BABY', price: 40 },
      { name: 'G BABY', price: 40 },
      { name: 'GG BABY', price: 40 },
    ] 
  },
  { 
    id: 'tradicional', 
    name: 'Tradicional (R$ 40,00)', 
    sizes: [
      { name: 'PP TRAD', price: 40 },
      { name: 'P TRAD', price: 40 },
      { name: 'M TRAD', price: 40 },
      { name: 'G TRAD', price: 40 },
      { name: 'GG TRAD', price: 40 },
    ] 
  },
  { 
    id: 'infantil', 
    name: 'Infantil (R$ 35,00)', 
    sizes: [
      { name: '2 ANOS', price: 35 },
      { name: '4 ANOS', price: 35 },
      { name: '6 ANOS', price: 35 },
      { name: '8 ANOS', price: 35 },
      { name: '10 ANOS', price: 35 },
      { name: '12 ANOS', price: 35 },
      { name: '14 ANOS', price: 35 },
      { name: '16 ANOS', price: 35 },
    ] 
  },
  { 
    id: 'especial', 
    name: 'Especial (R$ 45,00)', 
    sizes: [
      { name: 'G1', price: 45 },
      { name: 'G2', price: 45 },
      { name: 'G3', price: 45 },
    ] 
  }
];

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'lista' | 'producao'>('lista');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editedCart, setEditedCart] = useState<any>({});

  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }
    setOrders(data || []);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('logged_in_user') || 'null');
    if (!user) {
      router.push('/login');
      return;
    }
    
    const timer = setTimeout(() => {
      setCurrentUser(user);
      fetchOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = filterStatus === 'Todos' || order.status === filterStatus;
      const matchesSearch = order.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           order.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesDate = true;
      if (startDate && endDate) {
        matchesDate = order.date >= startDate && order.date <= endDate;
      } else if (startDate) {
        matchesDate = order.date >= startDate;
      } else if (endDate) {
        matchesDate = order.date <= endDate;
      }

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [orders, filterStatus, searchQuery, startDate, endDate]);

  const chartData = useMemo(() => {
    const sales: Record<string, number> = {};
    
    filteredOrders.forEach(order => {
      const day = new Date(order.date).toISOString().split('T')[0];
      sales[day] = (sales[day] || 0) + order.total;
    });

    return Object.entries(sales)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, total]) => ({
        name: day.split('-').slice(1).reverse().join('/'), // YYYY-MM-DD -> DD/MM
        vendas: total
      }));
  }, [filteredOrders]);

  const productionSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    filteredOrders.forEach(order => {
      if (order.cart) {
        Object.entries(order.cart).forEach(([category, sizes]: [string, any]) => {
          Object.entries(sizes as Record<string, number>).forEach(([size, qty]) => {
            const key = `${category} - ${size}`;
            summary[key] = (summary[key] || 0) + qty;
          });
        });
      }
    });
    return Object.entries(summary).sort((a, b) => b[1] - a[1]);
  }, [filteredOrders]);

  const sizeStats = useMemo(() => 
    productionSummary.slice(0, 6).map(([size, count]) => ({ size, count })),
  [productionSummary]);

  if (!isMounted || !currentUser) return null;

  const handleExport = () => {
    const headers = ['ID Pedido', 'Cliente', 'Data', 'Origem', 'Itens', 'Total', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => {
        const itemsList = Object.entries(order.cart || {}).map(([cat, sizes]: [string, any]) => 
          Object.entries(sizes).map(([size, qty]) => `${qty}x ${cat}-${size}`).join('; ')
        ).join(' | ');
        return [
          order.id,
          `"${order.name}"`,
          new Date(order.date).toLocaleDateString('pt-BR'),
          `"${order.created_by}"`,
          `"${itemsList}"`,
          order.total.toFixed(2),
          order.status
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus || !currentUser) return;
    
    // Visualizador can only edit their own orders
    if (currentUser.role === 'Visualizador' && selectedOrder.created_by !== currentUser.name) {
      alert('Você só pode alterar o status dos pedidos que você mesmo gerou.');
      return;
    }

    setIsUpdating(true);
    
    let updateData: any = { status: newStatus };
    
    if (isEditingItems) {
      let totalItems = 0;
      let totalPrice = 0;
      
      Object.entries(editedCart).forEach(([catId, sizes]: [string, any]) => {
        const category = CATEGORIES.find(c => c.id === catId);
        Object.entries(sizes).forEach(([sizeName, qty]: [string, any]) => {
          if (qty > 0) {
            totalItems += qty;
            const sizeOption = category?.sizes.find(s => s.name === sizeName);
            if (sizeOption) {
              totalPrice += qty * sizeOption.price;
            }
          }
        });
      });
      
      updateData = {
        ...updateData,
        cart: editedCart,
        items: totalItems,
        total: totalPrice
      };
    }
    
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', selectedOrder.id);

    if (error) {
      console.error('Error updating order:', error);
      alert('Erro ao atualizar pedido.');
      setIsUpdating(false);
      return;
    }

    fetchOrders();
    setSelectedOrder({ ...selectedOrder, ...updateData });
    setIsUpdating(false);
    setIsEditingItems(false);
    alert('Alterações salvas com sucesso!');
  };

  const handleEditCart = (catId: string, sizeName: string, delta: number) => {
    setEditedCart((prev: any) => {
      const currentCat = prev[catId] || {};
      const currentQty = currentCat[sizeName] || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      return {
        ...prev,
        [catId]: {
          ...currentCat,
          [sizeName]: newQty
        }
      };
    });
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder || !currentUser) return;

    if (currentUser.role === 'Visualizador' && selectedOrder.created_by !== currentUser.name) {
      alert('Você só pode apagar os pedidos que você mesmo gerou.');
      return;
    }

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', selectedOrder.id);

    if (error) {
      console.error('Error deleting order:', error);
      alert('Erro ao excluir pedido.');
      return;
    }

    fetchOrders();
    setSelectedOrder(null);
    setConfirmDelete(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('logged_in_user');
    router.push('/login');
  };

  const totalOrders = filteredOrders.length;
  const totalItems = filteredOrders.reduce((acc, order) => acc + order.items, 0);
  const totalRevenue = filteredOrders.reduce((acc, order) => acc + order.total, 0);

  return (
    <main id="admin-report" className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl text-[#0F172A] font-bold">Relatório de Vendas</h1>
          <p className="text-slate-500">Acompanhe o desempenho da campanha 2026.</p>
        </div>
        <div className="flex flex-wrap gap-3 print:hidden">
          {currentUser?.role === 'Administrador' && (
            <Link href="/admin/usuarios" className="flex items-center gap-2 px-6 py-2.5 bg-[#F1F5F9] text-[#334155] font-bold rounded-lg hover:bg-slate-200 transition-colors active:scale-95">
              <Users className="w-4 h-4" />
              Gerenciar Usuários
            </Link>
          )}
          <Link href="/admin/novo-pedido" className="flex items-center gap-2 px-6 py-2.5 bg-[#10B981] text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors active:scale-95">
            <PlusCircle className="w-4 h-4" />
            Lançar Pedido
          </Link>
          <div className="relative group">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#F1F5F9] text-[#334155] font-bold rounded-lg hover:bg-slate-200 transition-colors active:scale-95">
              <Filter className="w-4 h-4" />
              {filterStatus === 'Todos' ? 'Filtrar' : filterStatus}
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {['Todos', 'Pendente', 'Pago', 'Produção', 'Entregue'].map(status => (
                <button 
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          {currentUser?.role !== 'Visualizador' && (
            <button onClick={handleExport} className="flex items-center gap-2 px-6 py-2.5 bg-[#1E3A8A] text-white font-bold rounded-lg hover:bg-blue-900 transition-colors active:scale-95 text-sm">
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors active:scale-95 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-8 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">Total de Pedidos</h3>
          <p className="text-5xl text-[#1E3A8A] font-bold">{totalOrders}</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">Camisetas Vendidas</h3>
          <p className="text-5xl text-[#1E3A8A] font-bold">{totalItems}</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">Receita Total</h3>
          <p className="text-5xl text-[#1E3A8A] font-bold">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-xl text-[#0F172A] font-bold mb-6">Vendas por Dia</h3>
          <div className="h-72 w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `R$${value/1000}k`} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)'}}
                  />
                  <Bar dataKey="vendas" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl"></div>
            )}
          </div>
        </div>

        {/* Size Stats */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-xl text-[#0F172A] font-bold mb-6">Tamanhos Mais Pedidos</h3>
          <div className="space-y-4">
            {sizeStats.map((stat, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-slate-700 font-medium">{stat.size}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#2563EB]" 
                      style={{width: `${(stat.count / 82) * 100}%`}}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-slate-500 w-8 text-right">{stat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
          <h3 className="text-xl text-[#0F172A] font-bold">Últimos Pedidos</h3>
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-600"
              />
              <span className="text-slate-400">até</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-600"
              />
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Limpar filtros de data"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar pedido ou nome..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              />
            </div>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('lista')}
                className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${viewMode === 'lista' ? 'bg-white text-[#1E3A8A] shadow-sm' : 'text-slate-500 hover:text-[#1E3A8A]'}`}
              >
                Lista
              </button>
              <button 
                onClick={() => setViewMode('producao')}
                className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${viewMode === 'producao' ? 'bg-white text-[#1E3A8A] shadow-sm' : 'text-slate-500 hover:text-[#1E3A8A]'}`}
              >
                Produção
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {viewMode === 'lista' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="p-4 font-bold">ID Pedido</th>
                  <th className="p-4 font-bold">Cliente</th>
                  <th className="p-4 font-bold">Data</th>
                  <th className="p-4 font-bold">Origem</th>
                  <th className="p-4 font-bold">Itens</th>
                  <th className="p-4 font-bold">Total</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold print:hidden">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-sm font-bold text-[#1E3A8A]">{order.id}</td>
                    <td className="p-4 font-medium text-slate-800">{order.name}</td>
                    <td className="p-4 text-sm text-slate-500">{new Date(order.date).toLocaleDateString('pt-BR')}</td>
                    <td className="p-4 text-sm text-slate-500">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                        {order.created_by}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{order.items} peças</td>
                    <td className="p-4 font-bold text-slate-800">R$ {order.total.toFixed(2).replace('.', ',')}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                        ${order.status === 'Pago' ? 'bg-green-100 text-green-700' : 
                          order.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700' : 
                          order.status === 'Produção' ? 'bg-blue-100 text-blue-700' : 
                          'bg-gray-100 text-gray-700'}`}
                      >
                        {order.status === 'Pago' && <CheckCircle className="w-3 h-3" />}
                        {order.status === 'Pendente' && <Clock className="w-3 h-3" />}
                        {order.status === 'Produção' && <AlertCircle className="w-3 h-3" />}
                        {order.status === 'Entregue' && <CheckCircle className="w-3 h-3" />}
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 print:hidden">
                      <button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setNewStatus(order.status);
                        }}
                        className="px-4 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-200 transition-colors active:scale-95"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">Nenhum pedido encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="p-4 font-bold">Modelo e Tamanho</th>
                  <th className="p-4 font-bold">Quantidade a Produzir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productionSummary.length > 0 ? productionSummary.map(([size, count]) => (
                  <tr key={size} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{size}</td>
                    <td className="p-4 font-bold text-[#1E3A8A]">{count} peças</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-500">Nenhum item para produção encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-8 flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#0F172A]">Detalhes do Pedido {selectedOrder.id}</h3>
              <button 
                onClick={() => {
                  setSelectedOrder(null);
                  setConfirmDelete(false);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="px-8 pb-8 space-y-8">
              <div className="grid grid-cols-2 gap-y-8">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-2">Cliente</p>
                  <p className="font-bold text-slate-800">{selectedOrder.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-2">Data do Pedido</p>
                  <p className="font-bold text-slate-800">{new Date(selectedOrder.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-2">Origem</p>
                  <p className="font-bold text-slate-800">{selectedOrder.created_by}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-2">Status</p>
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                    <option value="Produção">Produção</option>
                    <option value="Entregue">Entregue</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-8 border-t border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em]">Itens do Pedido</p>
                  {!isEditingItems && (currentUser?.role === 'Administrador' || currentUser?.role === 'Editor' || (currentUser?.role === 'Visualizador' && selectedOrder.created_by === currentUser?.name)) && (
                    <button 
                      onClick={() => {
                        setIsEditingItems(true);
                        setEditedCart(JSON.parse(JSON.stringify(selectedOrder.cart || {})));
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar Itens
                    </button>
                  )}
                </div>
                
                {isEditingItems ? (
                  <div className="space-y-6">
                    {CATEGORIES.map(category => (
                      <div key={category.id} className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="font-bold text-slate-800 mb-3 text-sm">{category.name}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {category.sizes.map(size => {
                            const qty = editedCart[category.id]?.[size.name] || 0;
                            return (
                              <div key={size.name} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                                <span className="text-xs font-bold text-slate-600">{size.name}</span>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleEditCart(category.id, size.name, -1)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-xs font-bold w-4 text-center">{qty}</span>
                                  <button 
                                    onClick={() => handleEditCart(category.id, size.name, 1)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => setIsEditingItems(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700"
                    >
                      Cancelar edição de itens
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedOrder.cart && Object.entries(selectedOrder.cart).map(([category, sizes]: [string, any]) => (
                      Object.entries(sizes).map(([size, qty]: [string, any]) => (
                        qty > 0 && (
                          <div key={`${category}-${size}`} className="flex justify-between items-center">
                            <span className="font-bold text-slate-700 capitalize">{category} - {size}</span>
                            <span className="text-slate-900 font-bold">{qty}x</span>
                          </div>
                        )
                      ))
                    ))}
                  </div>
                )}
              </div>
              
              <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-700">Total</span>
                <span className="text-3xl font-bold text-[#1E3A8A]">
                  R$ {(() => {
                    if (!isEditingItems) return selectedOrder.total.toFixed(2).replace('.', ',');
                    
                    let total = 0;
                    Object.entries(editedCart).forEach(([catId, sizes]: [string, any]) => {
                      const category = CATEGORIES.find(c => c.id === catId);
                      Object.entries(sizes).forEach(([sizeName, qty]: [string, any]) => {
                        const sizeOption = category?.sizes.find(s => s.name === sizeName);
                        if (sizeOption) total += qty * sizeOption.price;
                      });
                    });
                    return total.toFixed(2).replace('.', ',');
                  })()}
                </span>
              </div>
            </div>
            <div className="px-8 py-6 bg-slate-50 flex justify-between gap-3">
              {(currentUser?.role === 'Administrador' || currentUser?.role === 'Editor' || (currentUser?.role === 'Visualizador' && selectedOrder.created_by === currentUser?.name)) ? (
                <button 
                  onClick={handleDeleteOrder}
                  className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95 ${confirmDelete ? 'bg-red-600 text-white hover:bg-red-700' : 'text-red-600 hover:bg-red-50'}`}
                >
                  <Trash2 className="w-4 h-4" />
                  {confirmDelete ? 'Confirmar Exclusão' : 'Excluir Pedido'}
                </button>
              ) : <div></div>}
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setSelectedOrder(null);
                    setConfirmDelete(false);
                    setIsEditingItems(false);
                  }}
                  className="px-8 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors active:scale-95"
                >
                  Fechar
                </button>
                {(currentUser?.role === 'Administrador' || currentUser?.role === 'Editor' || (currentUser?.role === 'Visualizador' && selectedOrder.created_by === currentUser?.name)) && (
                  <button 
                    onClick={handleUpdateStatus}
                    disabled={isUpdating}
                    className="px-8 py-3 rounded-xl bg-[#1E3A8A] text-white font-bold hover:bg-blue-900 transition-colors active:scale-95 disabled:opacity-70 flex items-center gap-2"
                  >
                    {isUpdating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Salvando...
                      </>
                    ) : 'Salvar Alterações'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
