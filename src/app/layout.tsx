import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://structuraltec.com.br"),
  applicationName: "Structural Technologies Workspace",
  title: {
    default: "Structural Technologies Workspace",
    template: "%s | Structural Technologies Workspace",
  },
  description: "Plataforma da Structuraltec para calculo, dimensionamento e consulta tecnica em engenharia estrutural.",
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "32x32" }],
    shortcut: [{ url: "/icon", type: "image/png", sizes: "32x32" }],
    apple: [{ url: "/icon", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
