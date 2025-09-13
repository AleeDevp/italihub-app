'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  console.log('AuthProvider - Current user:', user)
  console.log('AuthProvider - isAuthenticated:', !!user)

  // Check for saved user in localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    console.log('AuthProvider - Checking localStorage for user:', savedUser)
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
        console.log('AuthProvider - User restored from localStorage:', parsedUser)
      } catch (error) {
        console.error('AuthProvider - Error parsing saved user:', error)
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (userData: User) => {
    console.log('AuthProvider - Logging in user:', userData)
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    console.log('AuthProvider - Logging out user')
    setUser(null)
    localStorage.removeItem('user')
  }

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
