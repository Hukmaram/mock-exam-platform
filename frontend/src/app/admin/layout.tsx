'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Layers,
  HelpCircle,
  Users,
  CreditCard,
  ArrowLeft,
  ShieldCheck,
  PlusCircle,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Admin access guard
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <ShieldCheck className="h-12 w-12 text-destructive mx-auto mb-3" />
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-xs text-muted-foreground mt-2">
          Administrator privileges are required to view this section.
        </p>
        <Link href="/login" className="mt-4 inline-block">
          <Button variant="outline">Sign In as Admin</Button>
        </Link>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/certifications', label: 'Certifications', icon: GraduationCap },
    { href: '/admin/domains', label: 'Domains', icon: Layers },
    { href: '/admin/questions', label: 'Question Bank', icon: HelpCircle },
    { href: '/admin/exams', label: 'Mock Exams', icon: BookOpen },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/orders', label: 'Orders & Payments', icon: CreditCard },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r bg-card shrink-0 p-4 md:p-6 space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            <span>Return to User Dashboard</span>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-foreground">
                Admin Console
              </h3>
              <span className="text-[10px] text-muted-foreground">Management Portal</span>
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="pt-4 border-t space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </span>
          <div className="flex flex-col space-y-1.5">
            <Link href="/admin/questions/new">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                <PlusCircle className="h-3.5 w-3.5 mr-1.5 text-primary" />
                <span>New Question</span>
              </Button>
            </Link>
            <Link href="/admin/questions/import">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                <Upload className="h-3.5 w-3.5 mr-1.5 text-primary" />
                <span>Import CSV/JSON</span>
              </Button>
            </Link>
            <Link href="/admin/exams/new">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                <PlusCircle className="h-3.5 w-3.5 mr-1.5 text-primary" />
                <span>Build New Exam</span>
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-6 md:p-8 overflow-x-hidden max-w-7xl">
        {children}
      </main>
    </div>
  );
}
