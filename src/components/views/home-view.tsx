"use client";
import React, { useMemo } from 'react';
import { Channel } from '@/hooks/useChannels';
import { HomeGrid } from './home-grid';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Autoplay from "embla-carousel-autoplay"

// Define service and ad types
type Service = {
  id: string;
  title: string;
  description: string;
  imageId: string;
};

type Ad = {
  type: 'ad';
  id: string;
};

export type GridItem = Channel | Ad;

const services: Service[] = [
  { id: 'video-prod', title: 'Video Production', description: 'High-quality video content to tell your story.', imageId: 'video-production' },
  { id: 'graphic-design', title: 'Graphic Design', description: 'Stunning visuals that define your brand.', imageId: 'graphic-design' },
  { id: 'social-media', title: 'Social Media Mgmt', description: 'Engage your audience and grow your reach.', imageId: 'social-media' },
];

const heroSlides = [
    {
        id: 'hero-video',
        title: 'Professional Video Editing',
        subtitle: 'From raw footage to cinematic masterpiece. We bring your vision to life.',
        imageId: 'video-editing',
        cta: 'Get a Quote'
    },
    {
        id: 'hero-social',
        title: 'Social Media Marketing',
        subtitle: 'Amplify your brand\'s voice across all major platforms.',
        imageId: 'social-media',
        cta: 'Contact Us on WhatsApp'
    },
    {
        id: 'hero-design',
        title: 'Creative Freelance Design',
        subtitle: 'Unique logos, branding, and graphics that make an impact.',
        imageId: 'graphic-design',
        cta: 'View Portfolio'
    }
];

export function HomeView({ channels, onChannelSelect }: { channels: Channel[], onChannelSelect: (channel: Channel) => void }) {
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

  const autoplayRef = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  return (
    <div className="w-full">
      {/* Hero Carousel */}
      <Carousel
        plugins={[autoplayRef.current]}
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

      {/* Service Catalog Section */}
      <div className="p-4 md:p-8 my-8">
        <h2 className="font-headline text-2xl md:text-3xl font-bold tracking-tight mb-4">Boost Your Business with Our Media Services</h2>
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
      </div>
      
      {/* Channel Grid */}
      <div className="p-4 md:p-8">
        <h2 className="font-headline text-2xl md:text-3xl font-bold tracking-tight mb-4">Live Channels</h2>
        <HomeGrid items={itemsWithAds} onChannelSelect={onChannelSelect} />
      </div>
    </div>
  );
}
