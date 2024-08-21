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
            <div className="grid h-screen w-full pl-[56px]">
              <AsideBar />
              <div className="flex flex-col">
                <Provider>
                  <header className="sticky top-0 z-10 flex h-[57px] items-center justify-between border-b bg-background px-4">
                    <h1 className="text-xl font-semibold">远程驾驶</h1>
                    <div className="flex flex-row gap-3 justify-center items-center">
                      <ModeToggle />
                      <UserAvatar />
                    </div>
                  </header>
                  <main className="flex p-4 justify-center w-full my-auto">
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
