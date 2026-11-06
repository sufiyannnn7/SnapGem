export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="font-serif text-8xl font-bold text-primary">404</h1>
      <h2 className="mt-6 font-serif text-2xl font-medium tracking-wide">Page not found</h2>
      <p className="mt-4 max-w-md text-muted-foreground">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <a 
        href="/" 
        className="mt-10 border-b border-primary pb-1 text-sm font-medium uppercase tracking-widest text-primary transition-colors hover:text-primary/70"
      >
        Return to Home
      </a>
    </div>
  );
}