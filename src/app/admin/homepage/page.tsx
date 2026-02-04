import { HomepageEditor } from "@/components/admin/homepage-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminHomepage() {
  return (
    <div className="w-full">
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white">Content Sections</CardTitle>
          <CardDescription>
            Add, edit, or delete items from the Hero Carousel and Services sections.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <HomepageEditor />
        </CardContent>
      </Card>
    </div>
  );
}
