'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CheckoutModal } from '@/features/payments/checkout-modal';
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  BrainCircuit,
  ShieldCheck,
  Award,
  ArrowRight,
  BookOpen,
  Zap,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function LandingPage() {
  const { user, hasPlatformAccess } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Fetch GH-600 certification details
  const { data: cert, isLoading } = useQuery({
    queryKey: ['landing-cert'],
    queryFn: async () => {
      const res = await api.get('/certifications/gh-600');
      return res.data;
    },
  });

  // Fetch platform products
  const { data: products } = useQuery({
    queryKey: ['platform-products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
  });

  const platformProduct =
    products?.find((p: any) => p.isPlatformAccess) || cert?.products?.[0];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-muted/10 py-16 sm:py-24 border-b">
        <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 rounded-md border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Independent Realistic Practice Simulations</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal sm:font-medium tracking-tight text-foreground leading-[1.12]">
              Master Technical Certifications with Precision and Rigor
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl font-light">
              High-yield mock examinations engineered to replicate actual test conditions. Accurate question styles, server-side timer enforcement, auto-save answers, and detailed explanations.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/certifications/gh-600">
                <Button size="lg" className="h-12 px-6 text-base font-semibold shadow-md">
                  Explore GH-600 Exams
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              {platformProduct && !hasPlatformAccess && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setSelectedProduct(platformProduct)}
                  className="h-12 px-6 text-base font-semibold border-primary/30 hover:bg-primary/5"
                >
                  Get All-Access Pass — {formatCurrency(platformProduct.priceInr)}
                </Button>
              )}
            </div>

            {/* Quick stats pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t w-full max-w-xl text-left">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-foreground">
                  {cert?._count?.questions || '25+'}
                </span>
                <span className="text-xs text-muted-foreground">Practice Questions</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-foreground">
                  {cert?._count?.exams || '2'}
                </span>
                <span className="text-xs text-muted-foreground">Full Mock Exams</span>
              </div>
              <div className="flex flex-col col-span-2 sm:col-span-1">
                <span className="text-2xl font-bold text-foreground">100%</span>
                <span className="text-xs text-muted-foreground">In-Depth Explanations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Certification: GH-600 */}
      <section className="py-16 sm:py-20 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <Badge variant="outline" className="uppercase tracking-widest text-[11px] font-bold">
              First Supported Certification
            </Badge>
            <h2 className="text-3xl font-bold text-foreground">
              GitHub Agentic AI Developer (GH-600)
            </h2>
            <p className="text-sm text-muted-foreground">
              Master the cutting edge of autonomous agent architectures, Model Context Protocol (MCP), and Copilot extension development.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Domain breakdown */}
            <div className="lg:col-span-2 space-y-4">
              <div className="text-base font-semibold text-foreground flex items-center space-x-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                <span>Certification Domains Tested</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cert?.domains?.map((domain: any) => (
                  <Card key={domain.id} className="border-muted hover:border-primary/40 transition-colors">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs font-mono">
                          {domain.code || 'DOMAIN'}
                        </Badge>
                        {domain.weight && (
                          <span className="text-xs font-medium text-muted-foreground">
                            {domain.weight}% Weight
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-base font-semibold mt-1">
                        {domain.name}
                      </CardTitle>
                    </CardHeader>
                    {domain.description && (
                      <CardContent className="p-4 pt-1">
                        <p className="text-xs text-muted-foreground">
                          {domain.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                )) || (
                  <div className="text-sm text-muted-foreground">Loading domains...</div>
                )}
              </div>
            </div>

            {/* Pricing / Package Card */}
            <div>
              <Card className="border-primary/40 shadow-lg relative overflow-hidden bg-card">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  Complete Access
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">
                    {platformProduct?.name || 'CertPrep All-Access Platform Pass'}
                  </CardTitle>
                  <CardDescription>
                    One-time payment unlocks complete access to all mock exams across all technical certifications.
                  </CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-extrabold text-foreground">
                      {platformProduct ? formatCurrency(platformProduct.priceInr) : '₹149'}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">one-time platform fee</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center space-x-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Full access to all present & future mock exams</span>
                    </li>
                    <li className="flex items-center space-x-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Official GH-600 41-question exam (90 minutes)</span>
                    </li>
                    <li className="flex items-center space-x-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Server-enforced timer & auto-submission engine</span>
                    </li>
                    <li className="flex items-center space-x-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Instant answer auto-saving during attempts</span>
                    </li>
                    <li className="flex items-center space-x-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Detailed explanations for every question & option</span>
                    </li>
                    <li className="flex items-center space-x-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Domain-level score breakdown & readiness scoring</span>
                    </li>
                    <li className="flex items-center space-x-2 text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Unlimited retakes & attempt history</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="pt-2">
                  {hasPlatformAccess ? (
                    <Link href="/certifications/gh-600" className="w-full">
                      <Button className="w-full bg-primary hover:bg-[#C16345] text-primary-foreground font-semibold">
                        Platform Access Active — Start Exams →
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={() => platformProduct && setSelectedProduct(platformProduct)}
                      className="w-full font-semibold"
                    >
                      Get Platform All-Access Pass Now
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 sm:py-20 border-b">
        <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Built for Realistic Certification Practice
            </h2>
            <p className="text-sm text-muted-foreground">
              No bloated fluff. A focused exam engine that builds actual test-taking stamina.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-muted">
              <CardHeader className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Server-Enforced Timer</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Browser refresh proof. Server timestamps enforce strict expiration and automatically submit your attempt when the clock runs out.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-muted">
              <CardHeader className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Zap className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Instant Auto-Save</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Every answer you select is immediately persisted to the backend database. Never lose progress due to connectivity hiccups or reloads.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-muted">
              <CardHeader className="space-y-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Granular Domain Review</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Review your answers question-by-question after submission. Understand exactly why each answer is correct or incorrect with comprehensive explanations.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      {selectedProduct && (
        <CheckoutModal
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
        />
      )}
    </div>
  );
}
