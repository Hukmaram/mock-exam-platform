'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, PlusCircle, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminNewQuestionPage() {
  const router = useRouter();

  const [certificationId, setCertificationId] = useState('');
  const [domainId, setDomainId] = useState('');
  const [text, setText] = useState('');
  const [type, setType] = useState<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'>('SINGLE_CHOICE');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [explanation, setExplanation] = useState('');

  const [options, setOptions] = useState([
    { key: 'A', text: '', isCorrect: false },
    { key: 'B', text: '', isCorrect: false },
    { key: 'C', text: '', isCorrect: false },
    { key: 'D', text: '', isCorrect: false },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load certifications
  const { data: certs } = useQuery({
    queryKey: ['admin-certs-select'],
    queryFn: async () => {
      const res = await api.get('/certifications/admin/all');
      if (res.data?.length > 0 && !certificationId) {
        setCertificationId(res.data[0].id);
      }
      return res.data;
    },
  });

  // Load domains for current certification
  const { data: domains } = useQuery({
    queryKey: ['admin-domains-select', certificationId],
    queryFn: async () => {
      if (!certificationId) return [];
      const res = await api.get(`/domains?certificationId=${certificationId}`);
      if (res.data?.length > 0) {
        setDomainId(res.data[0].id);
      }
      return res.data;
    },
    enabled: Boolean(certificationId),
  });

  const handleOptionChange = (idx: number, field: string, value: any) => {
    const updated = [...options];
    if (field === 'isCorrect' && type === 'SINGLE_CHOICE') {
      // In single choice, only one can be checked
      updated.forEach((o, i) => {
        o.isCorrect = i === idx ? value : false;
      });
    } else {
      (updated[idx] as any)[field] = value;
    }
    setOptions(updated);
  };

  const addOption = () => {
    const nextKey = String.fromCharCode(65 + options.length);
    setOptions([...options, { key: nextKey, text: '', isCorrect: false }]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) {
      alert('A question must have at least 2 options.');
      return;
    }
    const updated = options.filter((_, i) => i !== idx);
    // Re-index keys
    updated.forEach((o, i) => {
      o.key = String.fromCharCode(65 + i);
    });
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount === 0) {
      setError('At least one option must be marked as correct.');
      return;
    }
    if (type === 'SINGLE_CHOICE' && correctCount > 1) {
      setError('SINGLE_CHOICE questions can only have one correct answer.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/questions', {
        certificationId,
        domainId,
        text,
        type,
        difficulty,
        status,
        explanation,
        options,
      });

      router.push('/admin/questions');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create question.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/questions"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          <span>Back to Question Bank</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create Question Item
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Add an individual question with answer options, correct key, and rationale.
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

            {/* Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cert">Certification</Label>
                <select
                  id="cert"
                  value={certificationId}
                  onChange={(e) => setCertificationId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs shadow-sm font-medium"
                  required
                >
                  {certs?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="dom">Domain</Label>
                <select
                  id="dom"
                  value={domainId}
                  onChange={(e) => setDomainId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs shadow-sm font-medium"
                  required
                >
                  {domains?.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.code ? `[${d.code}] ` : ''}{d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="type">Question Type</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as any);
                    // If switching to single choice, ensure only first checked option is checked
                    if (e.target.value === 'SINGLE_CHOICE') {
                      let foundFirst = false;
                      const next = options.map((o) => {
                        if (o.isCorrect && !foundFirst) {
                          foundFirst = true;
                          return o;
                        }
                        return { ...o, isCorrect: false };
                      });
                      setOptions(next);
                    }
                  }}
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs shadow-sm font-medium"
                >
                  <option value="SINGLE_CHOICE">Single Choice</option>
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="diff">Difficulty</Label>
                <select
                  id="diff"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs shadow-sm font-medium"
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-1.5">
              <Label htmlFor="qtext">Question Prompt</Label>
              <textarea
                id="qtext"
                rows={3}
                placeholder="Enter clear, realistic question prompt..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>

            {/* Options Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Answer Options & Correct Answer Key</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="text-xs h-7"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  <span>Add Option</span>
                </Button>
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/20 text-xs"
                  >
                    <div className="font-bold font-mono w-6 text-center text-foreground">
                      {opt.key}
                    </div>

                    <Input
                      placeholder={`Option ${opt.key} text`}
                      value={opt.text}
                      onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                      className="flex-1 text-xs bg-card"
                      required
                    />

                    <label className="flex items-center space-x-1.5 cursor-pointer shrink-0">
                      <input
                        type={type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                        name="correctAnswerGroup"
                        checked={opt.isCorrect}
                        onChange={(e) => handleOptionChange(idx, 'isCorrect', e.target.checked)}
                        className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="font-semibold text-primary">
                        Correct
                      </span>
                    </label>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(idx)}
                      disabled={options.length <= 2}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-1.5">
              <Label htmlFor="explanation">Comprehensive Explanation</Label>
              <textarea
                id="explanation"
                rows={3}
                placeholder="Explain why the correct answer is right and why the distractors are wrong..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="publishNow"
                checked={status === 'PUBLISHED'}
                onChange={(e) => setStatus(e.target.checked ? 'PUBLISHED' : 'DRAFT')}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <Label htmlFor="publishNow" className="text-xs cursor-pointer">
                Publish immediately (otherwise saved as DRAFT for review)
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t p-4 bg-muted/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/questions')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Question'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
