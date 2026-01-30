import { HomepageEditor } from "@/components/admin/homepage-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminHomepage() {
  return (
    <div className="w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Homepage Content</h1>
        <p className="text-gray-400 mt-1">Manage the content displayed on the main homepage.</p>
      </header>
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
