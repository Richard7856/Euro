import type { Metadata } from "next";
import "./globals.css";
import DashboardShell from "@/components/DashboardShell";
import { ProfileProvider } from "@/lib/profileContext";
import { EmpresaProvider } from "@/lib/empresaContext";
import { CurrencyProvider } from "@/lib/currencyContext";
import EmpresaBodySync from "@/components/EmpresaBodySync";

export const metadata: Metadata = {
  title: "Dashboard Euro | Import/Export",
  description: "Control operativo, financiero y logístico para importación y exportación",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased text-zinc-100">
        <ProfileProvider>
          <EmpresaProvider>
            <CurrencyProvider>
              <EmpresaBodySync />
              <DashboardShell>{children}</DashboardShell>
            </CurrencyProvider>
          </EmpresaProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
