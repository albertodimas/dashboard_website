'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
      
      // Verificar si hay token en cookies
      let response = await fetch('/api/cliente/auth/me', {
        credentials: 'include',
        cache: 'no-store'
      })

      // Si el token expiró, intentar refrescar
      if (response.status === 401) {
        const refreshResponse = await fetch('/api/cliente/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store'
        })

        if (refreshResponse.ok) {
          // Token refrescado exitosamente, reintentar la verificación
          response = await fetch('/api/cliente/auth/me', {
            credentials: 'include',
            cache: 'no-store'
          })
        }
      }

      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(true)
        setClientData(data.customer)
        
        // Obtener negocios donde está registrado (solo si está autenticado)
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
        } catch (businessError) {
          // Si falla obtener negocios, no es crítico
          console.log('Could not fetch registered businesses')
        }
      } else if (response.status === 401) {
        // No autorizado es un estado válido, no es un error
        setIsAuthenticated(false)
        setClientData(null)
      } else {
        // Otros errores
        console.error('Auth check failed with status:', response.status)
        setIsAuthenticated(false)
        setClientData(null)
      }
    } catch (error) {
      // Error de red o servidor no disponible
      console.log('Auth check skipped - server may be unavailable')
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

  useEffect(() => {
    checkAuth()
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