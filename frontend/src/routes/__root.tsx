import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { SelectedDistrictProvider } from "@/lib/selected-district";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CrimeVista AI — Karnataka Crime Intelligence Dashboard" },
      {
        name: "description",
        content:
          "Crime intelligence analytics prototype for Karnataka State Police — hotspot mapping, network analysis, and predictive risk.",
      },
      { name: "author", content: "CrimeVista AI" },
      { property: "og:title", content: "CrimeVista AI" },
      {
        property: "og:description",
        content: "Crime intelligence analytics dashboard prototype — KSP Datathon 2026.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
    scripts: [
      {
        children: `
          if (typeof Node === 'function' && Node.prototype) {
            const originalRemoveChild = Node.prototype.removeChild;
            Node.prototype.removeChild = function(child) {
              if (child.parentNode !== this) {
                if (console) console.error('React DOM crash prevented: removeChild mismatch (likely Google Translate).', child, this);
                return child;
              }
              return originalRemoveChild.apply(this, arguments);
            };
            
            const originalInsertBefore = Node.prototype.insertBefore;
            Node.prototype.insertBefore = function(newNode, referenceNode) {
              if (referenceNode && referenceNode.parentNode !== this) {
                if (console) console.error('React DOM crash prevented: insertBefore mismatch (likely Google Translate).', referenceNode, this);
                return newNode;
              }
              return originalInsertBefore.apply(this, arguments);
            };
          }
        `,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.remove('light');
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          body { top: 0px !important; position: static !important; }
          body > .skiptranslate, iframe.skiptranslate, .goog-te-banner-frame, .VIpgJd-Zvi9od-ORHb-OEVmcd, .VIpgJd-Zvi9od-aZ2wEe-wOHMyf, .goog-te-gadget-icon, #goog-gt-tt { display: none !important; }
          .VIpgJd-Zvi9od-aZ2wEe-wOHMyf-ti6hGc, div[id^="goog-gt-"] { top: auto !important; bottom: 20px !important; left: 20px !important; right: auto !important; z-index: 999999 !important; }
        `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <SelectedDistrictProvider>
        <Outlet />
      </SelectedDistrictProvider>
    </QueryClientProvider>
  );
}
