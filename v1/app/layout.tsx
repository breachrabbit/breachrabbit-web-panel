import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BreachRabbit Web Panel',
  description: 'Control panel bootstrap for BreachRabbit infrastructure'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
