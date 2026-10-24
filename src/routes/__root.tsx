import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { LibraryProvider } from "@/lib/library-store";
import { AppShell } from "@/components/app-shell";
import { PwaRuntime } from "@/components/pwa-runtime";
import appCss from "../styles.css?url";

const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const THEME_BOOT = `(function(){try{var t=localStorage.getItem("stewards-path-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark";}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Steward's Path" },
      {
        name: "description",
        content:
          "Field skills for reserves and Raven Flock. Trails, water, fences, solar, and one clear offer. Kept on your phone.",
      },
      { name: "theme-color", content: "#111613" },
      { name: "apple-mobile-web-app-title", content: "Steward's Path" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: asset("/favicon.svg") },
      { rel: "icon", type: "image/png", sizes: "192x192", href: asset("/icon-192.png") },
      { rel: "apple-touch-icon", href: asset("/icon-180.png") },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: asset("/manifest.webmanifest") },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,600;6..72,700&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <PreviewHostBridge />
        <AuthProvider>
          <LibraryProvider>
            <PwaRuntime />
            <AppShell>
              <Outlet />
            </AppShell>
          </LibraryProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
