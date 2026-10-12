'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide standard navbar inside active exam runner for zero distractions
  if (pathname.startsWith('/exam/')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base leading-tight tracking-tight text-foreground">
              CertPrep
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Certification Practice
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/certifications"
            className={`transition-colors hover:text-foreground ${
              pathname.startsWith('/certifications')
                ? 'text-primary font-semibold'
                : 'text-muted-foreground'
            }`}
          >
            Certifications
          </Link>
          <Link
            href="/exams"
            className={`transition-colors hover:text-foreground ${
              pathname === '/exams'
                ? 'text-primary font-semibold'
                : 'text-muted-foreground'
            }`}
          >
            Practice Exams
          </Link>

          {user && (
            <Link
              href="/dashboard"
              className={`transition-colors hover:text-foreground flex items-center space-x-1.5 ${
                pathname === '/dashboard'
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={`transition-colors hover:text-foreground flex items-center space-x-1.5 ${
                pathname.startsWith('/admin')
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* Right side Auth Controls */}
        <div className="hidden md:flex items-center space-x-3">
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          ) : user ? (
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-end text-xs">
                <span className="font-medium text-foreground">{user.name}</span>
                <span className="text-[11px] text-muted-foreground">{user.email}</span>
              </div>
              {user.role === 'ADMIN' && (
                <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                  Admin
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="flex items-center space-x-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-background px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
          <Link
            href="/certifications"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground"
          >
            Certifications
          </Link>
          <Link
            href="/exams"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground"
          >
            Practice Exams
          </Link>

          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium py-1.5 text-primary font-semibold"
            >
              Admin Panel
            </Link>
          )}

          <div className="pt-2 border-t flex flex-col space-y-2">
            {user ? (
              <>
                <div className="text-xs text-muted-foreground">
                  Signed in as <span className="font-medium text-foreground">{user.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full justify-start text-xs"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
