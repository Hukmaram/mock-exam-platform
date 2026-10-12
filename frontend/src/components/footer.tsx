'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, ShieldAlert } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();

  // Hide footer inside active exam runner for focused testing
  if (pathname.startsWith('/exam/')) {
    return null;
  }

  return (
    <footer className="border-t bg-muted/30 py-10 mt-auto">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-foreground">
                CertPrep
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              A high-yield, realistic mock exam and practice platform built for software engineers, cloud architects, and agentic AI developers preparing for technical certifications.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/certifications" className="hover:text-foreground transition-colors">
                  All Certifications
                </Link>
              </li>
              <li>
                <Link href="/certifications/gh-600" className="hover:text-foreground transition-colors">
                  GH-600 Agentic AI Prep
                </Link>
              </li>
              <li>
                <Link href="/exams" className="hover:text-foreground transition-colors">
                  Mock Exam Catalog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  Register
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Independent Platform Disclaimer (Rule 8) */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground flex items-start space-x-2.5 mb-6">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-foreground">Independent Practice Notice: </span>
            CertPrep is an independent educational practice platform. The mock examinations, sample questions, and study materials provided are created independently for study and self-assessment purposes. This platform is NOT affiliated with, sponsored by, or endorsed by GitHub, Inc., Microsoft Corporation, Amazon Web Services, or any certification body.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground pt-4 border-t">
          <div>
            © {new Date().getFullYear()} CertPrep Platform. All rights reserved.
          </div>
          <div className="mt-2 sm:mt-0">
            Professional Certification Practice
          </div>
        </div>
      </div>
    </footer>
  );
}
