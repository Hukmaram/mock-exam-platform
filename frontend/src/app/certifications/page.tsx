'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function CertificationsPage() {
  const { data: certifications, isLoading } = useQuery({
    queryKey: ['certifications'],
    queryFn: async () => {
      const res = await api.get('/certifications');
      return res.data;
    },
  });

  return (
    <div className="container mx-auto px-4 sm:px-8 py-10 max-w-7xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Available Certifications
        </h1>
        <p className="text-sm text-muted-foreground">
          Explore realistic practice exams designed around modern software engineering and cloud certifications.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-xl border bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : certifications?.length === 0 ? (
        <div className="p-12 text-center border rounded-xl bg-card">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg">No certifications available yet</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Check back soon as new exams and certifications are added regularly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert: any) => {
            const product = cert.products?.[0];
            return (
              <Card key={cert.id} className="flex flex-col justify-between hover:shadow-md transition-shadow border-muted">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono text-xs font-semibold">
                      {cert.code}
                    </Badge>
                    {product && (
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(product.priceInr)}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg leading-snug">{cert.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-3 mt-1">
                    {cert.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground py-2 border-y">
                    <div className="flex items-center space-x-1.5">
                      <Layers className="h-4 w-4 text-primary" />
                      <span>{cert._count?.exams || 0} Mock Exams</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>{cert._count?.questions || 0} Questions</span>
                    </div>
                  </div>

                  {cert.domains && cert.domains.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Domains Included ({cert.domains.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cert.domains.slice(0, 3).map((d: any) => (
                          <Badge key={d.id} variant="secondary" className="text-[10px]">
                            {d.name}
                          </Badge>
                        ))}
                        {cert.domains.length > 3 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{cert.domains.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2">
                  <Link href={`/certifications/${cert.slug}`} className="w-full">
                    <Button variant="default" className="w-full text-xs">
                      <span>View Mock Exams</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
