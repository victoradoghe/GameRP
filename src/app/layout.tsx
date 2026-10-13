import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lagos Life 3D — Next-Gen Lagos Simulator',
  description: 'The premier 3D life simulation game set in Lagos, Nigeria. Ride danfos, chop amala at Shitta, code fintech in Yaba, party at Quilox, survive NEPA outages.',
  applicationName: 'Lagos Life 3D',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#090D16',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-[#090D16]">
      <body className="h-full w-full overflow-hidden select-none bg-[#090D16] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
