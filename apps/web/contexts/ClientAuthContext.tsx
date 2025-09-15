'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ClientData {
  id: string
  name: string
  email: string
  phone?: string
  registeredBusinesses?: string[] // IDs de negocios donde está registrado
}

interface ClientAuthContextType {
  isAuthenticated: boolean
  clientData: ClientData | null
  loading: boolean
  checkAuth: () => Promise<void>
  logout: () => void
  isRegisteredInBusiness: (businessId: string) => boolean
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined)

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkAuth = async () => {
    try {
      setLoading(true)
      // Consultar un endpoint amable que nunca responde 401
      const res = await fetch('/api/cliente/auth/check', {
        credentials: 'include',
        cache: 'no-store'
      })
      const data = await res.json().catch(() => ({ authenticated: false }))
      if (data?.authenticated) {
        setIsAuthenticated(true)
        setClientData({
          id: data.customer?.id,
          name: data.customer?.name || '',
          email: data.customer?.email,
          phone: data.customer?.phone,
          registeredBusinesses: []
        } as any)
        // Obtener negocios donde está registrado (no crítico)
        try {
          const businessesResponse = await fetch('/api/cliente/businesses', {
            credentials: 'include',
            cache: 'no-store'
          })
          if (businessesResponse.ok) {
            const businessData = await businessesResponse.json()
            setClientData(prev => ({
              ...prev!,
              registeredBusinesses: businessData.myBusinesses?.map((b: any) => b.id) || []
            }))
          }
        } catch {}
      } else {
        setIsAuthenticated(false)
        setClientData(null)
      }
    } catch {
      setIsAuthenticated(false)
      setClientData(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Llamar a la API para limpiar la cookie del servidor
      await fetch('/api/cliente/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Error during logout:', error)
    }
    
    // Limpiar estado local
    setIsAuthenticated(false)
    setClientData(null)
    
    // Redirigir al login
    router.push('/cliente/login')
  }

  const isRegisteredInBusiness = (businessId: string): boolean => {
    return clientData?.registeredBusinesses?.includes(businessId) || false
  }

  // Evitar doble ejecución en Strict Mode (dev) y chequear solo una vez
  const didInitRef = useRef(false)
  useEffect(() => {
    if (didInitRef.current) return
    didInitRef.current = true
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ClientAuthContext.Provider 
      value={{ 
        isAuthenticated, 
        clientData, 
        loading, 
        checkAuth, 
        logout,
        isRegisteredInBusiness 
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  )
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext)
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider')
  }
  return context
}
