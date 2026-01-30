import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200 flex">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
