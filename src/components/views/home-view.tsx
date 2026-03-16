
"use client";
import React, { useMemo, useState, useEffect } from 'react';
import { Channel } from '@/hooks/useChannels';
import { HomeGrid } from './home-grid';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from '@/lib/supabase';
import { Skeleton } from '../ui/skeleton';
import { MessageCircle, Phone, Smartphone } from 'lucide-react';

interface HomeViewProps {
  channels: Channel[];
  onChannelSelect: (channel: Channel) => void;
  loadMore?: () => void;
  hasMore?: boolean;
}

export function HomeView({ channels, onChannelSelect, loadMore, hasMore }: HomeViewProps) {
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeContactNumber, setActiveContactNumber] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: heroData, error: heroError } = await supabase.from('hero_slides').select('id, data');
      if (heroError) throw heroError;
      setHeroSlides(heroData?.map(row => ({ id: row.id, ...row.data })) || []);

      const { data: serviceData, error: serviceError } = await supabase.from('services').select('id, data');
      if (serviceError) throw serviceError;
      setServices(serviceData?.map(row => ({ id: row.id, ...row.data })) || []);

    } catch (error: any) {
      console.error("Supabase sync error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const heroChannel = supabase.channel('hero_slides_public')
        .on('postgres_changes', { event: '*', table: 'hero_slides' }, () => fetchData())
        .subscribe();
    
    const serviceChannel = supabase.channel('services_public')
        .on('postgres_changes', { event: '*', table: 'services' }, () => fetchData())
        .subscribe();

    return () => {
        supabase.removeChannel(heroChannel);
        supabase.removeChannel(serviceChannel);
    };
  }, []);

  const itemsWithAds = useMemo(() => {
    const items: any[] = [];
    let channelCount = 0;
    for (const channel of channels) {
      items.push(channel);
      channelCount++;
      if (channelCount > 0 && channelCount % 15 === 0) {
        items.push({ type: 'ad', id: `ad-${channelCount}` });
      }
    }
    return items;
  }, [channels]);

  // Updated stopOnInteraction to false to ensure autoplay resumes after interaction
  const autoplay = useMemo(() => Autoplay({ delay: 5000, stopOnInteraction: false }), []);

  const handleContactAction = (platform: 'whatsapp' | 'viber') => {
    if (!activeContactNumber) return;
    const cleanNumber = activeContactNumber.replace(/\D/g, '');
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    } else {
      window.location.href = `viber://chat?number=${cleanNumber}`;
    }
    setActiveContactNumber(null);
  };

  return (
    <div className="w-full">
      {loading && heroSlides.length === 0 ? (
         <Skeleton className="w-full h-[60vh] min-h-[450px] max-h-[550px] -mt-4 md:-mt-8" />
      ) : heroSlides.length > 0 && (
        <Carousel
          plugins={[autoplay]}
          opts={{ loop: true }}
          className="w-full relative -mt-4 md:-mt-8"
        >
          <CarouselContent>
            {heroSlides.map((slide, index) => (
              <CarouselItem key={slide.id}>
                <div className="w-full h-[60vh] min-h-[450px] max-h-[550px] relative text-white flex items-center">
                  {slide.mediaUrl && (
                    slide.mediaType === 'video' ? (
                      <video 
                        src={slide.mediaUrl} 
                        className="absolute inset-0 w-full h-full object-cover" 
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                      />
                    ) : (
                      <img
                        src={slide.mediaUrl}
                        alt={slide.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    )
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                  <div className="relative z-10 p-4 md:p-8 max-w-2xl">
                    <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                        {slide.title}
                    </h1>
                    <p className="mt-4 text-lg md:text-xl text-foreground/80 max-w-prose">
                        {slide.subtitle}
                    </p>
                    <Button 
                      size="lg" 
                      className="mt-8 font-bold shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => setActiveContactNumber(slide.contactNumber)}
                    >
                        {slide.cta}
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
        </Carousel>
      )}

      <div className="p-4 md:p-8 my-8">
        <h2 className="font-headline text-2xl md:text-3xl font-bold tracking-tight mb-4">Boost Your Business with Our Media Services</h2>
        {loading && services.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="w-full aspect-video" />)}
          </div>
        ) : services.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <Card 
                key={service.id} 
                className="group overflow-hidden bg-card/80 hover:bg-card transition-all cursor-pointer border border-transparent hover:border-primary/20 hover:shadow-xl hover:-translate-y-1"
                onClick={() => setActiveContactNumber(service.contactNumber)}
              >
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-black/20">
                    {service.mediaUrl && (
                      service.mediaType === 'video' ? (
                        <video 
                          src={service.mediaUrl} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                          muted 
                          loop 
                        />
                      ) : (
                        <img
                          src={service.mediaUrl}
                          alt={service.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      )
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-headline text-xl font-bold">{service.title}</h3>
                    <p className="mt-1 text-muted-foreground">{service.description}</p>
                    <div className="mt-4 inline-flex items-center text-primary font-bold gap-2">
                       {service.cta || 'Contact Us'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h2 className="font-headline text-2xl md:text-3xl font-bold tracking-tight">Live Channels</h2>
          <p className="text-muted-foreground mt-2 text-lg max-w-4xl">
            Experience the world in high definition with 5,000+ premium global channels.
          </p>
        </div>
        <HomeGrid 
          items={itemsWithAds} 
          onChannelSelect={onChannelSelect} 
          loadMore={loadMore} 
          hasMore={hasMore} 
        />
      </div>

      <Dialog open={!!activeContactNumber} onOpenChange={() => setActiveContactNumber(null)}>
        <DialogContent className="sm:max-w-[400px] bg-[#0a0a0a] border-[#222] text-white">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">Contact Support</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center space-y-6">
            <p className="text-gray-400">Which app would you like to use to contact us?</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleContactAction('whatsapp')}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 transition-all group"
              >
                <div className="p-3 rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/20 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <span className="font-bold text-[#25D366]">WhatsApp</span>
              </button>
              <button
                onClick={() => handleContactAction('viber')}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-[#7360f2]/10 hover:bg-[#7360f2]/20 border border-[#7360f2]/20 transition-all group"
              >
                <div className="p-3 rounded-full bg-[#7360f2] text-white shadow-lg shadow-[#7360f2]/20 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-8 h-8" />
                </div>
                <span className="font-bold text-[#7360f2]">Viber</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
