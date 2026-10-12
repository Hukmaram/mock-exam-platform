'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckoutModal } from '@/features/payments/checkout-modal';
import {
  Clock,
  BookOpen,
  CheckCircle2,
  Lock,
  Play,
  Layers,
  ArrowLeft,
  CreditCard,
  Percent,
} from 'lucide-react';
import { formatCurrency, formatMinutes } from '@/lib/utils';

export default function CertificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, hasEntitlement, hasPlatformAccess } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const { data: cert, isLoading } = useQuery({
    queryKey: ['cert-detail', slug],
    queryFn: async () => {
      const res = await api.get(`/certifications/${slug}`);
      return res.data;
    },
    enabled: Boolean(slug),
  });

  const isEntitled = hasPlatformAccess || (cert ? hasEntitlement(cert.id) : false);
  const product = cert?.products?.[0];

  const handleExamAction = (exam: any) => {
    if (!user) {
      router.push(`/login?redirect=/certifications/${slug}`);
      return;
    }

    if (!isEntitled) {
      if (product) {
        setSelectedProduct(product);
      }
      return;
    }

    // Direct to exam intro page
    router.push(`/exams/${exam.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-8 py-12 max-w-7xl">
        <div className="h-40 rounded-xl bg-muted/20 animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-60 rounded-xl bg-muted/20 animate-pulse" />
          <div className="h-60 rounded-xl bg-muted/20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-xl">
        <h2 className="text-2xl font-bold">Certification Not Found</h2>
        <p className="text-sm text-muted-foreground mt-2">
          The requested certification could not be found or has not been published yet.
        </p>
        <Link href="/certifications" className="inline-block mt-4">
          <Button variant="outline">Back to Certifications</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-8 py-10 max-w-7xl space-y-10">
      {/* Back button */}
      <div>
        <Link
          href="/certifications"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          <span>All Certifications</span>
        </Link>
      </div>

      {/* Hero header */}
      <div className="border rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-card via-background to-muted/20 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="font-mono text-xs font-bold">
                {cert.code}
              </Badge>
              {isEntitled && (
                <Badge variant="success" className="text-xs">
                  Access Granted
                </Badge>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {cert.name}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {cert.description}
            </p>

            {/* Quick metrics */}
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-foreground">
              <div className="flex items-center space-x-1.5 rounded-md bg-muted/60 px-3 py-1.5">
                <Layers className="h-4 w-4 text-primary" />
                <span className="font-semibold">{cert.exams?.length || 0}</span>
                <span className="text-muted-foreground">Available Exams</span>
              </div>
              <div className="flex items-center space-x-1.5 rounded-md bg-muted/60 px-3 py-1.5">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-semibold">{cert._count?.questions || 0}</span>
                <span className="text-muted-foreground">Question Bank Items</span>
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          {product && (
            <div className="w-full md:w-80 rounded-xl border bg-card p-5 shadow-sm space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Platform Access
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(product.priceInr)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                {product.description || 'One-time platform payment unlocks all mock exams across all certifications.'}
              </p>
              {isEntitled ? (
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/25 text-xs font-semibold text-center flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>All-Access Active (All Exams Unlocked)</span>
                </div>
              ) : (
                <Button
                  onClick={() => setSelectedProduct(product)}
                  className="w-full font-semibold bg-primary hover:bg-[#C16345] text-primary-foreground"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Get All-Access Pass ({formatCurrency(product.priceInr)})
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Certification Domains */}
      {cert.domains && cert.domains.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Certification Domains Covered</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cert.domains.map((dom: any) => (
              <div
                key={dom.id}
                className="rounded-lg border bg-card p-4 space-y-1 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-primary">
                    {dom.code || 'DOMAIN'}
                  </span>
                  {dom.weight && (
                    <span className="text-xs text-muted-foreground font-medium">
                      {dom.weight}%
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm text-foreground">{dom.name}</h3>
                {dom.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {dom.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Mock Exams */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {cert.code} Practice Mock Exams
          </h2>
          <span className="text-xs text-muted-foreground">
            {cert.exams?.length || 0} exams available
          </span>
        </div>

        {cert.exams?.length === 0 ? (
          <div className="p-8 text-center border rounded-xl bg-card text-muted-foreground text-sm">
            No mock exams have been published for this certification yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cert.exams.map((exam: any, idx: number) => (
              <Card key={exam.id} className="border-muted hover:border-primary/40 transition-colors flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="secondary" className="text-xs font-mono">
                      Exam {idx + 1}
                    </Badge>
                    <span className="text-xs font-medium text-muted-foreground flex items-center space-x-1">
                      <Percent className="h-3.5 w-3.5 text-primary" />
                      <span>Passing Score: {exam.passingPercentage}%</span>
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-snug">{exam.title}</CardTitle>
                  {exam.description && (
                    <CardDescription className="text-xs mt-1">
                      {exam.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 text-xs">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-semibold text-foreground">
                          {exam.totalQuestions} Questions
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Multiple choice
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-semibold text-foreground">
                          {formatMinutes(exam.durationMinutes)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Timed simulation
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    onClick={() => handleExamAction(exam)}
                    className="w-full text-xs font-semibold flex items-center justify-center space-x-1.5"
                    variant={isEntitled ? 'default' : 'outline'}
                  >
                    {isEntitled ? (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Start Mock Exam</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Unlock Access ({product ? formatCurrency(product.priceInr) : 'Buy'})</span>
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

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
