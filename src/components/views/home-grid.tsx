"use client";

import { cn } from "@/lib/utils";
import { Channel } from "@/hooks/useChannels";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";

type Ad = {
  type: 'ad';
  id: string;
};

export type GridItem = Channel | Ad;

type HomeGridProps = {
  items: GridItem[];
  onChannelSelect: (channel: Channel) => void;
};

function isChannel(item: GridItem): item is Channel {
    return (item as Channel).url !== undefined;
}

export function HomeGrid({ items, onChannelSelect }: HomeGridProps) {

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item) => {
        if (isChannel(item)) {
          const channel = item;
          return (
            <div
              key={channel.url}
              onClick={() => onChannelSelect(channel)}
              className={cn(
                "group relative aspect-[16/10] cursor-pointer overflow-hidden rounded-md bg-slate-900/50 border border-transparent",
                "transition-all duration-300 ease-in-out hover:z-10 hover:scale-105 hover:shadow-2xl hover:shadow-black/50 hover:ring-2 hover:ring-primary focus:z-10 focus:scale-105 focus:shadow-2xl focus:ring-2 focus:ring-primary"
              )}
            >
              <img
                src={channel.tvg.logo || "https://placehold.co/300x170/020617/334155?text=No+Logo"}
                alt={channel.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain p-4 bg-black/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/300x170/020617/334155?text=No+Logo";
                  (e.target as HTMLImageElement).classList.add("object-scale-down");
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="truncate font-semibold text-white">
                  {channel.name}
                </h3>
                <p className="truncate text-xs text-slate-400">
                  {channel.group.title}
                </p>
              </div>
            </div>
          );
        } else {
          // Render Ad Card
          return (
            <div
              key={item.id}
              className={cn(
                  "relative aspect-[16/10] overflow-hidden rounded-md bg-slate-800/50 border border-dashed border-slate-700 flex flex-col items-center justify-center text-center p-4"
              )}
            >
              <Badge variant="secondary" className="absolute top-2 right-2">Sponsored</Badge>
              <h3 className="font-headline text-base font-bold text-primary">Promote Your Business</h3>
              <p className="mt-1 text-xs text-slate-400">Your ad could be here. Reach thousands of viewers.</p>
              <Button variant="outline" size="sm" className="mt-3">Learn More</Button>
            </div>
          );
        }
      })}
    </div>
  );
}
