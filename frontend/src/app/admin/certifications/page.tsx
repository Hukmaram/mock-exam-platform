'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminCertificationsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<any | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: certs, isLoading } = useQuery({
    queryKey: ['admin-certifications'],
    queryFn: async () => {
      const res = await api.get('/certifications/admin/all');
      return res.data;
    },
  });

  const openCreateModal = () => {
    setEditingCert(null);
    setName('');
    setCode('');
    setSlug('');
    setDescription('');
    setIsPublished(true);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (cert: any) => {
    setEditingCert(cert);
    setName(cert.name);
    setCode(cert.code);
    setSlug(cert.slug);
    setDescription(cert.description);
    setIsPublished(cert.isPublished);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingCert) {
        await api.put(`/certifications/${editingCert.id}`, {
          name,
          code,
          slug,
          description,
          isPublished,
        });
      } else {
        await api.post('/certifications', {
          name,
          code,
          slug,
          description,
          isPublished,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-certifications'] });
      setModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save certification');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;
    try {
      await api.delete(`/certifications/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['admin-certifications'] });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manage Certifications
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add or configure technical certifications and tracks.
          </p>
        </div>
        <Button onClick={openCreateModal} size="sm" className="text-xs">
          <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
          <span>Add Certification</span>
        </Button>
      </div>

      <Card className="border-muted">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Code</TableHead>
              <TableHead>Certification Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Domains</TableHead>
              <TableHead>Exams</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                  Loading certifications...
                </TableCell>
              </TableRow>
            ) : certs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                  No certifications found. Click 'Add Certification' to create one.
                </TableCell>
              </TableRow>
            ) : (
              certs?.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold text-xs">
                    {c.code}
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    {c.name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {c.slug}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.domains?.length || 0}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c._count?.exams || 0}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isPublished ? 'success' : 'secondary'} className="text-[10px]">
                      {c.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(c)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(c.id)}
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

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>
            {editingCert ? 'Edit Certification' : 'Create New Certification'}
          </DialogTitle>
          <DialogDescription>
            Configure the certification code, title, and public visibility.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="code">Code (e.g. GH-600)</Label>
              <Input
                id="code"
                placeholder="GH-600"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                placeholder="gh-600"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="name">Certification Title</Label>
            <Input
              id="name"
              placeholder="GitHub Agentic AI Developer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="desc">Description</Label>
            <textarea
              id="desc"
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Overview of this certification track..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
            />
            <Label htmlFor="isPublished" className="text-xs cursor-pointer">
              Published and visible to users
            </Label>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingCert ? 'Save Changes' : 'Create Certification'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
