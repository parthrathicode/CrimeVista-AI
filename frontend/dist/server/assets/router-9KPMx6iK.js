import { t as SelectedDistrictProvider } from "./selected-district-Bs_Yq7D_.js";
import { HeadContent, Outlet, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//#region src/styles.css?url
var styles_default = "/assets/styles-BLJ9eXTZ.css";
//#endregion
//#region src/routes/__root.tsx
function NotFoundComponent() {
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist."
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-xl font-semibold text-foreground",
					children: "Something went wrong"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: error.message
				}),
				/* @__PURE__ */ jsx("button", {
					onClick: () => {
						router.invalidate();
						reset();
					},
					className: "mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
					children: "Try again"
				})
			]
		})
	});
}
var Route$6 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "CrimeVista AI — Karnataka Crime Intelligence Dashboard" },
			{
				name: "description",
				content: "Crime intelligence analytics prototype for Karnataka State Police — hotspot mapping, network analysis, and predictive risk."
			},
			{
				name: "author",
				content: "CrimeVista AI"
			},
			{
				property: "og:title",
				content: "CrimeVista AI"
			},
			{
				property: "og:description",
				content: "Crime intelligence analytics dashboard prototype — KSP Datathon 2026."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "stylesheet",
				href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: ""
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			}
		],
		scripts: [{ children: `
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
        ` }]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "en",
		className: "dark",
		children: [/* @__PURE__ */ jsxs("head", { children: [
			/* @__PURE__ */ jsx(HeadContent, {}),
			/* @__PURE__ */ jsx("script", { dangerouslySetInnerHTML: { __html: `
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
            ` } }),
			/* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: `
          body { top: 0px !important; position: static !important; }
          body > .skiptranslate, iframe.skiptranslate, .goog-te-banner-frame, .VIpgJd-Zvi9od-ORHb-OEVmcd, .VIpgJd-Zvi9od-aZ2wEe-wOHMyf, .goog-te-gadget-icon, #goog-gt-tt { display: none !important; }
          .VIpgJd-Zvi9od-aZ2wEe-wOHMyf-ti6hGc, div[id^="goog-gt-"] { top: auto !important; bottom: 20px !important; left: 20px !important; right: auto !important; z-index: 999999 !important; }
        ` } })
		] }), /* @__PURE__ */ jsxs("body", { children: [children, /* @__PURE__ */ jsx(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$6.useRouteContext();
	return /* @__PURE__ */ jsx(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ jsx(SelectedDistrictProvider, { children: /* @__PURE__ */ jsx(Outlet, {}) })
	});
}
//#endregion
//#region src/routes/risk.tsx
var $$splitComponentImporter$5 = () => import("./risk-BfKyKCKZ.js");
var Route$5 = createFileRoute("/risk")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
//#endregion
//#region src/routes/reports.tsx
var $$splitComponentImporter$4 = () => import("./reports-CTuNVYGS.js");
var Route$4 = createFileRoute("/reports")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
//#endregion
//#region src/routes/network.tsx
var $$splitComponentImporter$3 = () => import("./network-JmQjxJZ0.js");
var Route$3 = createFileRoute("/network")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
//#endregion
//#region src/routes/districts.tsx
var $$splitComponentImporter$2 = () => import("./districts-hViZTvMC.js");
var Route$2 = createFileRoute("/districts")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
//#endregion
//#region src/routes/briefing.tsx
var $$splitComponentImporter$1 = () => import("./briefing-CT-8BihN.js");
var Route$1 = createFileRoute("/briefing")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
//#endregion
//#region src/routes/index.tsx
var $$splitComponentImporter = () => import("./routes-Dmk50Wrf.js");
var Route = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
//#endregion
//#region src/routeTree.gen.ts
var RiskRoute = Route$5.update({
	id: "/risk",
	path: "/risk",
	getParentRoute: () => Route$6
});
var ReportsRoute = Route$4.update({
	id: "/reports",
	path: "/reports",
	getParentRoute: () => Route$6
});
var NetworkRoute = Route$3.update({
	id: "/network",
	path: "/network",
	getParentRoute: () => Route$6
});
var DistrictsRoute = Route$2.update({
	id: "/districts",
	path: "/districts",
	getParentRoute: () => Route$6
});
var BriefingRoute = Route$1.update({
	id: "/briefing",
	path: "/briefing",
	getParentRoute: () => Route$6
});
var rootRouteChildren = {
	IndexRoute: Route.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$6
	}),
	BriefingRoute,
	DistrictsRoute,
	NetworkRoute,
	ReportsRoute,
	RiskRoute
};
var routeTree = Route$6._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
