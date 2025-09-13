'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import ModeToggle from "@/components/mode-toggle"
import { useAuth } from "@/contexts/auth-context"
import { LogOut, User, Settings, CreditCard } from "lucide-react"

// import { useMediaQuery } from '@/app/hooks/use-media-query';
interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const pathname = usePathname()
  const { user, isAuthenticated, logout, isLoading } = useAuth()

  // const isDesktop = useMediaQuery('(min-width: 768px)')
  
  // console.log('Header - Current pathname:', pathname)
  // console.log('Header - Auth state:', { user, isAuthenticated, isLoading })

  const handleLogout = () => {
    console.log('Header - Logging out user')
    logout()
    // Optionally redirect to home page after logout
    window.location.href = '/'
  }

  // Generate breadcrumb items from the current path
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    console.log('Header - Path segments:', pathSegments)
    
    const breadcrumbs = [
      { label: 'Home', href: '/', isActive: pathname === '/' }
    ]

    // Build breadcrumbs from path segments
    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === pathSegments.length - 1
      
      // Capitalize and format the segment name
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      breadcrumbs.push({
        label,
        href: currentPath,
        isActive: isLast
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <header className={`sticky top-0 z-50 h-22 w-full content-end-safe  backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className || ''}`}>
      <div className="flex  h-16 w-7/8 md:max-w-[1280px] place-self-center-safe border rounded-2xl items-center justify-between px-4">
        {/* Logo and Breadcrumb Section */}
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">IH</span>
            </div>
            <span className="hidden font-bold sm:inline-block">
              ItaliHub
            </span>
          </Link>

          {/* Breadcrumb Navigation */}
          <div className="hidden md:flex">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => (
                  <div key={breadcrumb.href} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {breadcrumb.isActive ? (
                        <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Right Section - Auth & Theme Toggle */}
        <div className="flex items-center space-x-4">
          {/* Authentication Section */}
          {!isLoading && (
            <>
              {isAuthenticated && user ? (
                /* User Avatar and Dropdown */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.avatar || user.name}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Billing</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                /* Login and Signup Buttons */
                <div className="flex items-center space-x-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/signup">
                      Sign up
                    </Link>
                  </Button>
                  <Button asChild variant="default" size="sm">
                    <Link href="/login">
                      Log in
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
          
          {/* Theme Toggle */}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}



