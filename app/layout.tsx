import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import AsideBar from "@/components/aside-bar";
import { ModeToggle } from "@/components/mode-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
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
                <header className="sticky top-0 z-10 flex h-[57px] items-center justify-between border-b bg-background px-4">
                  <h1 className="text-xl font-semibold">WebRTC</h1>

                  <ModeToggle />
                </header>
                <main className="flex overflow-auto p-4 justify-center w-full mx-auto my-auto ">
                  {children}
                </main>
              </div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
