import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full py-12 bg-slate-50 mt-20 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <div className="text-lg font-bold text-[#1E3A8A]">
            Paróquia Nossa Senhora de Fátima
          </div>
          <p className="text-sm text-slate-500">
            © 2026 Paróquia Nossa Senhora de Fátima. Todos os direitos reservados.
          </p>
        </div>
        <div className="flex gap-8">
          <Link href="#" className="text-sm text-slate-500 hover:text-[#1E3A8A] underline transition-all">Termos</Link>
          <Link href="#" className="text-sm text-slate-500 hover:text-[#1E3A8A] underline transition-all">Privacidade</Link>
          <Link href="#" className="text-sm text-slate-500 hover:text-[#1E3A8A] underline transition-all">Suporte</Link>
        </div>
      </div>
    </footer>
  );
}
