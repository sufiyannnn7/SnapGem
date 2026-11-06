import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { cmsService, Page } from '@/services/cmsService';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, FileText, Globe } from 'lucide-react';
import { toast } from 'sonner';

export function Pages() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['admin_pages'],
    queryFn: cmsService.getPages
  });

  const deleteMutation = useMutation({
    mutationFn: cmsService.deletePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_pages'] });
      toast.success('Page deleted successfully');
    },
    onError: (e) => toast.error(`Failed: ${e.message}`)
  });

  const filteredPages = pages.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pages</h2>
          <p className="text-muted-foreground mt-2">Manage static pages like About, Contact, Terms, and Privacy.</p>
        </div>
        <Button onClick={() => navigate('/admin/pages/new')}>
          <Plus className="mr-2 h-4 w-4" /> Add Page
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 border-b">
                <tr>
                  <th className="p-4 font-medium">Title</th>
                  <th className="p-4 font-medium">Slug</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
                ) : filteredPages.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center">No pages found.</td></tr>
                ) : (
                  filteredPages.map((page) => (
                    <tr key={page.id} className="border-b last:border-0 hover:bg-secondary/20">
                      <td className="p-4 flex items-center gap-3 font-medium">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {page.title}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        /{page.slug}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${page.is_published ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-700'}`}>
                          {page.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {page.is_published && (
                           <Button variant="ghost" size="icon" asChild title="View on site">
                             <a href={`/pages/${page.slug}`} target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4 text-muted-foreground" /></a>
                           </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/pages/${page.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => {
                          if(confirm('Are you sure you want to delete this page?')) {
                            deleteMutation.mutate(page.id);
                          }
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
