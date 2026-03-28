'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Copy, Download, MessageCircle, PlusCircle, Settings, Image as ImageIcon } from 'lucide-react';

export default function Sucesso() {
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('lastOrder');
    if (saved) {
      // Use a timeout to avoid synchronous setState in effect
      setTimeout(() => {
        setOrder(JSON.parse(saved));
      }, 0);
    }
  }, []);

  const handleWhatsApp = () => {
    if (!order) return;

    let itemsText = '';
    Object.entries(order.cart).forEach(([catId, sizes]: [string, any]) => {
      Object.entries(sizes).forEach(([size, qty]: [string, any]) => {
        if (qty > 0) {
          itemsText += `• ${qty}x ${catId.toUpperCase()} - ${size}\n`;
        }
      });
    });

    const msg = `> Camisas Festa de Nossa Senhora de Fátima 2026
  
Pedido: ${order.id}
Nome: ${order.nome}
WhatsApp: ${order.whatsapp}
Endereço: ${order.endereco}
Grupo: ${order.grupo || 'Nenhum'}
Forma de Pagamento: ${order.pagamento}

ITENS:
${itemsText}
TOTAL: R$ ${order.total.toFixed(2).replace('.', ',')}

Caso queira pagar diretamente pelo PIX, segue o código:
PIX CPF
90231449534 

Nome de: Joseane dos Santos Araújo de Oliveira

Ao fazer o pagamento, enviar o comprovante neste mesmo WhatsApp.

Deus abençoe!`;

    const encodedMsg = encodeURIComponent(msg);
    // Número do WhatsApp atualizado conforme solicitado
    window.open(`https://api.whatsapp.com/send?phone=5573988030447&text=${encodedMsg}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-pulse text-slate-500 font-medium">Carregando pedido...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-only { display: block !important; }
          #pdf-content { 
            display: block !important; 
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          section {
            break-inside: avoid;
            margin-bottom: 2rem !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
          }
          .max-w-4xl { max-width: 100% !important; width: 100% !important; }
        }
        .print-only { display: none; }
      `}</style>
      
      {/* Print-only Header */}
      <div className="hidden print-only p-8 border-b-2 border-[#1E3A8A] mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <Image 
                src="http://janerik.com.br/wp-content/uploads/2026/03/LOGO-PAROQUIAAtivo-1.png" 
                alt="Logo Paróquia" 
                fill 
                className="object-contain"
                unoptimized
              />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1E3A8A] tracking-tighter uppercase">Festa da Padroeira</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Comprovante de Pedido - Conexão 2026</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#1E3A8A]">{order.id}</p>
            <p className="text-xs text-slate-500">{new Date(order.date).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Top checkmark area */}
      <div className="pt-16 pb-8 flex justify-center no-print">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
          <CheckCircle className="text-green-600 w-10 h-10" />
        </div>
      </div>

      {/* White bar with Relatório button */}
      <div className="w-full bg-white border-y border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-end">
          <Link 
            href="/admin" 
            className="flex flex-col items-center justify-center text-[#1E3A8A] hover:text-blue-600 transition-colors group"
          >
            <div className="w-10 h-10 bg-[#F0F6FF] rounded-xl flex items-center justify-center mb-1 group-hover:bg-blue-100 transition-colors">
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase">Gerenciar</span>
          </Link>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 w-full flex-grow">
        <div className="text-center mb-16 no-print">
          <p className="text-slate-600 text-lg max-w-lg mx-auto mb-4">
            Sua solicitação foi processada com êxito. Siga os passos abaixo para concluir sua contribuição ou acompanhamento.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold border border-blue-100">
            <ImageIcon className="w-4 h-4" />
            Dica: Tire um print da tela para salvar o comprovante como imagem
          </div>
        </div>

        <div id="pdf-content" className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border-4 border-slate-200">
            <h2 className="text-2xl text-[#0F172A] font-bold mb-8">
              Resumo do Pedido
            </h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Número do Pedido:</span>
                <span className="text-[#1E3A8A] font-bold">{order.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Data e Hora:</span>
                <span className="text-[#0F172A]">{new Date(order.date).toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Comprador:</span>
                <span className="text-[#0F172A]">{order.nome}</span>
              </div>
              {order.grupo && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Grupo/Pastoral:</span>
                  <span className="text-[#0F172A]">{order.grupo}</span>
                </div>
              )}
              <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[#1E3A8A] font-bold text-lg">Valor Total:</span>
                <span className="text-[#1E3A8A] font-extrabold text-2xl">R$ {order.total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </section>

          {/* PIX Section */}
          <section className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
            <h2 className="text-2xl text-[#0F172A] font-bold mb-8">
              Pagamento via PIX
            </h2>
            <div className="flex flex-col items-center gap-6">
              <div className="w-full space-y-4">
                <div className="bg-white border border-slate-200 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Chave PIX (CPF)</p>
                  <p className="text-[#1E3A8A] font-mono text-lg break-all font-bold">90231449534</p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Nome do Recebedor</p>
                  <p className="text-[#0F172A] font-medium">Joseane dos Santos Araújo de Oliveira</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText('90231449534');
                  alert('Chave PIX copiada!');
                }}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl border-2 border-[#2563EB] text-[#2563EB] font-bold hover:bg-blue-50 transition-all active:scale-95 mt-2 no-print"
              >
                <Copy className="w-5 h-5" />
                Copiar Chave PIX
              </button>
            </div>
          </section>
        </div>

        {/* Action Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
          <button 
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-[#25D366] text-white font-bold shadow-md hover:brightness-95 transition-all active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
            Enviar para WhatsApp
          </button>
          <button 
            onClick={() => {
              window.print();
            }}
            className="flex flex-col items-center justify-center gap-1 py-4 px-6 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all active:scale-95"
          >
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              <span>Salvar Comprovante</span>
            </div>
            <span className="text-[10px] font-medium text-slate-500">(Tire um Print ou Salve como PDF)</span>
          </button>
          <button 
            onClick={() => {
              sessionStorage.removeItem('lastOrder');
              window.location.href = '/';
            }}
            className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-[#1E3A8A] text-white font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-900 transition-all active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            Fazer novo pedido
          </button>
        </div>
      </main>
    </div>
  );
}
