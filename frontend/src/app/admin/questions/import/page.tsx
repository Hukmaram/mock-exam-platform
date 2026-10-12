'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  Loader2,
} from 'lucide-react';

export default function AdminImportQuestionsPage() {
  const router = useRouter();
  const [certificationId, setCertificationId] = useState('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const { data: certs } = useQuery({
    queryKey: ['admin-certs-import'],
    queryFn: async () => {
      const res = await api.get('/certifications/admin/all');
      if (res.data?.length > 0 && !certificationId) {
        setCertificationId(res.data[0].id);
      }
      return res.data;
    },
  });

  const sampleCsv = `question,type,difficulty,domain,optionA,optionB,optionC,optionD,correctAnswer,explanation
"Which MCP transport is standard for local child process tools?",SINGLE_CHOICE,EASY,DOM-4,"stdio JSON-RPC 2.0","Bluetooth 5.0","Raw TCP","UDP multicast",A,"stdio over standard in/out is the standard transport for local MCP tools."
"Which methods mitigate infinite agent loops?",MULTIPLE_CHOICE,MEDIUM,DOM-1,"Step limit","Trajectory cycle check","Max temperature","Human-in-the-loop",A,B,D,"Setting recursion limit and cycle checking prevents runaway agent loop execution."`;

  const sampleJson = `[
  {
    "text": "What is the primary role of a reasoning thought trace in ReAct loops?",
    "type": "SINGLE_CHOICE",
    "difficulty": "MEDIUM",
    "domain": "DOM-1",
    "explanation": "Allows deliberate state tracking and tool parameter synthesis.",
    "options": [
      { "key": "A", "text": "Encrypt credentials", "isCorrect": false },
      { "key": "B", "text": "Deliberate and plan next tool action", "isCorrect": true },
      { "key": "C", "text": "Bypass token limit", "isCorrect": false },
      { "key": "D", "text": "Disable context memory", "isCorrect": false }
    ]
  }
]`;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificationId) {
      setError('Please select a target certification');
      return;
    }

    if (!file && !rawText.trim()) {
      setError('Please select a file or paste content to import');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('certificationId', certificationId);
      formData.append('format', format);

      if (file) {
        formData.append('file', file);
      } else {
        formData.append('rawContent', rawText);
      }

      const res = await api.post('/questions/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Import failed. Please check file format.');
    } finally {
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
          Import Question Bank
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Bulk-import questions from CSV spreadsheets or structured JSON documents.
        </p>
      </div>

      {/* Status Notice (Rule 15) */}
      <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="font-semibold text-xs">Review Workflow Policy</AlertTitle>
        <AlertDescription className="text-xs leading-relaxed mt-1">
          Imported questions automatically enter <strong>DRAFT</strong> status. They will NOT appear in student exams until you inspect and publish them in the Question Bank.
        </AlertDescription>
      </Alert>

      {result && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle className="font-semibold text-xs">Import Completed Successfully</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            {result.message}. You can now view them in the Question Bank table.
            <div className="mt-2">
              <Link href="/admin/questions">
                <Button size="sm" variant="outline" className="text-xs h-7">
                  View Questions in Bank →
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleImport}>
        <Card className="border-muted shadow-sm">
          <CardContent className="p-6 space-y-6">
            {/* Target Certification */}
            <div className="space-y-1.5 max-w-sm">
              <Label htmlFor="cert">Target Certification Track</Label>
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

            {/* Format Tabs */}
            <div className="space-y-3">
              <Label>Select Import Format</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant={format === 'csv' ? 'default' : 'outline'}
                  onClick={() => setFormat('csv')}
                  className="text-xs"
                >
                  CSV Document (.csv)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={format === 'json' ? 'default' : 'outline'}
                  onClick={() => setFormat('json')}
                  className="text-xs"
                >
                  JSON Array (.json)
                </Button>
              </div>
            </div>

            {/* File Upload Or Paste Box */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Choose File to Upload</Label>
                <input
                  type="file"
                  accept={format === 'csv' ? '.csv' : '.json'}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-semibold">
                    Or paste raw content directly
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="raw">Raw {format.toUpperCase()} Text</Label>
                <textarea
                  id="raw"
                  rows={6}
                  placeholder={`Paste ${format.toUpperCase()} content here...`}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="font-mono text-xs flex w-full rounded-md border border-input bg-transparent px-3 py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Format Guide / Template Snippet */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center space-x-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>Expected {format.toUpperCase()} Structure</span>
                </span>
                <button
                  type="button"
                  onClick={() => setRawText(format === 'csv' ? sampleCsv : sampleJson)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Load Sample Data
                </button>
              </div>
              <pre className="p-3 rounded bg-background border text-[11px] overflow-x-auto font-mono text-muted-foreground">
                {format === 'csv' ? sampleCsv : sampleJson}
              </pre>
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
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-[#C16345] text-primary-foreground font-semibold">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Importing & Validating...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  <span>Import Questions (to DRAFT)</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
