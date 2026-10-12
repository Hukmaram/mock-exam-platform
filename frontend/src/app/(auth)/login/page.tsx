'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Loader2, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      router.push(redirect);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Invalid email or password. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-muted">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-2 shadow">
          <GraduationCap className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold">Sign In to CertPrep AI</CardTitle>
        <CardDescription>
          Enter your credentials to access your mock exams and attempt history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Quick Demo Logins Helper */}
        <div className="mt-6 border-t pt-4">
          <div className="text-xs text-muted-foreground mb-2 font-medium">
            Demo Credentials (Pre-seeded):
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@mockexam.local');
                setPassword('Admin@123456');
              }}
              className="p-2 border rounded text-left hover:bg-muted/50 transition-colors"
            >
              <div className="font-semibold text-foreground">Admin Account</div>
              <div className="text-[10px] text-muted-foreground">admin@mockexam.local</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('user@mockexam.local');
                setPassword('User@123456');
              }}
              className="p-2 border rounded text-left hover:bg-muted/50 transition-colors"
            >
              <div className="font-semibold text-foreground">Normal User</div>
              <div className="text-[10px] text-muted-foreground">user@mockexam.local</div>
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-center border-t py-4 text-xs text-muted-foreground">
        Don't have an account?{' '}
        <Link href="/register" className="ml-1 text-primary font-medium hover:underline">
          Create an account
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <Suspense fallback={<div className="h-96 w-full max-w-md rounded-xl bg-muted/20 animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
