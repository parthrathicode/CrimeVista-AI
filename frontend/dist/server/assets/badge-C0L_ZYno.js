import { s as cn } from "./AppShell-DuzYQILm.js";
import "react";
import { jsx } from "react/jsx-runtime";
import { cva } from "class-variance-authority";
var CRIME_CATEGORIES = Object.keys({
	"Crimes Against Property": [
		"Chain Snatching",
		"House Burglary",
		"Vehicle Theft",
		"Robbery"
	],
	"Crimes Against Body": [
		"Assault",
		"Murder",
		"Grievous Hurt"
	],
	"Crimes Against Women": [
		"Dowry Harassment",
		"Molestation",
		"Domestic Violence"
	],
	"Cyber Crime": [
		"Online Fraud",
		"Phishing",
		"Identity Theft",
		"Sextortion"
	],
	"Crimes Against Public Order": [
		"Rioting",
		"Unlawful Assembly",
		"Public Nuisance"
	]
});
var CATEGORY_COLORS = {
	"Crimes Against Property": "#F59E0B",
	"Crimes Against Body": "#EF4444",
	"Crimes Against Women": "#EC4899",
	"Cyber Crime": "#3B82F6",
	"Crimes Against Public Order": "#10B981"
};
var STATUS_COLORS = {
	"Under Investigation": "#F59E0B",
	"Charge Sheeted": "#3B82F6",
	Closed: "#10B981",
	Undetected: "#6B7280"
};
//#endregion
//#region src/components/ui/badge.tsx
var badgeVariants = cva("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
	variants: { variant: {
		default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
		secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
		destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
		outline: "text-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
//#endregion
export { STATUS_COLORS as i, CATEGORY_COLORS as n, CRIME_CATEGORIES as r, Badge as t };
