'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Layers, ArrowRight, Play, Lock } from 'lucide-react';
import { formatMinutes } from '@/lib/utils';

export default function ExamsPage() {
  const { user, hasEntitlement, hasPlatformAccess } = useAuth();

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const res = await api.get('/exams');
      return res.data;
    },
  });

  return (
    <div className="container mx-auto px-4 sm:px-8 py-10 max-w-7xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Practice Mock Exams
        </h1>
        <p className="text-sm text-muted-foreground">
          Select an exam below to begin a timed simulation or review requirements.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-xl border bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : exams?.length === 0 ? (
        <div className="p-12 text-center border rounded-xl bg-card">
          <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg">No mock exams published yet</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Exams are being prepared and will be listed here once published.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam: any) => {
            const isEntitled = hasPlatformAccess || hasEntitlement(exam.certification?.id, exam.id);
            return (
              <Card key={exam.id} className="flex flex-col justify-between hover:shadow-md transition-shadow border-muted">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono text-xs font-semibold">
                      {exam.certification?.code || 'CERT'}
                    </Badge>
                    <Badge variant={isEntitled ? 'success' : 'secondary'} className="text-[10px]">
                      {isEntitled ? 'Unlocked' : 'Requires Access'}
                    </Badge>
                  </div>
                  <CardTitle className="text-base leading-snug">{exam.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {exam.certification?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 text-xs">
                    <div className="flex items-center space-x-1.5">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>{exam._count?.examQuestions || exam.totalQuestions} Questions</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{formatMinutes(exam.durationMinutes)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Link href={`/exams/${exam.id}`} className="w-full">
                    <Button variant="default" className="w-full text-xs font-medium">
                      {isEntitled ? (
                        <>
                          <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                          <span>View & Start Exam</span>
                        </>
                      ) : (
                        <>
                          <span>View Details & Unlock</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </>
                      )}
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
