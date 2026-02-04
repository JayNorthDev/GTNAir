"use client";

import { useState } from "react";
import { ChannelList } from "@/components/admin/channel-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AdminChannelsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <div className="w-full">
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-white">Channel List</CardTitle>
            <CardDescription>
              Use the toggle to control channel visibility on the main application. Changes are saved automatically.
            </CardDescription>
          </div>
          {isRefreshing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-xs text-purple-300 backdrop-blur-sm animate-pulse shrink-0">
              <Loader2 className="w-3 h-3 animate-spin" />
              Updating playlist...
            </div>
          )}
        </CardHeader>
        <CardContent>
            <ChannelList onRefreshing={setIsRefreshing} />
        </CardContent>
      </Card>
    </div>
  );
}
