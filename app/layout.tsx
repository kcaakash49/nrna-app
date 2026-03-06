import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "./providers";
import { Toaster } from "sonner";


export const metadata: Metadata = {
  title: "NRNA",
  description: "Non-Resident Nepali Association",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Provider>
          {children}
          <Toaster duration={1500} richColors position="top-center" />
        </Provider>
      </body>
    </html>
  );
}
