import { ChannelList } from "@/components/admin/channel-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminChannelsPage() {
  return (
    <div className="w-full">
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
