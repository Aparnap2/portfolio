'use client';
import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const LoadingContext = createContext()

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const startLoading = () => setIsLoading(true)
  const stopLoading = () => setIsLoading(false)

  useEffect(() => {
    startLoading()
    const timeout = setTimeout(stopLoading, 300)
    return () => {
      clearTimeout(timeout)
      stopLoading()
    }
  }, [pathname, searchParams])

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <CircularProgressBar />
        </div>
      )}
    </LoadingContext.Provider>
  )
}

const CircularProgressBar = () => {
  return (
    <svg className="w-24 h-24 animate-spin" viewBox="25 25 50 50">
      <circle
        className="text-primary/10"
        cx="50"
        cy="50"
        r="20"
        fill="none"
        strokeWidth="4"
        strokeDasharray="125.6"
        strokeDashoffset="0"
      />
      <circle
        className="text-primary"
        cx="50"
        cy="50"
        r="20"
        fill="none"
        strokeWidth="4"
        strokeDasharray="125.6"
        strokeDashoffset="125.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}