
"use client";
import React, { useMemo, useState, useEffect } from 'react';
import { Channel } from '@/hooks/useChannels';
import { HomeGrid } from './home-grid';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Autoplay from "embla-carousel-autoplay"
import { supabase } from '@/lib/supabase';
import { Skeleton } from '../ui/skeleton';

type Ad = {
  type: 'ad';
  id: string;
};

export type GridItem = Channel | Ad;

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
    const items: GridItem[] = [];
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

  const autoplay = useMemo(() => Autoplay({ delay: 5000, stopOnInteraction: true }), []);

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
            {heroSlides.map((slide, index) => {
              const image = PlaceHolderImages.find(p => p.id === slide.imageId);
              return (
                <CarouselItem key={slide.id}>
                  <div className="w-full h-[60vh] min-h-[450px] max-h-[550px] relative text-white flex items-center">
                    {image && (
                      <Image
                        src={image.imageUrl}
                        alt={slide.title}
                        fill
                        priority={index === 0}
                        className="object-cover"
                        data-ai-hint={image.imageHint}
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                    <div className="relative z-10 p-4 md:p-8 max-w-2xl">
                      <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-shadow-lg">
                          {slide.title}
                      </h1>
                      <p className="mt-4 text-lg md:text-xl text-foreground/80 max-w-prose text-shadow">
                          {slide.subtitle}
                      </p>
                      <Button size="lg" className="mt-8 font-bold shadow-lg">
                          {slide.cta}
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              )
            })}
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
            {services.map(service => {
              const image = PlaceHolderImages.find(p => p.id === service.imageId);
              return (
                <Card key={service.id} className="group overflow-hidden bg-card/80 hover:bg-card transition-all cursor-pointer border border-transparent hover:border-primary/20 hover:shadow-xl hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className="relative aspect-video">
                      {image && (
                        <Image
                          src={image.imageUrl}
                          alt={service.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          data-ai-hint={image.imageHint}
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-headline text-xl font-bold">{service.title}</h3>
                      <p className="mt-1 text-muted-foreground">{service.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h2 className="font-headline text-2xl md:text-3xl font-bold tracking-tight">Live Channels</h2>
          <p className="text-muted-foreground mt-2 text-lg max-w-4xl">
            Experience the world in high definition with 5,000+ premium global channels—more variety, better stability, and a faster streaming experience than any other app.
          </p>
        </div>
        <HomeGrid 
          items={itemsWithAds} 
          onChannelSelect={onChannelSelect} 
          loadMore={loadMore} 
          hasMore={hasMore} 
        />
      </div>
    </div>
  );
}
