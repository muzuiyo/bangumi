import type { Metadata, Viewport } from 'next'
import './globals.css'
import siteConfig from '@/site.config'
import Footer from '@/components/footer'
import { AuthProvider } from '@/contexts/authContext'

export const metadata: Metadata = {
	title: siteConfig.title,
	description: '在线展示书影音记录'
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
			<body>
				<AuthProvider>
					<div className="page-container">
						<header className="block">
							<h1 className="font-bold">
								{siteConfig.title}
							</h1>
						</header>
						{children}
						<Footer />
					</div>
				</AuthProvider>
			</body>
    </html>
	)
}
