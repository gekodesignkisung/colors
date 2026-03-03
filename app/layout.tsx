import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'colors — Design Token Generator',
  description: 'Generate Material Design 3 color tokens from 4 base colors',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
