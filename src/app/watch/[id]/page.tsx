
import { channels } from '@/lib/data';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type WatchPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WatchPage(props: WatchPageProps) {
  // In Next.js 15, params is a Promise that must be awaited.
  // We avoid destructuring in the function signature to prevent synchronous access warnings.
  const params = await props.params;
  const id = params.id;
  
  const channel = channels.find(c => c.id === id);

  if (!channel) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Channels
          </Link>
        </Button>
      </div>

      <div className="aspect-video w-full rounded-lg overflow-hidden shadow-2xl shadow-black/50 bg-black mb-6">
        <iframe
          src={channel.videoUrl}
          title={channel.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>

      <div>
        <h1 className="font-headline text-4xl font-bold">{channel.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-3xl">{channel.description}</p>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return channels.map((channel) => ({
    id: channel.id,
  }));
}
