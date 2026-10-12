'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { PlusCircle, BookOpen, Clock, Trash2, Eye } from 'lucide-react';
import { formatMinutes } from '@/lib/utils';

export default function AdminExamsPage() {
  const queryClient = useQueryClient();

  const { data: exams, isLoading } = useQuery({
    queryKey: ['admin-exams'],
    queryFn: async () => {
      const res = await api.get('/exams');
      return res.data;
    },
  });

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api.patch(`/exams/${id}/status`, { status: nextStatus });
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Status toggle failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Mock Exams
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure examination simulations, question composition, and passing rules.
          </p>
        </div>

        <Link href="/admin/exams/new">
          <Button size="sm" className="text-xs">
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            <span>Create Mock Exam</span>
          </Button>
        </Link>
      </div>

      <Card className="border-muted">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Cert</TableHead>
              <TableHead>Exam Title</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Passing %</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                  Loading mock exams...
                </TableCell>
              </TableRow>
            ) : exams?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                  No mock exams created yet. Click 'Create Mock Exam' to build one.
                </TableCell>
              </TableRow>
            ) : (
              exams?.map((exam: any) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-mono font-bold text-xs">
                    {exam.certification?.code}
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    <div>{exam.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      /exams/{exam.slug}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatMinutes(exam.durationMinutes)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {exam._count?.examQuestions || exam.totalQuestions}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">
                    {exam.passingPercentage}%
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {exam._count?.attempts || 0}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={exam.status === 'PUBLISHED' ? 'success' : 'secondary'}
                      className="text-[10px]"
                    >
                      {exam.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(exam.id, exam.status)}
                      className="text-[10px] h-7 px-2"
                    >
                      {exam.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Link href={`/exams/${exam.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(exam.id)}
                      className="h-7 w-7 p-0 text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
