
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Loader, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HeroForm } from './homepage/hero-form';
import { ServiceForm } from './homepage/service-form';
import Image from 'next/image';
import { placeholderImagesList } from '@/lib/placeholder-images';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function HomepageEditor() {
    const [heroSlides, setHeroSlides] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isHeroDialogOpen, setIsHeroDialogOpen] = useState(false);
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
    const [editingHero, setEditingHero] = useState<any | null>(null);
    const [editingService, setEditingService] = useState<any | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: heroData, error: heroError } = await supabase.from('hero_slides').select('*');
            if (heroError) throw heroError;
            setHeroSlides(heroData || []);

            const { data: serviceData, error: serviceError } = await supabase.from('services').select('*');
            if (serviceError) throw serviceError;
            setServices(serviceData || []);

            setError(null);
        } catch (err: any) {
            console.error(err);
            setError("Failed to load content.");
            const permissionError = new FirestorePermissionError({
                path: 'hero_slides/services',
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Real-time subscriptions
        const heroChannel = supabase.channel('hero_slides_changes')
            .on('postgres_changes', { event: '*', table: 'hero_slides' }, () => fetchData())
            .subscribe();

        const serviceChannel = supabase.channel('services_changes')
            .on('postgres_changes', { event: '*', table: 'services' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(heroChannel);
            supabase.removeChannel(serviceChannel);
        };
    }, []);

    const handleDelete = async (table: string, id: string) => {
        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
        } catch (err: any) {
            console.error('Delete error:', err);
            const permissionError = new FirestorePermissionError({
                path: `${table}/${id}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    };

    const handleOpenHeroDialog = (slide: any | null = null) => {
        setEditingHero(slide);
        setIsHeroDialogOpen(true);
    }
    
    const handleOpenServiceDialog = (service: any | null = null) => {
        setEditingService(service);
        setIsServiceDialogOpen(true);
    }

    const getImage = (imageId: string) => {
        return placeholderImagesList.find(img => img.id === imageId);
    }

    if (loading && heroSlides.length === 0 && services.length === 0) {
        return <div className="flex items-center justify-center p-8"><Loader className="animate-spin" /></div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-red-400 bg-red-900/20 rounded-lg">
                <AlertCircle className="w-10 h-10 mb-4" />
                <h3 className="text-xl font-semibold">Error Loading Content</h3>
                <p className="mt-2 text-center">{error}</p>
            </div>
        );
    }
    
    return (
        <Tabs defaultValue="hero">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="hero">Hero Banners</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>

            <TabsContent value="hero" className="mt-4">
                <div className="flex justify-end mb-4">
                    <Dialog open={isHeroDialogOpen} onOpenChange={setIsHeroDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenHeroDialog()}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Hero Slide
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border-[#333] text-white">
                            <DialogHeader>
                                <DialogTitle>{editingHero ? 'Edit' : 'Add'} Hero Slide</DialogTitle>
                            </DialogHeader>
                            <HeroForm 
                                onSuccess={() => setIsHeroDialogOpen(false)} 
                                initialData={editingHero} 
                            />
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="space-y-4">
                    {heroSlides.map((slide) => {
                         const image = getImage(slide.imageId);
                        return (
                        <Card key={slide.id} className="bg-[#0f0f0f] border-[#333] flex items-center justify-between p-4">
                            <div className="flex items-center gap-4 overflow-hidden">
                                {image ? 
                                    <Image src={image.imageUrl} alt={slide.title} width={80} height={45} className="rounded-md object-cover aspect-video" />
                                    : <div className="w-20 h-[45px] flex items-center justify-center bg-card rounded-md shrink-0"><ImageIcon className="w-5 h-5 text-muted-foreground" /></div>
                                }
                                <div className='overflow-hidden'>
                                    <p className="font-medium text-white truncate">{slide.title}</p>
                                    <p className="text-sm text-gray-400 truncate">{slide.subtitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenHeroDialog(slide)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-[#1a1a1a] border-[#333] text-white">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-gray-400">
                                                This action cannot be undone. This will permanently delete this hero slide.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete('hero_slides', slide.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </Card>
                    )})}
                </div>
            </TabsContent>

            <TabsContent value="services" className="mt-4">
                 <div className="flex justify-end mb-4">
                    <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenServiceDialog()}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border-[#333] text-white">
                            <DialogHeader>
                                <DialogTitle>{editingService ? 'Edit' : 'Add'} Service</DialogTitle>
                            </DialogHeader>
                            <ServiceForm
                                onSuccess={() => setIsServiceDialogOpen(false)} 
                                initialData={editingService} 
                            />
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="space-y-4">
                    {services.map((service) => {
                         const image = getImage(service.imageId);
                        return (
                        <Card key={service.id} className="bg-[#0f0f0f] border-[#333] flex items-center justify-between p-4">
                             <div className="flex items-center gap-4 overflow-hidden">
                                {image ? 
                                    <Image src={image.imageUrl} alt={service.title} width={80} height={45} className="rounded-md object-cover aspect-video" />
                                    : <div className="w-20 h-[45px] flex items-center justify-center bg-card rounded-md shrink-0"><ImageIcon className="w-5 h-5 text-muted-foreground" /></div>
                                }
                                <div className='overflow-hidden'>
                                    <p className="font-medium text-white truncate">{service.title}</p>
                                    <p className="text-sm text-gray-400 truncate">{service.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenServiceDialog(service)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-[#1a1a1a] border-[#333] text-white">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-gray-400">
                                                This action cannot be undone. This will permanently delete this service.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete('services', service.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </Card>
                    )})}
                </div>
            </TabsContent>
        </Tabs>
    );
}
