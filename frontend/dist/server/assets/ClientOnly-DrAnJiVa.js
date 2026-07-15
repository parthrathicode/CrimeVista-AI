import { useEffect, useState } from "react";
import { Fragment, jsx } from "react/jsx-runtime";
//#region src/components/ClientOnly.tsx
/** Renders children only after client-side mount. */
function ClientOnly({ children, fallback = null }) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!mounted) return /* @__PURE__ */ jsx(Fragment, { children: fallback });
	return /* @__PURE__ */ jsx(Fragment, { children });
}
//#endregion
export { ClientOnly as t };
