'use client';
import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const LoadingContext = createContext()

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('Loading...')
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const startLoading = (text = 'Loading...') => {
    setLoadingText(text)
    setIsLoading(true)
  }
  
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
    <LoadingContext.Provider value={{ isLoading, loadingText, startLoading, stopLoading, setLoadingText }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-4">
          <CircularProgressBar />
          <p className="text-primary text-lg font-medium">{loadingText}</p>
        </div>
      )}
    </LoadingContext.Provider>
  )
}

const CircularProgressBar = () => {
  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full animate-spin" viewBox="0 0 100 100">
        <circle
          className="text-primary/10"
          cx="50"
          cy="50"
          r="40"
          fill="none"
          strokeWidth="8"
          strokeDasharray="251.2"
          strokeDashoffset="0"
        />
        <circle
          className="text-primary"
          cx="50"
          cy="50"
          r="40"
          fill="none"
          strokeWidth="8"
          strokeDasharray="251.2"
          strokeDashoffset="251.2"
          strokeLinecap="round"
          style={{
            strokeDashoffset: 'calc(251.2 - (251.2 * 0.7))',
            animation: 'dash 1.5s ease-in-out infinite'
          }}
        />
      </svg>
      <style jsx>{`
        @keyframes dash {
          0% { stroke-dashoffset: 251.2; }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -251.2; }
        }
      `}</style>
    </div>
  )
}

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}