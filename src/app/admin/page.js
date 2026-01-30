"use client";
import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function AdminPlaylistPage() {
  const [url, setUrl] = useState('');
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const DB_SETTINGS_COLLECTION = "settings";
  const DB_PLAYLIST_DOCUMENT = "playlist";

  useEffect(() => {
    async function fetchCurrentUrl() {
      try {
        const docRef = doc(db, DB_SETTINGS_COLLECTION, DB_PLAYLIST_DOCUMENT);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().url) {
          setUrl(docSnap.data().url);
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load current URL.' });
      } finally {
        setIsFetching(false);
      }
    }
    fetchCurrentUrl();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    setIsSaving(true);

    try {
      if (!url.trim()) {
        throw new Error("Please enter a valid URL.");
      }

      await setDoc(doc(db, DB_SETTINGS_COLLECTION, DB_PLAYLIST_DOCUMENT), {
        url: url.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessage({ type: 'success', text: 'Playlist URL updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save URL.' });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">M3U Playlist Settings</h1>
        <p className="text-gray-400 mt-1">Manage the primary M3U playlist URL for the application.</p>
      </header>

      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white">Playlist URL</CardTitle>
          <CardDescription>
            Enter the direct link to your .m3u or .m3u8 file. This will update the player for all users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <div className="flex items-center justify-center h-40">
                <Loader className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="playlist-url" className="text-gray-400">M3U Playlist URL</Label>
                <Input
                  id="playlist-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/playlist.m3u"
                  className="w-full bg-[#0a0a0a] text-white p-4 rounded-xl border border-[#333] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder-gray-600"
                  disabled={isSaving}
                />
              </div>

              {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 'bg-red-900/20 text-red-400 border border-red-900/50'}`}>
                  {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                  <span>{message.text}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full max-w-xs py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                    <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Saving...
                    </>
                ) : (
                  <>
                    <Save size={20} /> Save Playlist
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
