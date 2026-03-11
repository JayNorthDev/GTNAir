"use client";

import { useState, useMemo } from 'react';
import { usePlaylists, Playlist, updateAllPlaylists } from '@/hooks/usePlaylists';
import { Plus, Edit2, Trash2, Loader, Save, Layers, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FormErrors {
  name?: string;
  category?: string;
  url?: string;
}

export default function AdminPlaylistsPage() {
  const { playlists, isLoading } = usePlaylists();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({ id: '', name: '', url: '', category: '' as any });
  const [errors, setErrors] = useState<FormErrors>({});

  const mainPlaylists = useMemo(() => 
    playlists.filter(p => p.category === 'Main Playlists').sort((a, b) => a.order - b.order), 
    [playlists]
  );
  const subPlaylists = useMemo(() => 
    playlists.filter(p => p.category === 'Sub Playlists').sort((a, b) => a.order - b.order), 
    [playlists]
  );

  const handleOpenDialog = (playlist?: Playlist) => {
    setErrors({});
    if (playlist) {
      setFormData({ 
        id: playlist.id, 
        name: playlist.name, 
        url: playlist.url, 
        category: playlist.category 
      });
    } else {
      setFormData({ id: '', name: '', url: '', category: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};
    const name = formData.name.trim();
    const url = formData.url.trim();
    const category = formData.category;

    if (!name) newErrors.name = 'Playlist Name is required.';
    if (!category) newErrors.category = 'Please select a category.';
    
    const urlRegex = /^https:\/\/.*\.m3u8?(\?.*)?$/i;
    if (!url) {
      newErrors.url = 'Playlist URL is required.';
    } else if (!urlRegex.test(url)) {
      newErrors.url = 'Must be an HTTPS URL ending in .m3u or .m3u8';
    } else if (playlists.some(p => p.url.toLowerCase() === url.toLowerCase() && p.id !== formData.id)) {
      newErrors.url = 'This playlist URL already exists.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    
    let updatedItems = [...playlists];
    
    if (formData.id) {
      // Edit
      updatedItems = updatedItems.map(p => {
        if (p.id === formData.id) {
          const catChanged = p.category !== category;
          const nextOrder = catChanged 
            ? updatedItems.filter(item => item.category === category).length 
            : p.order;
            
          return {
            ...p,
            name,
            url,
            category,
            order: nextOrder,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
    } else {
      // Add
      const newId = Math.random().toString(36).substring(7);
      const categoryItems = playlists.filter(p => p.category === category);
      const nextOrder = categoryItems.length;
      
      updatedItems.push({
        id: newId,
        name,
        url,
        category,
        order: nextOrder,
        updatedAt: new Date().toISOString()
      });
    }

    try {
      await updateAllPlaylists(updatedItems);
      setIsDialogOpen(false);
      toast({ title: 'Playlist Saved', description: 'Settings updated successfully.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save playlist.' });
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    
    const updatedItems = playlists.filter(p => p.id !== deleteTarget);
    
    try {
      await updateAllPlaylists(updatedItems);
      toast({ title: 'Deleted', description: 'Playlist removed.' });
      setDeleteTarget(null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete.' });
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down', list: Playlist[]) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;

    // 1. Create a copy of the specific category list and reorder
    const categoryList = [...list];
    const [movedItem] = categoryList.splice(index, 1);
    categoryList.splice(newIndex, 0, movedItem);

    // 2. Update order values for the entire category
    const reorderedCategory = categoryList.map((item, idx) => ({
      ...item,
      order: idx
    }));

    // 3. Merge with the rest of the global playlists
    const otherPlaylists = playlists.filter(p => p.category !== list[0].category);
    const finalItems = [...otherPlaylists, ...reorderedCategory];

    try {
      await updateAllPlaylists(finalItems);
      toast({ title: 'Reordered', description: `Moved ${movedItem.name} ${direction}.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update reordering.' });
    }
  };

  const renderPlaylistTable = (title: string, items: Playlist[]) => (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardHeader className="border-b border-[#333]/50 pb-4">
        <CardTitle className="text-white text-lg flex items-center gap-2">
           <Layers className="w-5 h-5 text-purple-500" />
           {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="border-b border-[#333]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-gray-400 w-[60px]">#</TableHead>
              <TableHead className="text-gray-400">Name</TableHead>
              <TableHead className="text-gray-400">URL</TableHead>
              <TableHead className="text-gray-400 w-[180px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                  No playlists in this category.
                </TableCell>
              </TableRow>
            ) : (
              items.map((pl, idx) => (
                <TableRow key={pl.id} className="border-b border-[#333]/50 hover:bg-[#222]">
                  <TableCell className="font-medium text-gray-500">{idx + 1}</TableCell>
                  <TableCell className="font-medium text-white">{pl.name}</TableCell>
                  <TableCell className="text-gray-400 font-mono text-xs max-w-md truncate">
                    {pl.url}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={idx === 0}
                        onClick={() => moveItem(idx, 'up', items)}
                        className="hover:bg-white/5 text-gray-400 hover:text-white"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={idx === items.length - 1}
                        onClick={() => moveItem(idx, 'down', items)}
                        className="hover:bg-white/5 text-gray-400 hover:text-white"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(pl)} className="hover:bg-purple-500/10 text-gray-400 hover:text-purple-400">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setDeleteTarget(pl.id)} 
                        className="hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Playlist Settings</h2>
          <p className="text-gray-400 text-sm">Manage all sources from a single document for optimized read costs.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" /> Add New Playlist
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="grid gap-12">
           {renderPlaylistTable("Main Playlists", mainPlaylists)}
           {renderPlaylistTable("Sub Playlists", subPlaylists)}
        </div>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
          <DialogHeader>
            <DialogTitle>{formData.id ? 'Edit Playlist' : 'Add New Playlist'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Playlist Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-black border-[#333]"
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(val: any) => setFormData({ ...formData, category: val })}>
                <SelectTrigger className="bg-black border-[#333]">
                  <SelectValue placeholder="Select Category..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                  <SelectItem value="Main Playlists">Main Playlists</SelectItem>
                  <SelectItem value="Sub Playlists">Sub Playlists</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-red-400">{errors.category}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="url">Playlist URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="bg-black border-[#333]"
              />
              {errors.url && <p className="text-xs text-red-400">{errors.url}</p>}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
                {isSaving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#1a1a1a] border-[#333] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will remove the playlist from the central settings document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white border-none">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}