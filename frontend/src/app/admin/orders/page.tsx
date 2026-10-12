'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders-list', page],
    queryFn: async () => {
      const res = await api.get(`/orders/admin/all?page=${page}&limit=15`);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Orders & Payment Transactions
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Audited log of customer mock exam purchases, Razorpay payment IDs, and fulfillment.
        </p>
      </div>

      <Card className="border-muted">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Package Purchased</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Gateway Payment ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : data?.orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                  No orders recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              data?.orders?.map((ord: any) => {
                const paymentId =
                  ord.razorpayPaymentId ||
                  ord.payments?.[0]?.gatewayPaymentId ||
                  '--';

                return (
                  <TableRow key={ord.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {ord.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-xs text-foreground">
                        {ord.user?.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {ord.user?.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {ord.product?.name}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-foreground">
                      {formatCurrency(ord.amount)}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {paymentId}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ord.status === 'PAID'
                            ? 'success'
                            : ord.status === 'PENDING'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="text-[10px]"
                      >
                        {ord.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(ord.createdAt).toLocaleDateString()}
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
              Page {data.page} of {data.totalPages} ({data.total} total orders)
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
