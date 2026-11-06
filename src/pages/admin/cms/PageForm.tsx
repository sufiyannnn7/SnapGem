import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { cmsService, Page } from '@/services/cmsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// Tiptap
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function PageForm() {
  const { id } = useParams();
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading } = useQuery({
    queryKey: ['admin_page', id],
    queryFn: () => cmsService.getPageById(id as string),
    enabled: isEditing
  });

  const form = useForm<Partial<Page>>({
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      is_published: true,
      seo_title: '',
      seo_description: ''
    }
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      form.setValue('content', editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none min-h-[300px] border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-primary',
      }
    }
  });

  useEffect(() => {
    if (page) {
      form.reset(page);
      if (editor && page.content) {
        editor.commands.setContent(page.content);
      }
    }
  }, [page, form, editor]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Page>) => {
       if (!data.slug && data.title) {
         data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
       }
       if (isEditing) {
         return cmsService.updatePage(id as string, data);
       } else {
         return cmsService.createPage(data);
       }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_pages'] });
      toast.success(isEditing ? 'Page updated' : 'Page created');
      navigate('/admin/pages');
    },
    onError: (e) => toast.error(`Failed: ${e.message}`)
  });

  const onSubmit = (data: Partial<Page>) => {
    saveMutation.mutate(data);
  };

  if (isEditing && isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/pages')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{isEditing ? 'Edit Page' : 'New Page'}</h2>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Page Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. about-us (auto-generated if left blank)" /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0 rounded-lg border p-4 mt-4">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel>Published</FormLabel>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>Use the rich text editor to write your page content.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Toolbar */}
              <div className="flex flex-wrap gap-2 mb-2 border p-2 rounded-md bg-secondary/20">
                <Button type="button" variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'bg-primary text-primary-foreground' : ''}>Bold</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleItalic().run()} className={editor?.isActive('italic') ? 'bg-primary text-primary-foreground' : ''}>Italic</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={editor?.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : ''}>H2</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={editor?.isActive('heading', { level: 3 }) ? 'bg-primary text-primary-foreground' : ''}>H3</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={editor?.isActive('bulletList') ? 'bg-primary text-primary-foreground' : ''}>Bullet List</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={editor?.isActive('orderedList') ? 'bg-primary text-primary-foreground' : ''}>Number List</Button>
              </div>
              <EditorContent editor={editor} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search Engine Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="seo_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Title</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="seo_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Description</FormLabel>
                    <FormControl><Textarea {...field} value={field.value || ''} /></FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-10 md:pl-64">
             <Button type="button" variant="outline" onClick={() => navigate('/admin/pages')}>Cancel</Button>
             <Button type="submit" disabled={saveMutation.isPending}>
               {saveMutation.isPending ? 'Saving...' : 'Save Page'}
             </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
