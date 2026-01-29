"use client";

import * as React from "react";
import { Grid as FixedSizeGrid } from "react-window";
import { AutoSizer } from "react-virtualized-auto-sizer";
import { cn } from "@/lib/utils";
import { Channel } from "@/hooks/useChannels";

type HomeGridProps = {
  channels: Channel[];
  onChannelSelect: (channel: Channel) => void;
};

const GAP_SIZE = 16; // Corresponds to gap-4 in Tailwind
const CARD_MIN_WIDTH = 200;

export function HomeGrid({ channels, onChannelSelect }: HomeGridProps) {
  const gridRef = React.useRef<FixedSizeGrid>(null);

  React.useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTo({ scrollTop: 0 });
    }
  }, [channels]);

  const Cell = ({
    columnIndex,
    rowIndex,
    style,
    data,
  }: {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
    data: { channels: Channel[]; columnCount: number };
  }) => {
    const index = rowIndex * data.columnCount + columnIndex;
    if (index >= data.channels.length) {
      return null;
    }
    const channel = data.channels[index];

    return (
      <div
        style={{
          ...style,
          left: (style.left as number) + GAP_SIZE / 2,
          top: (style.top as number) + GAP_SIZE / 2,
          width: (style.width as number) - GAP_SIZE,
          height: (style.height as number) - GAP_SIZE,
        }}
      >
        <div
          onClick={() => onChannelSelect(channel)}
          className={cn(
            "group relative h-full w-full cursor-pointer overflow-hidden rounded-md bg-slate-900/50 border border-transparent",
            "transition-all duration-300 ease-in-out hover:z-10 hover:scale-105 hover:shadow-2xl hover:shadow-black/50 hover:ring-2 hover:ring-primary focus:z-10 focus:scale-105 focus:shadow-2xl focus:ring-2 focus:ring-primary"
          )}
        >
          <img
            src={channel.tvg.logo}
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
      </div>
    );
  };

  return (
    <div className="h-full w-full p-2 md:p-4">
      <AutoSizer>
        {({ height, width }) => {
          if (width === 0) return null;
          const columnCount = Math.max(1, Math.floor(width / (CARD_MIN_WIDTH + GAP_SIZE)));
          const columnWidth = width / columnCount;
          const rowCount = Math.ceil(channels.length / columnCount);
          const rowHeight = columnWidth * (9 / 16);

          return (
            <FixedSizeGrid
              ref={gridRef}
              columnCount={columnCount}
              columnWidth={columnWidth}
              rowCount={rowCount}
              rowHeight={rowHeight}
              height={height}
              width={width}
              itemData={{ channels, columnCount }}
              className="!overflow-x-hidden"
            >
              {Cell}
            </FixedSizeGrid>
          );
        }}
      </AutoSizer>
    </div>
  );
}
