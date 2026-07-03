import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProcureIQ | AI Procurement Workflow Platform',
  description: 'Premium AI procurement workflows for supplier-heavy teams that need faster RFQs, quote comparison, and human-approved PO drafts.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
