'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, AlertCircle } from 'lucide-react';

export default function AdminDomainsPage() {
  const queryClient = useQueryClient();
  const [selectedCertId, setSelectedCertId] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<any | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState<string>('20');
  const [error, setError] = useState<string | null>(null);

  // Load certifications
  const { data: certs } = useQuery({
    queryKey: ['admin-certifications-list'],
    queryFn: async () => {
      const res = await api.get('/certifications/admin/all');
      if (res.data?.length > 0 && !selectedCertId) {
        setSelectedCertId(res.data[0].id);
      }
      return res.data;
    },
  });

  // Load domains for selected certification
  const { data: domains, isLoading } = useQuery({
    queryKey: ['admin-domains', selectedCertId],
    queryFn: async () => {
      if (!selectedCertId) return [];
      const res = await api.get(`/domains?certificationId=${selectedCertId}`);
      return res.data;
    },
    enabled: Boolean(selectedCertId),
  });

  const openCreateModal = () => {
    setEditingDomain(null);
    setName('');
    setCode('');
    setDescription('');
    setWeight('20');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (dom: any) => {
    setEditingDomain(dom);
    setName(dom.name);
    setCode(dom.code || '');
    setDescription(dom.description || '');
    setWeight(dom.weight ? dom.weight.toString() : '20');
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const weightNum = parseFloat(weight) || 0;
      if (editingDomain) {
        await api.put(`/domains/${editingDomain.id}`, {
          name,
          code,
          description,
          weight: weightNum,
        });
      } else {
        await api.post('/domains', {
          certificationId: selectedCertId,
          name,
          code,
          description,
          weight: weightNum,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-domains'] });
      setModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save domain');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this domain? Associated questions may be deleted.')) return;
    try {
      await api.delete(`/domains/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['admin-domains'] });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manage Domains & Objectives
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure learning objectives and certification domain weights.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Cert selector */}
          <select
            value={selectedCertId}
            onChange={(e) => setSelectedCertId(e.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-xs shadow-sm font-medium"
          >
            {certs?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>

          <Button onClick={openCreateModal} size="sm" className="text-xs">
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            <span>Add Domain</span>
          </Button>
        </div>
      </div>

      <Card className="border-muted">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Code</TableHead>
              <TableHead>Domain Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24">Weight</TableHead>
              <TableHead className="w-24">Questions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                  Loading domains...
                </TableCell>
              </TableRow>
            ) : domains?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                  No domains defined for this certification yet.
                </TableCell>
              </TableRow>
            ) : (
              domains?.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono font-bold text-xs">
                    {d.code || '--'}
                  </TableCell>
                  <TableCell className="font-semibold text-xs">
                    {d.name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {d.description || '--'}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">
                    {d.weight ? `${d.weight}%` : '--'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {d._count?.questions || 0}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(d)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(d.id)}
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

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>
            {editingDomain ? 'Edit Domain' : 'Create New Domain'}
          </DialogTitle>
          <DialogDescription>
            Define domain name, code, description, and test percentage weight.
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
              <Label htmlFor="code">Code (e.g. DOM-1)</Label>
              <Input
                id="code"
                placeholder="DOM-1"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="weight">Weight (%)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="20"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="name">Domain Name</Label>
            <Input
              id="name"
              placeholder="Agent Architecture & Foundations"
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
              placeholder="Domain scope and objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
              {editingDomain ? 'Save Changes' : 'Create Domain'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
