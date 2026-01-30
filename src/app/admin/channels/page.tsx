import { ChannelList } from "@/components/admin/channel-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminChannelsPage() {
  return (
    <div className="w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Channel Management</h1>
        <p className="text-gray-400 mt-1">Enable or disable individual channels from the M3U playlist.</p>
      </header>
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white">Channel List</CardTitle>
          <CardDescription>
            Use the toggle to control channel visibility on the main application. Changes are saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <ChannelList />
        </CardContent>
      </Card>
    </div>
  );
}
