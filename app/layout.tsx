import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'react-day-picker/dist/style.css'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Your Personal Chief of Staff',
  description: 'AI-powered guidance for impactful work',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

