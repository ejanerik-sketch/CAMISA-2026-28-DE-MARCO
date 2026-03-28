'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Minus, Plus, FileText, ArrowRight, ArrowLeft, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

export default function Home() {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, Record<string, number>>>({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    endereco: '',
    grupo: '',
    pagamento: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const slides = [
    {
      url: "http://janerik.com.br/wp-content/uploads/2026/03/HOMEM-CAMISA-2026-FESTA-DA-PADROEIRA-scaled.jpg",
      label: "Modelo Tradicional"
    },
    {
      url: "http://janerik.com.br/wp-content/uploads/2026/03/CAMISA-2026-FESTA-DA-PADROEIRA-scaled.jpg",
      label: "Modelo Baby Look"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const updateQuantity = (categoryId: string, size: string, delta: number) => {
    setCart(prev => {
      const currentCat = prev[categoryId] || {};
      const currentQty = currentCat[size] || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      if (newQty === currentQty) return prev;

      return {
        ...prev,
        [categoryId]: {
          ...currentCat,
          [size]: newQty
        }
      };
    });
  };

  const totalItems = (() => {
    let total = 0;
    Object.values(cart).forEach(cat => {
      Object.values(cat).forEach(qty => {
        total += qty;
      });
    });
    return total;
  })();

  const totalPrice = (() => {
    let total = 0;
    CATEGORIES.forEach(category => {
      const catItems = cart[category.id] || {};
      category.sizes.forEach(sizeOption => {
        const qty = catItems[sizeOption.name] || 0;
        total += qty * sizeOption.price;
      });
    });
    return total;
  })();

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}${value.length > 7 ? '-' + value.slice(7) : ''}`;
    }
    
    setFormData({...formData, whatsapp: value});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalItems === 0) {
      alert('Selecione pelo menos uma camisa para fazer o pedido.');
      return;
    }

    setIsSubmitting(true);

    const orderData = {
      ...formData,
      name: formData.nome,
      grupo: formData.grupo,
      items: totalItems,
      cart,
      total: totalPrice,
      status: 'Pendente',
      id: `PED26-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      date: new Date().toISOString(),
      createdBy: 'Direto do site'
    };

    const { error } = await supabase
      .from('orders')
      .insert([orderData]);

    if (error) {
      console.error('Error saving order:', error);
      alert('Erro ao salvar pedido. Tente novamente.');
      setIsSubmitting(false);
      return;
    }

    sessionStorage.setItem('lastOrder', JSON.stringify(orderData));
    
    setTimeout(() => {
      router.push('/sucesso');
    }, 600);
  };

  return (
    <div className="relative pb-32 bg-[#F8FAFC]">
      {/* Section 1: Hero */}
      <section className="relative overflow-hidden pt-4 md:pt-8 pb-16 px-6 lg:px-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 space-y-8 z-10 text-center md:text-left"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 font-bold text-xs border border-blue-100 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Conexão Exclusiva 2026
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-[#0F172A] tracking-tighter leading-[0.85]">
            <span className="text-2xl md:text-4xl block mb-2 font-bold opacity-90">Vista sua fé na</span>
            <span className="text-[#007AFF] italic font-serif">Festa da<br/>Padroeira</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-md mx-auto md:mx-0 leading-relaxed font-medium">
            Todos em unidade vestindo a mesma camisa. Adquira já a sua e participe desse momento especial de devoção.
          </p>
          <div className="pt-8 flex justify-center md:justify-start">
            <a 
              href="#order-form" 
              className="group relative inline-flex items-center justify-center px-12 py-6 rounded-2xl bg-[#1E3A8A] text-white font-bold text-xl overflow-hidden transition-all hover:scale-[1.05] active:scale-95 shadow-2xl shadow-blue-900/40"
            >
              <span className="relative z-10">Fazer Pedido Agora</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-0 group-hover:w-full transition-all duration-500" />
            </a>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 relative w-full aspect-[4/3] md:aspect-square max-w-2xl mx-auto"
        >
          {/* Decorative background blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-400/30 rounded-full blur-[120px] -z-10 animate-pulse"></div>
          
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full relative"
          >
            <Image 
              src="http://janerik.com.br/wp-content/uploads/2026/03/mockup-2-CAMISA-2026-FESTA-DA-PADROEIRA.jpg" 
              alt="Mockup Geral" 
              fill
              className="object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.25)]"
              unoptimized
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Section 2: Models Showcase */}
      <section className="py-12 md:py-32 bg-[#0F172A] px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between relative">
            <button 
              onClick={prevSlide}
              className="absolute left-4 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all backdrop-blur-md shrink-0 z-30"
            >
              <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            
            <div className="flex-1 flex flex-col gap-8">
              <div className="relative aspect-[3/4] md:aspect-[21/9] max-h-[700px] overflow-hidden rounded-[2.5rem] group shadow-2xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0"
                  >
                    <Image 
                      src={slides[currentSlide].url}
                      alt={slides[currentSlide].label}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex flex-col items-center text-center mt-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-center gap-4">
                      <div className="h-[1px] w-12 bg-blue-500" />
                      <span className="text-blue-400 text-xs md:text-sm font-black tracking-[0.3em] uppercase">
                        Conexão 2026
                      </span>
                      <div className="h-[1px] w-12 bg-blue-500" />
                    </div>
                    <h3 className="text-white text-3xl md:text-6xl font-black tracking-tighter leading-none italic font-serif">
                      {slides[currentSlide].label}
                    </h3>
                    <p className="text-white/40 text-sm md:text-lg font-medium max-w-md mx-auto tracking-wide">
                      Design exclusivo desenvolvido para celebrar a unidade de nossa paróquia.
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <button 
              onClick={nextSlide}
              className="absolute right-4 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all backdrop-blur-md shrink-0 z-30"
            >
              <ArrowRight className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          </div>
          
          <div className="flex justify-center gap-3 mt-10">
            {slides.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-12 bg-blue-500' : 'w-3 bg-white/20'}`}
              />
            ))}
          </div>
        </div>
        
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-600/10 blur-[120px] rounded-full -z-0" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-900/20 blur-[120px] rounded-full -z-0" />
      </section>

      {/* Section 3: Instructions */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-[#2563EB] p-8 md:p-10">
          <div className="flex items-center gap-3 mb-10">
            <FileText className="w-7 h-7 text-[#1E3A8A]" />
            <h2 className="text-2xl font-bold text-[#1E3A8A]">Como fazer seu pedido</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-10">
            <div className="flex gap-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-[#DBEAFE] text-[#2563EB] font-bold flex items-center justify-center text-lg">1</div>
              <div>
                <h4 className="font-bold text-[#0F172A] text-lg mb-1">Tire suas medidas</h4>
                <p className="text-slate-600 leading-relaxed">Recomendamos que tire as medidas das camisas durante as missas antes de realizar o pedido por aqui.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-[#DBEAFE] text-[#2563EB] font-bold flex items-center justify-center text-lg">2</div>
              <div>
                <h4 className="font-bold text-[#0F172A] text-lg mb-1">Preencha seus dados</h4>
                <p className="text-slate-600 leading-relaxed">Informe seu nome, WhatsApp, endereço e, se participar, seu grupo ou pastoral.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-[#DBEAFE] text-[#2563EB] font-bold flex items-center justify-center text-lg">3</div>
              <div>
                <h4 className="font-bold text-[#0F172A] text-lg mb-1">Escolha os tamanhos</h4>
                <p className="text-slate-600 leading-relaxed">Selecione as quantidades e tamanhos desejados. O valor total será calculado automaticamente.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-[#DBEAFE] text-[#2563EB] font-bold flex items-center justify-center text-lg">4</div>
              <div>
                <h4 className="font-bold text-[#0F172A] text-lg mb-1">Finalize e pague</h4>
                <p className="text-slate-600 leading-relaxed">Ao finalizar, você será direcionado ao WhatsApp para enviar o pedido e o comprovante do PIX.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-5 flex items-start gap-3">
            <AlertTriangle className="text-[#D97706] shrink-0 w-6 h-6" />
            <p className="text-[#B45309] font-medium">
              <strong className="font-bold">Atenção:</strong> O seu pedido só será validado e produzido após a confirmação do pagamento via PIX.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 & 5: Order Form */}
      <section id="order-form" className="py-12 px-6">
        <div className="max-w-5xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-3xl text-[#0F172A] font-bold mb-10 text-center">Formulário de Pedido</h2>
          
          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Buyer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Nome Completo *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="Como devemos chamar você?" 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">WhatsApp *</label>
                <input 
                  required 
                  type="tel" 
                  value={formData.whatsapp}
                  onChange={handleWhatsappChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="(00) 00000-0000" 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Endereço Completo *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="Rua, número, bairro" 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Grupo / Movimento / Pastoral (Opcional)</label>
                <input 
                  type="text" 
                  value={formData.grupo}
                  onChange={(e) => setFormData({...formData, grupo: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="Ex: Terço dos Homens" 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Forma de Pagamento *</label>
                <select 
                  required 
                  value={formData.pagamento}
                  onChange={(e) => setFormData({...formData, pagamento: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                >
                  <option value="">Selecione...</option>
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão</option>
                </select>
              </div>
            </div>

            {/* Size Grid */}
            <div className="space-y-10 pt-6 border-t border-slate-100">
              {CATEGORIES.map((category) => (
                <div key={category.id}>
                  <h4 className="font-bold text-[#0F172A] text-lg mb-6 border-b border-slate-100 pb-3">
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

            {/* Hidden submit button to allow form submission via the sticky bar */}
            <button type="submit" id="hidden-submit" className="hidden">Submit</button>
          </form>
        </div>
      </section>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-40 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Total de Peças</span>
              <span className="text-xl font-black text-[#1E3A8A]">{totalItems} <span className="text-xs font-medium text-slate-400 uppercase">Unidades</span></span>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Valor Total</span>
              <span className="text-xl font-black text-[#1E3A8A]">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
          <button 
            onClick={() => document.getElementById('hidden-submit')?.click()}
            disabled={isSubmitting || totalItems === 0}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#1E3A8A] text-white font-bold shadow-xl shadow-blue-900/20 hover:bg-blue-900 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processando...
              </>
            ) : (
              <>
                <span>Finalizar Pedido</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
