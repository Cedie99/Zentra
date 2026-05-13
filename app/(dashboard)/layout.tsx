import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zentra | Dashboard",
  description: "Manage and analyze your GitHub repositories",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <>{children}</>;
}
