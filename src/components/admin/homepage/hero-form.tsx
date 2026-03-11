
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Film, Image as ImageIcon } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  subtitle: z.string().min(5, 'Subtitle must be at least 5 characters'),
  cta: z.string().min(3, 'CTA text must be at least 3 characters'),
  mediaUrl: z.string().min(1, 'Please upload a media file'),
  mediaType: z.enum(['image', 'video']),
});

export function HeroForm({ onSuccess, initialData }: { onSuccess: () => void; initialData?: any }) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialData?.mediaUrl || null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>(initialData?.mediaType || 'image');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: '',
      subtitle: '',
      cta: '',
      mediaUrl: '',
      mediaType: 'image',
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast({ variant: 'destructive', title: 'Invalid file', description: 'Please upload an image or a video.' });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `hero/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const type = isImage ? 'image' : 'video';
      setPreview(publicUrl);
      setMediaType(type);
      form.setValue('mediaUrl', publicUrl);
      form.setValue('mediaType', type);

      toast({ title: 'Success', description: 'File uploaded successfully.' });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (initialData?.id) {
        const { error } = await supabase
          .from('hero_slides')
          .update({ data: values })
          .eq('id', initialData.id);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Hero slide updated successfully.' });
      } else {
        const { error } = await supabase
          .from('hero_slides')
          .insert({ id: Math.random().toString(36).substring(7), data: values });
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Hero slide added successfully.' });
      }
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save hero slide.' });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Professional Video Editing" {...field} className="bg-transparent" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subtitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtitle</FormLabel>
              <FormControl>
                <Input placeholder="From raw footage to cinematic masterpiece." {...field} className="bg-transparent" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cta"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CTA Button Text</FormLabel>
              <FormControl>
                <Input placeholder="Get a Quote" {...field} className="bg-transparent" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <FormLabel>Media (Image or Video)</FormLabel>
          <div className="flex flex-col gap-4">
            {preview ? (
              <div className="relative aspect-video rounded-md overflow-hidden bg-black/20 border border-[#333]">
                {mediaType === 'image' ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={preview} className="w-full h-full object-cover" controls />
                )}
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => {
                    setPreview(null);
                    form.setValue('mediaUrl', '');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-[#333] rounded-md cursor-pointer hover:bg-white/5 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-500 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload image or video</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            )}
            <FormMessage>{form.formState.errors.mediaUrl?.message}</FormMessage>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isUploading}>
          {form.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {form.formState.isSubmitting ? 'Saving...' : 'Save Hero Slide'}
        </Button>
      </form>
    </Form>
  );
}
