"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/firebase/config';
import { collection, doc, onSnapshot, deleteDoc, query, orderBy, addDoc, updateDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Loader, Save, Layers, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface Playlist {
  id: string;
  name: string;
  url: string;
  category: 'Main Playlists' | 'Sub Playlists';
  order: number;
  updatedAt: string;
}

export default function AdminPlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({ id: '', name: '', url: '', category: '' as any });

  useEffect(() => {
    const q = query(collection(db, 'playlists'), orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return { 
          id: doc.id, 
          ...docData,
          category: docData.category || 'Main Playlists',
          order: typeof docData.order === 'number' ? docData.order : 0
        } as Playlist;
      });
      
      setPlaylists(data);
      setIsLoading(false);
    }, (error) => {
      const permissionError = new FirestorePermissionError({
        path: 'playlists',
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const mainPlaylists = useMemo(() => playlists.filter(p => p.category === 'Main Playlists'), [playlists]);
  const subPlaylists = useMemo(() => playlists.filter(p => p.category === 'Sub Playlists'), [playlists]);

  const handleOpenDialog = (playlist?: Playlist) => {
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    const url = formData.url.trim();
    const category = formData.category;

    // 1. Mandatory Field Validation
    if (!name || !url || !category) {
      toast({ 
        variant: 'destructive', 
        title: 'Validation Error', 
        description: 'All fields (Name, Category, and URL) are mandatory.' 
      });
      return;
    }

    // 2. URL Format Validation (Regex)
    const urlRegex = /^https:\/\/.*\.m3u8?$/;
    if (!urlRegex.test(url)) {
      toast({ 
        variant: 'destructive', 
        title: 'Invalid URL Format', 
        description: 'Playlist URL must start with "https://" and end with ".m3u" or ".m3u8".' 
      });
      return;
    }

    setIsSaving(true);
    
    const maxOrder = playlists.length > 0 ? Math.max(...playlists.map(p => p.order)) : -1;
    const newOrder = maxOrder + 1;

    const payload: any = {
      name,
      url,
      category,
      updatedAt: new Date().toISOString()
    };

    if (formData.id) {
      const docRef = doc(db, 'playlists', formData.id);
      updateDoc(docRef, payload)
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: payload,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    } else {
      payload.order = newOrder;
      const colRef = collection(db, 'playlists');
      addDoc(colRef, payload)
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: colRef.path,
            operation: 'create',
            requestResourceData: payload,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    }

    setIsDialogOpen(false);
    setIsSaving(false);
    toast({ title: 'Playlist Saved', description: 'Your changes have been committed.' });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    const docRef = doc(db, 'playlists', id);
    deleteDoc(docRef)
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
    toast({ title: 'Deleted', description: 'Playlist removed successfully.' });
  };

  const moveItem = (index: number, direction: 'up' | 'down', list: Playlist[]) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;

    const item1 = list[index];
    const item2 = list[newIndex];

    const tempOrder = item1.order;
    
    updateDoc(doc(db, 'playlists', item1.id), { order: item2.order });
    updateDoc(doc(db, 'playlists', item2.id), { order: tempOrder });
    
    toast({ title: 'Reordered', description: `Moved ${item1.name} ${direction}.` });
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
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(pl.id)} className="hover:bg-red-500/10 text-gray-400 hover:text-red-400">
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
          <p className="text-gray-400 text-sm">Manage multiple M3U/M3U8 sources and organize them into categories.</p>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
          <DialogHeader>
            <DialogTitle>{formData.id ? 'Edit Playlist' : 'Add New Playlist'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter a descriptive name and the M3U/M3U8 URL.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Playlist Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sports Pack"
                className="bg-black border-[#333]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val: any) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger className="bg-black border-[#333]">
                  <SelectValue placeholder="Select Category..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                  <SelectItem value="Main Playlists">Main Playlists</SelectItem>
                  <SelectItem value="Sub Playlists">Sub Playlists</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Playlist URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/playlist.m3u8"
                className="bg-black border-[#333]"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
                {isSaving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {formData.id ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
