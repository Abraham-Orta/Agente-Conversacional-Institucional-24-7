import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// ==============================================================================
// Layout Principal de la Aplicación
// ==============================================================================

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Colegio Institucional - Asistente Virtual 24/7",
  description: "Plataforma de atención 24/7 para representantes: consultas normativas RAG y agendamiento transaccional de citas directivas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950`}
      >
        {children}
      </body>
    </html>
  );
}
