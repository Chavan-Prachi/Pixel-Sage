import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add these helper functions
export const getDeviceType = () => {
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua,
    )
  ) {
    return 'mobile'
  }
  return 'desktop'
}

export const getTimeOfDay = (date: Date) => {
  const hours = date.getHours()
  if (hours < 12) return 'morning'
  if (hours < 17) return 'afternoon'
  return 'evening'
}
