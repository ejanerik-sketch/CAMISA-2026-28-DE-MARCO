'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, ShoppingBag, User, MapPin, Phone, CreditCard, Minus, Plus, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type SizeOption = {
  name: string;
  price: number;
};

type SizeCategory = {
  id: string;
  name: string;
  subtitle?: string;
  sizes: SizeOption[];
};

const CATEGORIES: SizeCategory[] = [
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
    ] 
  },
  { 
    id: 'especiais', 
    name: 'Tamanhos Especiais (G1 a G3: R$ 50,00 | G4 e G5: R$ 60,00)', 
    sizes: [
      { name: 'G1', price: 50 },
      { name: 'G2', price: 50 },
      { name: 'G3', price: 50 },
      { name: 'G4', price: 60 },
      { name: 'G5', price: 60 },
    ] 
  },
];

export default function NovoPedido() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cart, setCart] = useState<Record<string, Record<string, number>>>({});
  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    endereco: '',
    grupo: '',
    pagamento: '',
    status: 'Pendente'
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    const user = JSON.parse(sessionStorage.getItem('logged_in_user') || 'null');
    if (!user) {
      router.push('/login');
      return;
    }
  }, [router]);

  if (!isMounted) return null;

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}${value.length > 7 ? '-' + value.slice(7) : ''}`;
    }
    
    setFormData({...formData, whatsapp: value});
  };

  const updateQuantity = (categoryId: string, size: string, delta: number) => {
    setCart(prev => {
      const currentCat = prev[categoryId] || {};
      const currentQty = currentCat[size] || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      return {
        ...prev,
        [categoryId]: {
          ...currentCat,
          [size]: newQty
        }
      };
    });
  };

  const getTotalItems = () => {
    let total = 0;
    Object.values(cart).forEach(cat => {
      Object.values(cat).forEach(qty => {
        total += qty;
      });
    });
    return total;
  };

  const getTotalPrice = () => {
    let total = 0;
    CATEGORIES.forEach(category => {
      const catItems = cart[category.id] || {};
      category.sizes.forEach(sizeOption => {
        const qty = catItems[sizeOption.name] || 0;
        total += qty * sizeOption.price;
      });
    });
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (getTotalItems() === 0) {
      alert('Selecione pelo menos uma camisa para fazer o pedido.');
      return;
    }
    setIsSubmitting(true);
    
    const currentUser = JSON.parse(sessionStorage.getItem('logged_in_user') || '{"name": "Admin"}');

    const orderData = {
      id: `PED26-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: formData.nome,
      whatsapp: formData.whatsapp,
      endereco: formData.endereco,
      grupo: formData.grupo,
      pagamento: formData.pagamento,
      status: formData.status,
      items: getTotalItems(),
      total: getTotalPrice(),
      cart,
      created_by: currentUser.name,
      date: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('orders')
      .insert([orderData]);

    if (error) {
      console.error('Error saving order:', error);
      alert('Erro ao salvar pedido.');
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      alert('Pedido lançado com sucesso!');
      window.location.href = '/admin';
    }, 800);
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-[#1E3A8A] transition-colors active:scale-95">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl text-[#0F172A] font-bold">Lançar Novo Pedido</h1>
          <p className="text-slate-500">Insira manualmente um pedido recebido presencialmente ou por outro canal.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
        
        {/* Dados do Cliente */}
        <section>
          <h2 className="text-xl font-bold text-[#1E3A8A] mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5" />
            Dados do Cliente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Nome Completo *</label>
              <input 
                required 
                type="text" 
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                placeholder="Ex: Maria José" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">WhatsApp *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required 
                  type="tel" 
                  value={formData.whatsapp}
                  onChange={handleWhatsappChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="(00) 00000-0000" 
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Endereço *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required 
                  type="text" 
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="Rua, número, bairro" 
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Nome do Grupo ou Pastoral</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={formData.grupo}
                  onChange={(e) => setFormData({...formData, grupo: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="Ex: Grupo de Jovens, Pastoral da Saúde" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Itens do Pedido */}
        <section>
          <h2 className="text-xl font-bold text-[#1E3A8A] mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShoppingBag className="w-5 h-5" />
            Itens do Pedido
          </h2>
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <div className="space-y-10">
              {CATEGORIES.map((category) => (
                <div key={category.id}>
                  <h4 className="font-bold text-[#0F172A] text-lg mb-6 border-b border-slate-200 pb-3">
                    {category.name}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {category.sizes.map((sizeOption) => {
                      const qty = cart[category.id]?.[sizeOption.name] || 0;
                      return (
                        <div key={sizeOption.name} className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col items-center shadow-sm hover:border-blue-200 transition-colors">
                          <span className="text-sm font-bold text-[#0F172A] mb-1 text-center">{sizeOption.name}</span>
                          <span className="text-xs text-slate-500 mb-4 font-medium">R$ {sizeOption.price.toFixed(2).replace('.', ',')}</span>
                          
                          <div className="flex items-center justify-between w-full border border-slate-200 rounded-xl p-1 bg-slate-50">
                            <button 
                              type="button" 
                              onClick={() => updateQuantity(category.id, sizeOption.name, -1)}
                              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-[#1E3A8A] w-6 text-center">{qty}</span>
                            <button 
                              type="button" 
                              onClick={() => updateQuantity(category.id, sizeOption.name, 1)}
                              className="w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Calculado</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#1E3A8A]">R$ {getTotalPrice().toFixed(2).replace('.', ',')}</span>
                  <span className="text-sm text-slate-500 font-medium">({getTotalItems()} peças)</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Forma de Pagamento *</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    required 
                    value={formData.pagamento}
                    onChange={(e) => setFormData({...formData, pagamento: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão">Cartão</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status */}
        <section>
          <h2 className="text-xl font-bold text-[#1E3A8A] mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            Status Inicial
          </h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="status" 
                value="Pendente" 
                checked={formData.status === 'Pendente'}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
              />
              <span className="text-slate-700 font-medium">Pendente</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="status" 
                value="Pago" 
                checked={formData.status === 'Pago'}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
              />
              <span className="text-slate-700 font-medium">Pago</span>
            </label>
          </div>
        </section>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
          <Link href="/admin" className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors active:scale-95">
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#1E3A8A] text-white font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-900 transition-all active:scale-95 disabled:opacity-70 disabled:scale-100"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Pedido
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
