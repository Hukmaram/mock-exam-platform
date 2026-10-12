'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Users, ShieldCheck, Layers, Calendar } from 'lucide-react';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users-list', page],
    queryFn: async () => {
      const res = await api.get(`/users?page=${page}&limit=15`);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Platform Users
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Overview of registered users, purchased packages, and attempt activity.
        </p>
      </div>

      <Card className="border-muted">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Details</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Package Status</TableHead>
              <TableHead className="text-right">Attempts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : data?.users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                  No users registered yet.
                </TableCell>
              </TableRow>
            ) : (
              data?.users?.map((u: any) => {
                const hasPurchased = u.entitlements?.length > 0;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-semibold text-xs text-foreground">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {u.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.role === 'ADMIN' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {hasPurchased ? (
                        <div className="space-y-0.5">
                          <Badge variant="success" className="text-[10px]">
                            Paid Access
                          </Badge>
                          <div className="text-[10px] text-muted-foreground truncate max-w-xs">
                            {u.entitlements.map((e: any) => e.product?.name).join(', ')}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Free Account
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">
                      {u._count?.attempts || 0}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t text-xs text-muted-foreground">
            <span>
              Page {data.page} of {data.totalPages} ({data.total} total users)
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
