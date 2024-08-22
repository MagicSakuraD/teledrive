import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import AsideBar from "@/components/aside-bar";
import { ModeToggle } from "@/components/mode-toggle";
import { Toaster } from "@/components/ui/toaster";
import { Provider } from "jotai";
import UserAvatar from "@/components/UserAvatar";
import Headerbar from "@/components/headerbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "远程驾驶",
  description: "星际迷航",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <div className="grid h-screen w-full">
              <div className="flex flex-col">
                <Provider>
                  <Headerbar />
                  <main className="flex justify-center w-full my-auto h-full">
                    {children}
                  </main>
                </Provider>
              </div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
