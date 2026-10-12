'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminNewExamPage() {
  const router = useRouter();

  const [certificationId, setCertificationId] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('90');
  const [totalQuestions, setTotalQuestions] = useState('60');
  const [passingPercentage, setPassingPercentage] = useState('70');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  // Question Selection Mode
  const [selectionMode, setSelectionMode] = useState<'random' | 'manual'>('random');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load certifications
  const { data: certs } = useQuery({
    queryKey: ['admin-certs-for-exam'],
    queryFn: async () => {
      const res = await api.get('/certifications/admin/all');
      if (res.data?.length > 0 && !certificationId) {
        setCertificationId(res.data[0].id);
      }
      return res.data;
    },
  });

  // Load published questions for manual picker
  const { data: questionData, isLoading: loadingQuestions } = useQuery({
    queryKey: ['admin-questions-picker', certificationId],
    queryFn: async () => {
      if (!certificationId) return null;
      const res = await api.get(
        `/questions?certificationId=${certificationId}&status=PUBLISHED&limit=100`,
      );
      return res.data;
    },
    enabled: Boolean(certificationId),
  });

  const availableQuestions = questionData?.questions || [];

  const toggleQuestionSelection = (qId: string) => {
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const dur = parseInt(durationMinutes, 10);
    const tot = parseInt(totalQuestions, 10);
    const pass = parseFloat(passingPercentage);

    if (selectionMode === 'manual' && selectedQuestionIds.length === 0) {
      setError('Please select at least one question for manual composition.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/exams', {
        certificationId,
        title,
        slug,
        description,
        durationMinutes: dur,
        totalQuestions: selectionMode === 'manual' ? selectedQuestionIds.length : tot,
        passingPercentage: pass,
        status,
        randomSelection: selectionMode === 'random',
        questionIds: selectionMode === 'manual' ? selectedQuestionIds : undefined,
      });

      router.push('/admin/exams');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create exam');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/exams"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          <span>Back to Mock Exams</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Build Mock Exam
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure an exam simulation using manual selection or random question selection.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-muted shadow-sm">
          <CardContent className="p-6 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Target Certification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cert">Certification Track</Label>
                <select
                  id="cert"
                  value={certificationId}
                  onChange={(e) => setCertificationId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs shadow-sm font-medium"
                  required
                >
                  {certs?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="slug">Exam Slug</Label>
                <Input
                  id="slug"
                  placeholder="gh-600-mock-exam-3"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <Label htmlFor="title">Exam Name</Label>
              <Input
                id="title"
                placeholder="GH-600 Mock Exam 3: Advanced Architectures"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="desc">Description</Label>
              <textarea
                id="desc"
                rows={2}
                placeholder="Brief summary of test scope and expectations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/20 border">
              <div className="space-y-1">
                <Label htmlFor="dur">Duration (Minutes)</Label>
                <Input
                  id="dur"
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pass">Passing Percentage (%)</Label>
                <Input
                  id="pass"
                  type="number"
                  step="0.1"
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(e.target.value)}
                  min="1"
                  max="100"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="tot">Total Questions</Label>
                <Input
                  id="tot"
                  type="number"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(e.target.value)}
                  min="1"
                  disabled={selectionMode === 'manual'}
                  required
                />
              </div>
            </div>

            {/* Question Selection Strategy */}
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-semibold">Question Composition Strategy</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setSelectionMode('random')}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectionMode === 'random'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-semibold text-xs text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Random Question Selection</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    System picks {totalQuestions} random published questions from this certification.
                  </p>
                </div>

                <div
                  onClick={() => setSelectionMode('manual')}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectionMode === 'manual'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-semibold text-xs text-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Manual Question Selection</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Manually select specific questions from the published Question Bank.
                  </p>
                </div>
              </div>
            </div>

            {/* Manual Selection Table */}
            {selectionMode === 'manual' && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Select Questions ({selectedQuestionIds.length} chosen)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedQuestionIds(
                        selectedQuestionIds.length === availableQuestions.length
                          ? []
                          : availableQuestions.map((q: any) => q.id),
                      )
                    }
                    className="text-primary hover:underline text-xs"
                  >
                    {selectedQuestionIds.length === availableQuestions.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto border rounded-xl divide-y">
                  {availableQuestions.map((q: any) => {
                    const isChecked = selectedQuestionIds.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => toggleQuestionSelection(q.id)}
                        className={`p-3 flex items-start space-x-3 text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-primary/5' : 'hover:bg-muted/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-input text-primary focus:ring-primary h-4 w-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{q.text}</p>
                          <div className="flex items-center space-x-2 text-[10px] text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-[9px]">
                              {q.domain?.code}
                            </Badge>
                            <span>{q.difficulty}</span>
                            <span>{q.type}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center space-x-2 pt-2 border-t">
              <input
                type="checkbox"
                id="publishExam"
                checked={status === 'PUBLISHED'}
                onChange={(e) => setStatus(e.target.checked ? 'PUBLISHED' : 'DRAFT')}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <Label htmlFor="publishExam" className="text-xs cursor-pointer">
                Publish immediately (otherwise saved as DRAFT)
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t p-4 bg-muted/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/exams')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Building Exam...</span>
                </>
              ) : (
                'Build Exam'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
