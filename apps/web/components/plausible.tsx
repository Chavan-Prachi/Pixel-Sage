import Script from 'next/script'

export function Analytics() {
  if (process.env.NODE_ENV !== 'production') return null
  if (!process.env.PLAUSIBLE_DOMAIN) return null

  return (
    <Script
      data-domain={process.env.PLAUSIBLE_DOMAIN}
      src={
        process.env.PLAUSIBLE_SCRIPT_URL || 'https://plausible.io/js/script.js'
      }
      strategy="afterInteractive"
    />
  )
}
