import Script from 'next/script'

export function Analytics() {
  const domain = process.env.PLAUSIBLE_DOMAIN || ''
  if (!domain) {
    return null
  }

  return (
    <Script
      defer
      data-domain={domain}
      src={
        process.env.PLAUSIBLE_SCRIPT_URL || 'https://plausible.io/js/script.js'
      }
      strategy="afterInteractive"
    />
  )
}
