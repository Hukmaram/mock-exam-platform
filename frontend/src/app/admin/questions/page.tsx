'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import {
  PlusCircle,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  Archive,
  Trash2,
  Check,
  Eye,
} from 'lucide-react';

export default function AdminQuestionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCert, setSelectedCert] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);

  // Certs for filter
  const { data: certs } = useQuery({
    queryKey: ['admin-cert-filters'],
    queryFn: async () => {
      const res = await api.get('/certifications/admin/all');
      return res.data;
    },
  });

  // Questions query
  const { data, isLoading } = useQuery({
    queryKey: ['admin-questions', search, selectedCert, selectedDifficulty, selectedStatus, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCert) params.append('certificationId', selectedCert);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (selectedStatus) params.append('status', selectedStatus);
      params.append('page', page.toString());
      params.append('limit', '15');

      const res = await api.get(`/questions?${params.toString()}`);
      return res.data;
    },
  });

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api.patch(`/questions/${id}/status`, { status: nextStatus });
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Question Bank
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage question items, answer options, explanations, and publication status.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/admin/questions/import">
            <Button variant="outline" size="sm" className="text-xs">
              <Upload className="h-3.5 w-3.5 mr-1.5 text-primary" />
              <span>Import Questions</span>
            </Button>
          </Link>
          <Link href="/admin/questions/new">
            <Button size="sm" className="text-xs">
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              <span>New Question</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border-muted">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions or keywords..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 text-xs"
            />
          </div>

          <select
            value={selectedCert}
            onChange={(e) => {
              setSelectedCert(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-card px-3 text-xs shadow-sm font-medium"
          >
            <option value="">All Certifications</option>
            {certs?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-card px-3 text-xs shadow-sm font-medium"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-card px-3 text-xs shadow-sm font-medium"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </Card>

      {/* Questions Table */}
      <Card className="border-muted">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Type</TableHead>
              <TableHead>Question Prompt</TableHead>
              <TableHead className="w-28">Domain</TableHead>
              <TableHead className="w-24">Difficulty</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  Loading question bank...
                </TableCell>
              </TableRow>
            ) : data?.questions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  No questions found matching your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              data?.questions?.map((q: any) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {q.type === 'MULTIPLE_CHOICE' ? 'MULTI' : 'SINGLE'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-xs font-medium text-foreground line-clamp-2">
                      {q.text}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {q.options?.length} Options • Correct:{' '}
                      {q.options
                        ?.filter((o: any) => o.isCorrect)
                        .map((o: any) => o.key)
                        .join(', ') || 'None'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {q.domain?.code || q.domain?.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        q.difficulty === 'HARD'
                          ? 'destructive'
                          : q.difficulty === 'EASY'
                          ? 'success'
                          : 'secondary'
                      }
                      className="text-[10px]"
                    >
                      {q.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        q.status === 'PUBLISHED'
                          ? 'success'
                          : q.status === 'DRAFT'
                          ? 'warning'
                          : 'secondary'
                      }
                      className="text-[10px]"
                    >
                      {q.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(q.id, q.status)}
                      className="text-[10px] h-7 px-2"
                    >
                      {q.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(q.id)}
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

        {/* Pagination footer */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t text-xs text-muted-foreground">
            <span>
              Page {data.page} of {data.totalPages} ({data.total} total questions)
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
