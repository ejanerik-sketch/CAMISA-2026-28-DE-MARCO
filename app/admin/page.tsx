'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Filter, Download, CheckCircle, Clock, AlertCircle, Users, PlusCircle, LogOut, Trash2, X, Edit2, Minus, Plus, FileText, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  }
];

const getPaymentStatus = (status: string) => {
  if (!status) return 'Pendente';
  if (status.includes(' | ')) return status.split(' | ')[0];
  if (['Produção', 'Entregue'].includes(status)) return 'Pendente';
  return status;
};

const getProductionStatus = (status: string) => {
  if (!status) return 'Aguardando';
  if (status.includes(' | ')) return status.split(' | ')[1];
  if (status === 'Produção' || status === 'Em Produção') return 'Produção 1ª ETAPA';
  if (status === 'Entregue') return 'Entregue';
  return 'Aguardando';
};

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'lista' | 'producao'>('lista');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('Todos');
  const [filterProductionStatus, setFilterProductionStatus] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newPaymentStatus, setNewPaymentStatus] = useState<string>('');
  const [newProductionStatus, setNewProductionStatus] = useState<string>('');
  const [editedName, setEditedName] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
      const paymentStatus = getPaymentStatus(order.status);
      const productionStatus = getProductionStatus(order.status);
      
      const matchesPayment = filterPaymentStatus === 'Todos' || paymentStatus === filterPaymentStatus;
      const matchesProduction = filterProductionStatus === 'Todos' || productionStatus === filterProductionStatus;
      
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

      return matchesPayment && matchesProduction && matchesSearch && matchesDate;
    });
  }, [orders, filterPaymentStatus, filterProductionStatus, searchQuery, startDate, endDate]);

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
          const normalizedCategory = category === 'especial' ? 'especiais' : category;
          Object.entries(sizes as Record<string, number>).forEach(([size, qty]) => {
            const key = `${normalizedCategory} - ${size}`;
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
    const headers = ['ID Pedido', 'Cliente', 'Telefone', 'Endereço', 'Grupo', 'Pagamento', 'Data', 'Origem', 'Itens', 'Total', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => {
        const itemsList = Object.entries(order.cart || {}).map(([cat, sizes]: [string, any]) => {
          const normalizedCat = cat === 'especial' ? 'especiais' : cat;
          return Object.entries(sizes).map(([size, qty]) => `${qty}x ${normalizedCat}-${size}`).join('; ');
        }).join(' | ');
        return [
          order.id,
          `"${order.name}"`,
          `"${order.whatsapp}"`,
          `"${order.endereco}"`,
          `"${order.grupo || ''}"`,
          `"${order.pagamento}"`,
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

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('pt-BR');
    const formattedTime = currentDate.toLocaleTimeString('pt-BR');

    doc.setFontSize(18);
    doc.text('Relatório de Produção', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${formattedDate} às ${formattedTime}`, 14, 30);

    const targetStage = filterProductionStatus !== 'Todos' && filterProductionStatus.startsWith('Produção') 
      ? filterProductionStatus 
      : 'Todas as Etapas de Produção';
    
    doc.text(`Etapa: ${targetStage}`, 14, 36);

    const productionOrders = orders.filter(o => {
      const status = getProductionStatus(o.status);
      if (filterProductionStatus !== 'Todos') {
        return status === filterProductionStatus;
      }
      return status.startsWith('Produção');
    });
    
    const summary: Record<string, number> = {};
    productionOrders.forEach(order => {
      const stage = getProductionStatus(order.status);
      if (order.cart) {
        Object.entries(order.cart).forEach(([category, sizes]: [string, any]) => {
          const normalizedCategory = category === 'especial' ? 'especiais' : category;
          Object.entries(sizes as Record<string, number>).forEach(([size, qty]) => {
            if (qty > 0) {
              const key = `${stage} | ${normalizedCategory} - ${size}`;
              summary[key] = (summary[key] || 0) + qty;
            }
          });
        });
      }
    });

    let totalShirts = 0;
    const tableData = Object.entries(summary)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, qty]) => {
        totalShirts += qty;
        const [stage, item] = key.split(' | ');
        return [stage, item, qty.toString()];
      });

    autoTable(doc, {
      startY: 42,
      head: [['Etapa', 'Modelo e Tamanho', 'Quantidade']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] }, // #1E3A8A
      styles: { fontSize: 10 },
    });

    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY || 42;
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de Camisas: ${totalShirts}`, 14, finalY + 10);

    doc.save(`producao_${currentDate.toISOString().split('T')[0]}.pdf`);
  };

  const handleExportSingleOrderPDF = (order: any) => {
    const doc = new jsPDF();
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('pt-BR');
    const formattedTime = currentDate.toLocaleTimeString('pt-BR');

    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // #0F172A
    doc.text(`Detalhes do Pedido ${order.id}`, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${formattedDate} às ${formattedTime}`, 14, 30);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    
    let yPos = 40;
    const lineHeight = 7;

    const addField = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 14, yPos);
      doc.setFont('helvetica', 'normal');
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.text(value, 14 + labelWidth, yPos);
      yPos += lineHeight;
    };

    addField('Cliente', order.name);
    addField('WhatsApp', order.whatsapp);
    addField('Endereço', order.endereco);
    addField('Grupo', order.grupo || 'Nenhum');
    addField('Pagamento', order.pagamento);
    addField('Data do Pedido', new Date(order.date).toLocaleDateString('pt-BR'));
    addField('Origem', order.created_by);
    addField('Status Pagamento', getPaymentStatus(order.status));
    addField('Status Produção', getProductionStatus(order.status));

    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Itens do Pedido', 14, yPos);
    yPos += 8;

    const tableData: string[][] = [];
    if (order.cart) {
      Object.entries(order.cart).forEach(([category, sizes]: [string, any]) => {
        const normalizedCategory = category === 'especial' ? 'especiais' : category;
        Object.entries(sizes as Record<string, number>).forEach(([size, qty]) => {
          if (qty > 0) {
            tableData.push([normalizedCategory, size, qty.toString()]);
          }
        });
      });
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Categoria', 'Tamanho', 'Quantidade']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 }
    });

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total do Pedido: R$ ${order.total.toFixed(2).replace('.', ',')}`, 14, yPos);

    doc.save(`pedido_${order.id}.pdf`);
  };

  const handleSendWhatsApp = (order: any) => {
    if (!currentUser) return;

    const paymentStatus = getPaymentStatus(order.status);
    const productionStatus = getProductionStatus(order.status);
    
    // Mapear etapa para lote
    let loteInfo = productionStatus;
    if (productionStatus.includes('1ª ETAPA')) loteInfo = 'Primeiro Lote';
    else if (productionStatus.includes('2ª ETAPA')) loteInfo = 'Segundo Lote';
    else if (productionStatus.includes('3ª ETAPA')) loteInfo = 'Terceiro Lote';
    else if (productionStatus.includes('4ª ETAPA')) loteInfo = 'Quarto Lote';
    else if (productionStatus.includes('5ª ETAPA')) loteInfo = 'Quinto Lote';

    let itemsList = '';
    if (order.cart) {
      Object.entries(order.cart).forEach(([category, sizes]: [string, any]) => {
        const normalizedCategory = category === 'especial' ? 'especiais' : category;
        Object.entries(sizes as Record<string, number>).forEach(([size, qty]) => {
          if (qty > 0) {
            // Encontrar o nome amigável da categoria
            const catInfo = CATEGORIES.find(c => c.id === normalizedCategory);
            const catName = catInfo ? catInfo.name.split(' (')[0] : normalizedCategory;
            itemsList += `- ${qty}x ${catName} (${size})\n`;
          }
        });
      });
    }

    let message = `Olá, *${order.name}*! Ótimas notícias!\n\n`;
    message += `Aqui é a *${currentUser.name}*, da Paróquia de Fátima. Passando para avisar que as camisas do *${loteInfo}* acabaram de chegar!\n\n`;
    message += `*O pedido foi:*\n${itemsList}\n`;
    
    if (paymentStatus === 'Pendente') {
      message += `*Pagamento:* Pendente\n`;
      message += `*Valor devido:* R$ ${order.total.toFixed(2).replace('.', ',')}\n\n`;
      message += `Você pode pagar via:\n`;
      message += `*PIX CPF:*\n`;
      message += `90231449534\n`;
      message += `*Nome:* Joseane dos Santos Araújo de Oliveira\n`;
      message += `_Ao fazer o pagamento via PIX, favor enviar o comprovante neste mesmo WhatsApp._\n\n`;
      message += `*Dinheiro ou Cartão:* No ato da retirada\n\n`;
    } else {
      message += `*Status do Pagamento:* ${paymentStatus}\n\n`;
    }

    message += `Você já pode vir retirar ou combinar comigo a entrega.\n\n`;
    message += `Estamos muito felizes com o seu pedido!`;

    const phone = order.whatsapp.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newPaymentStatus || !newProductionStatus || !currentUser) return;
    
    // Visualizador can only edit their own orders
    if (currentUser.role === 'Visualizador' && selectedOrder.created_by !== currentUser.name) {
      alert('Você só pode alterar o status dos pedidos que você mesmo gerou.');
      return;
    }

    setIsUpdating(true);
    
    let updateData: any = { status: `${newPaymentStatus} | ${newProductionStatus}`, name: editedName };
    
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
    if (!selectedOrder || !currentUser) {
      alert('Erro: Pedido ou usuário não identificado.');
      return;
    }

    if (currentUser.role === 'Visualizador' && selectedOrder.created_by !== currentUser.name) {
      alert('Você só pode apagar os pedidos que você mesmo gerou.');
      return;
    }

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      const orderId = selectedOrder.id;
      console.log('--- INICIANDO EXCLUSÃO ---');
      console.log('ID do Pedido:', orderId);
      
      // Tentar deletar sem o .select() primeiro para ver se o erro persiste
      // Alguns ambientes Supabase podem ter problemas com .select() em deletes se o RLS for restritivo
      const { error, status } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      console.log('Status da exclusão:', status);

      if (error) {
        console.error('Erro na exclusão:', error);
        alert(`Erro ao excluir: ${error.message} (Código: ${error.code})`);
        return;
      }

      // Como não usamos .select(), verificamos o status. 204 ou 200 geralmente indicam sucesso.
      // Mas para ter certeza absoluta que foi deletado, podemos tentar buscar novamente ou confiar no status.
      // No Supabase, se o delete não encontrar a linha, ele ainda retorna 204 (sucesso sem conteúdo).
      // Então vamos verificar se a linha ainda existe.
      
      const { data: checkData } = await supabase
        .from('orders')
        .select('id')
        .eq('id', orderId)
        .maybeSingle();
      
      if (checkData) {
        console.warn('O pedido ainda existe após o comando de delete. Provavelmente RLS.');
        alert('Atenção: O comando de exclusão foi enviado, mas o pedido ainda consta no banco de dados.\n\nIsso geralmente indica que as permissões de segurança (RLS) do Supabase estão impedindo a exclusão para o seu nível de acesso.');
        setConfirmDelete(false);
        return;
      }

      alert('Pedido excluído com sucesso!');
      
      setSelectedOrder(null);
      setConfirmDelete(false);
      setIsEditingItems(false);
      
      await fetchOrders();
    } catch (err: any) {
      console.error('Exceção na exclusão:', err);
      alert('Erro inesperado: ' + (err.message || 'Erro de conexão'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('logged_in_user');
    router.push('/login');
  };

  const totalOrders = filteredOrders.length;
  const totalItems = filteredOrders.reduce((acc, order) => acc + order.items, 0);
  const totalRevenue = filteredOrders.reduce((acc, order) => acc + order.total, 0);

  const revenuePix = filteredOrders
    .filter(o => getPaymentStatus(o.status) === 'Pago via Pix' || (['Pago', 'Produção', 'Entregue'].includes(o.status) && o.pagamento === 'Pix'))
    .reduce((acc, o) => acc + o.total, 0);
  const revenueDinheiro = filteredOrders
    .filter(o => getPaymentStatus(o.status) === 'Pago via Dinheiro' || (['Pago', 'Produção', 'Entregue'].includes(o.status) && o.pagamento === 'Dinheiro'))
    .reduce((acc, o) => acc + o.total, 0);
  const revenueCartao = filteredOrders
    .filter(o => getPaymentStatus(o.status) === 'Pago via Cartão' || (['Pago', 'Produção', 'Entregue'].includes(o.status) && o.pagamento === 'Cartão'))
    .reduce((acc, o) => acc + o.total, 0);
  const revenuePending = filteredOrders
    .filter(o => getPaymentStatus(o.status) === 'Pendente')
    .reduce((acc, o) => acc + o.total, 0);

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
              {filterPaymentStatus === 'Todos' ? 'Pagamento' : filterPaymentStatus}
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {['Todos', 'Pendente', 'Pago via Pix', 'Pago via Dinheiro', 'Pago via Cartão'].map(status => (
                <button 
                  key={status}
                  onClick={() => setFilterPaymentStatus(status)}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="relative group">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#F1F5F9] text-[#334155] font-bold rounded-lg hover:bg-slate-200 transition-colors active:scale-95">
              <Filter className="w-4 h-4" />
              {filterProductionStatus === 'Todos' ? 'Produção' : filterProductionStatus}
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {['Todos', 'Aguardando', 'Produção 1ª ETAPA', 'Produção 2ª ETAPA', 'Produção 3ª ETAPA', 'Produção 4ª ETAPA', 'Produção 5ª ETAPA', 'Entregue'].map(status => (
                <button 
                  key={status}
                  onClick={() => setFilterProductionStatus(status)}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          {currentUser?.role !== 'Visualizador' && (
            <>
              <button onClick={handleExportPDF} className="flex items-center gap-2 px-6 py-2.5 bg-[#F59E0B] text-white font-bold rounded-lg hover:bg-amber-600 transition-colors active:scale-95 text-sm">
                <FileText className="w-4 h-4" />
                Exportar Produção (PDF)
              </button>
              <button onClick={handleExport} className="flex items-center gap-2 px-6 py-2.5 bg-[#1E3A8A] text-white font-bold rounded-lg hover:bg-blue-900 transition-colors active:scale-95 text-sm">
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            </>
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

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Pago via Pix</h3>
            <p className="text-2xl text-emerald-600 font-bold">R$ {revenuePix.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Pago via Dinheiro</h3>
            <p className="text-2xl text-emerald-600 font-bold">R$ {revenueDinheiro.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Pago via Cartão</h3>
            <p className="text-2xl text-emerald-600 font-bold">R$ {revenueCartao.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Pendente</h3>
            <p className="text-2xl text-amber-600 font-bold">R$ {revenuePending.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
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
                  <th className="p-4 font-bold">Telefone</th>
                  <th className="p-4 font-bold">Grupo</th>
                  <th className="p-4 font-bold">Endereço</th>
                  <th className="p-4 font-bold">Pagamento</th>
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
                    <td className="p-4 text-sm text-slate-600 font-medium">{order.whatsapp}</td>
                    <td className="p-4 text-sm text-slate-500">{order.grupo || '-'}</td>
                    <td className="p-4 text-sm text-slate-500 max-w-[200px] truncate" title={order.endereco}>{order.endereco}</td>
                    <td className="p-4 text-sm text-slate-500">{order.pagamento}</td>
                    <td className="p-4 text-sm text-slate-500">{new Date(order.date).toLocaleDateString('pt-BR')}</td>
                    <td className="p-4 text-sm text-slate-500">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                        {order.created_by}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{order.items} peças</td>
                    <td className="p-4 font-bold text-slate-800">R$ {order.total.toFixed(2).replace('.', ',')}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                          ${getPaymentStatus(order.status).startsWith('Pago') ? 'bg-green-100 text-green-700' : 
                            getPaymentStatus(order.status) === 'Pendente' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-gray-100 text-gray-700'}`}
                        >
                          {getPaymentStatus(order.status).startsWith('Pago') && <CheckCircle className="w-3 h-3" />}
                          {getPaymentStatus(order.status) === 'Pendente' && <Clock className="w-3 h-3" />}
                          {getPaymentStatus(order.status)}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                          ${getProductionStatus(order.status) === 'Entregue' ? 'bg-green-100 text-green-700' : 
                            getProductionStatus(order.status).startsWith('Produção') ? 'bg-blue-100 text-blue-700' : 
                            'bg-gray-100 text-gray-700'}`}
                        >
                          {getProductionStatus(order.status) === 'Entregue' && <CheckCircle className="w-3 h-3" />}
                          {getProductionStatus(order.status).startsWith('Produção') && <AlertCircle className="w-3 h-3" />}
                          {getProductionStatus(order.status) === 'Aguardando' && <Clock className="w-3 h-3" />}
                          {getProductionStatus(order.status)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 print:hidden">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewPaymentStatus(getPaymentStatus(order.status));
                            setNewProductionStatus(getProductionStatus(order.status));
                            setEditedName(order.name);
                          }}
                          className="px-4 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-200 transition-colors active:scale-95"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          onClick={() => handleExportSingleOrderPDF(order)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors active:scale-95"
                          title="Baixar Pedido em PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSendWhatsApp(order)}
                          className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors active:scale-95"
                          title="Enviar Mensagem WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col h-full max-h-[90vh]">
            <div className="p-6 md:p-8 flex justify-between items-center shrink-0 border-b border-slate-100">
              <h3 className="text-xl font-bold text-[#0F172A]">Detalhes do Pedido {selectedOrder.id}</h3>
              <button 
                onClick={() => {
                  setSelectedOrder(null);
                  setConfirmDelete(false);
                  setIsEditingItems(false);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 md:px-8 py-6 md:py-8 space-y-8 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
              <div className="grid grid-cols-2 gap-y-6 md:gap-y-8">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-2">Cliente</p>
                  {(currentUser?.role === 'Administrador' || currentUser?.role === 'Editor' || (currentUser?.role === 'Visualizador' && selectedOrder.created_by === currentUser?.name)) ? (
                    <input 
                      type="text" 
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                    />
                  ) : (
                    <p className="font-bold text-slate-800">{selectedOrder.name}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-2">WhatsApp</p>
                  <p className="font-bold text-slate-800">{selectedOrder.whatsapp}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-2">Endereço</p>
                  <p className="font-bold text-slate-800">{selectedOrder.endereco}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-2">Grupo</p>
                  <p className="font-bold text-slate-800">{selectedOrder.grupo || 'Nenhum'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-2">Pagamento</p>
                  <p className="font-bold text-slate-800">{selectedOrder.pagamento}</p>
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
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-2">Status Pagamento</p>
                  <select 
                    value={newPaymentStatus}
                    onChange={(e) => setNewPaymentStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago via Pix">Pago via Pix</option>
                    <option value="Pago via Dinheiro">Pago via Dinheiro</option>
                    <option value="Pago via Cartão">Pago via Cartão</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-2">Status Produção</p>
                  <select 
                    value={newProductionStatus}
                    onChange={(e) => setNewProductionStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-700"
                  >
                    <option value="Aguardando">Aguardando</option>
                    <option value="Produção 1ª ETAPA">Produção 1ª ETAPA</option>
                    <option value="Produção 2ª ETAPA">Produção 2ª ETAPA</option>
                    <option value="Produção 3ª ETAPA">Produção 3ª ETAPA</option>
                    <option value="Produção 4ª ETAPA">Produção 4ª ETAPA</option>
                    <option value="Produção 5ª ETAPA">Produção 5ª ETAPA</option>
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
                        const currentCart = JSON.parse(JSON.stringify(selectedOrder.cart || {}));
                        if (currentCart['especial']) {
                          currentCart['especiais'] = { ...(currentCart['especiais'] || {}), ...currentCart['especial'] };
                          delete currentCart['especial'];
                        }
                        setEditedCart(currentCart);
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
                      <div key={category.id} className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100">
                        <h4 className="font-bold text-slate-800 mb-3 text-sm">{category.name}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {category.sizes.map(size => {
                            const qty = editedCart[category.id]?.[size.name] || 0;
                            return (
                              <div key={size.name} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                <span className="text-[11px] font-bold text-slate-600 truncate mr-1">{size.name}</span>
                                <div className="flex items-center gap-1.5">
                                  <button 
                                    onClick={() => handleEditCart(category.id, size.name, -1)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-xs font-bold w-5 text-center">{qty}</span>
                                  <button 
                                    onClick={() => handleEditCart(category.id, size.name, 1)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 transition-colors"
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
                    <div className="flex justify-center">
                      <button 
                        onClick={() => setIsEditingItems(false)}
                        className="text-sm font-bold text-slate-500 hover:text-slate-700 underline underline-offset-4"
                      >
                        Cancelar edição de itens
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedOrder.cart && Object.entries(selectedOrder.cart).map(([category, sizes]: [string, any]) => {
                      const normalizedCategory = category === 'especial' ? 'especiais' : category;
                      return Object.entries(sizes).map(([size, qty]: [string, any]) => (
                        qty > 0 && (
                          <div key={`${normalizedCategory}-${size}`} className="flex justify-between items-center">
                            <span className="font-bold text-slate-700 capitalize">{normalizedCategory} - {size}</span>
                            <span className="text-slate-900 font-bold">{qty}x</span>
                          </div>
                        )
                      ));
                    })}
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
            <div className="px-8 py-6 bg-slate-50 flex justify-between gap-3 shrink-0 border-t border-slate-100">
              {(currentUser?.role === 'Administrador' || currentUser?.role === 'Editor' || (currentUser?.role === 'Visualizador' && selectedOrder.created_by === currentUser?.name)) ? (
                <div className="flex gap-2">
                  <button 
                    onClick={handleDeleteOrder}
                    disabled={isDeleting}
                    className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95 ${confirmDelete ? 'bg-red-600 text-white hover:bg-red-700' : 'text-red-600 hover:bg-red-50'} disabled:opacity-50`}
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        {confirmDelete ? 'Confirmar Agora' : 'Excluir Pedido'}
                      </>
                    )}
                  </button>
                  {confirmDelete && !isDeleting && (
                    <button 
                      onClick={() => setConfirmDelete(false)}
                      className="px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
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
