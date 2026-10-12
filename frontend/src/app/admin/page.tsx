'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  CreditCard,
  BookOpen,
  Layers,
  HelpCircle,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalUsers: 0,
    paidUsers: 0,
    totalOrders: 0,
    paidOrders: 0,
    totalRevenue: 0,
    totalExams: 0,
    totalQuestions: 0,
    totalAttempts: 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Platform Overview & Metrics
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time statistics across users, exams, questions, and payments.
        </p>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-muted">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center space-x-1">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>Total Users</span>
            </span>
            <CardTitle className="text-2xl font-extrabold mt-1">
              {metrics.totalUsers}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-[10px] text-muted-foreground">Registered accounts</span>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center space-x-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Paid Users</span>
            </span>
            <CardTitle className="text-2xl font-extrabold mt-1 text-primary">
              {metrics.paidUsers}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-[10px] text-muted-foreground">Paying customers</span>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center space-x-1">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span>Total Orders</span>
            </span>
            <CardTitle className="text-2xl font-extrabold mt-1">
              {metrics.totalOrders}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-[10px] text-muted-foreground">{metrics.paidOrders} completed</span>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center space-x-1">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              <span>Total Revenue</span>
            </span>
            <CardTitle className="text-2xl font-extrabold mt-1 text-primary">
              {formatCurrency(metrics.totalRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-[10px] text-muted-foreground">Razorpay gateway</span>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center space-x-1">
              <BookOpen className="h-3.5 w-3.5 text-purple-600" />
              <span>Total Exams</span>
            </span>
            <CardTitle className="text-2xl font-extrabold mt-1">
              {metrics.totalExams}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-[10px] text-muted-foreground">{metrics.totalQuestions} questions</span>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center space-x-1">
              <Layers className="h-3.5 w-3.5 text-amber-600" />
              <span>Total Attempts</span>
            </span>
            <CardTitle className="text-2xl font-extrabold mt-1 text-amber-600">
              {metrics.totalAttempts}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-[10px] text-muted-foreground">Completed & active</span>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-muted">
          <CardHeader className="p-5 pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">Recent Orders</CardTitle>
              <CardDescription className="text-xs">Latest customer purchases</CardDescription>
            </div>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="text-xs">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data?.recentOrders?.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center">
                No orders processed yet
              </div>
            ) : (
              data?.recentOrders?.map((ord: any) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/10 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground">
                      {ord.user?.name || ord.user?.email}
                    </span>
                    <div className="text-[11px] text-muted-foreground">
                      {ord.product?.name}
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-bold text-foreground">
                      {formatCurrency(ord.amount)}
                    </div>
                    <Badge
                      variant={ord.status === 'PAID' ? 'success' : 'secondary'}
                      className="text-[10px]"
                    >
                      {ord.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Attempts */}
        <Card className="border-muted">
          <CardHeader className="p-5 pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">Recent Exam Attempts</CardTitle>
              <CardDescription className="text-xs">Candidate test activity</CardDescription>
            </div>
            <Link href="/admin/exams">
              <Button variant="ghost" size="sm" className="text-xs">
                View Exams
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data?.recentAttempts?.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center">
                No attempts recorded yet
              </div>
            ) : (
              data?.recentAttempts?.map((att: any) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/10 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground">
                      {att.user?.name || att.user?.email}
                    </span>
                    <div className="text-[11px] text-muted-foreground">
                      {att.exam?.title}
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-bold text-foreground">
                      {att.percentage !== null ? `${att.percentage}%` : 'In Progress'}
                    </div>
                    <Badge
                      variant={
                        att.status === 'IN_PROGRESS'
                          ? 'warning'
                          : att.isPassed
                          ? 'success'
                          : 'destructive'
                      }
                      className="text-[10px]"
                    >
                      {att.status === 'IN_PROGRESS'
                        ? 'Running'
                        : att.isPassed
                        ? 'Passed'
                        : 'Failed'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
