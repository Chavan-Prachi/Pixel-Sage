import '@/styles/globals.css'
import { ThemeProvider } from '@/components/providers'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Toaster } from '@/components/ui/sonner'
import { META_THEME_COLORS, siteConfig } from '@/config/site'
import { fontMono, fontSans } from '@/lib/fonts'
import { cn } from '@/lib/utils'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  metadataBase: new URL(siteConfig.url),
  description: siteConfig.description,
  keywords: [
    'Task Planning',
    'Pomodoro Timer',
    'ADHD',
    'Productivity',
    'AI Assistant',
    'Focus Timer',
    'Task Management',
  ],
  authors: [
    {
      name: 'Sidejot',
      url: 'https://github.com/sidejot',
    },
  ],
  creator: 'Sidejot',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@shadcn',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
}

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light,
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
              try {
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]').setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
            `,
            }}
          />
        </head>
        <body
          className={cn(
            'min-h-screen bg-background font-sans antialiased',
            fontSans.variable,
            fontMono.variable,
          )}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <div vaul-drawer-wrapper="">
              <div className="relative flex min-h-screen flex-col bg-background">
                {children}
              </div>
            </div>
            <TailwindIndicator />
            <ThemeSwitcher />
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}
