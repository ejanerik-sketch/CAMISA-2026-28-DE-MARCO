import type {Metadata} from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Header } from '@/components/Header';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Paróquia Nossa Senhora de Fátima - Conexão 2026',
  description: 'Vista sua fé na Festa da Padroeira.',
  icons: {
    icon: 'http://janerik.com.br/wp-content/uploads/2026/03/LOGO-PAROQUIAAtivo-1.png',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="bg-[#F8FAFC] font-sans text-slate-800 antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <Header />
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}
