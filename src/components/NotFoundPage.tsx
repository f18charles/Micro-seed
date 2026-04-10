import { Button } from "./ui/button";
import { FileQuestion } from "lucide-react";

interface NotFoundPageProps {
  onGoHome: () => void;
}

export default function NotFoundPage({ onGoHome }: NotFoundPageProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-neutral-100 p-6 rounded-full mb-6">
        <FileQuestion className="h-16 w-16 text-neutral-400" />
      </div>
      <h1 className="text-6xl font-black text-neutral-900 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-neutral-800 mb-4">Page not found</h2>
      <p className="text-neutral-500 max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved. 
        Please check the URL or return to the homepage.
      </p>
      <Button size="lg" onClick={onGoHome} className="px-8">
        Go Home
      </Button>
    </div>
  );
}
