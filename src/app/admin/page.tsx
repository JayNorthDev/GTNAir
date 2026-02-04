
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, addDoc, updateDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Globe, CheckCircle, AlertCircle, Loader, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface Playlist {
  id: string;
  name: string;
  url: string;
  updatedAt: string;
}

export default function AdminPlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({ id: '', name: '', url: '' });

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'playlists'), orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Playlist));
      
      // If no playlists exist, try to migrate the old "General" playlist from settings
      if (data.length === 0) {
        const settingsRef = doc(db, 'settings', 'playlist');
        const settingsSnap = await (await import('firebase/firestore')).getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data().url) {
          const newPlaylist = {
            name: 'General',
            url: settingsSnap.data().url,
            updatedAt: new Date().toISOString()
          };
          const docRef = await addDoc(collection(db, 'playlists'), newPlaylist);
          setPlaylists([{ id: docRef.id, ...newPlaylist }]);
        }
      } else {
        setPlaylists(data);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load playlists.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleOpenDialog = (playlist?: Playlist) => {
    if (playlist) {
      setFormData({ id: playlist.id, name: playlist.name, url: playlist.url });
    } else {
      setFormData({ id: '', name: '', url: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) return;

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        url: formData.url.trim(),
        updatedAt: new Date().toISOString()
      };

      if (formData.id) {
        await updateDoc(doc(db, 'playlists', formData.id), payload);
        toast({ title: 'Success', description: 'Playlist updated successfully.' });
      } else {
        await addDoc(collection(db, 'playlists'), payload);
        toast({ title: 'Success', description: 'Playlist added successfully.' });
      }
      setIsDialogOpen(false);
      fetchPlaylists();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save playlist.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await deleteDoc(doc(db, 'playlists', id));
      toast({ title: 'Deleted', description: 'Playlist removed.' });
      fetchPlaylists();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete playlist.' });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Playlist Settings</h2>
          <p className="text-gray-400 text-sm">Manage multiple M3U/M3U8 sources for your player.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" /> Add New Playlist
        </Button>
      </div>

      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <Table>
              <TableHeader className="border-b border-[#333]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">URL</TableHead>
                  <TableHead className="text-gray-400 w-[150px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playlists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12 text-gray-500">
                      No playlists added yet. Click "+ Add New Playlist" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  playlists.map((pl) => (
                    <TableRow key={pl.id} className="border-b border-[#333]/50 hover:bg-[#222]">
                      <TableCell className="font-medium text-white">{pl.name}</TableCell>
                      <TableCell className="text-gray-400 font-mono text-xs max-w-md truncate">
                        {pl.url}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
          )}
        </CardContent>
      </Card>

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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Playlist URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/playlist.m3u8"
                className="bg-black border-[#333]"
                required
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
