import { createContext, useContext, useState } from "react";
import { jsx } from "react/jsx-runtime";
//#region src/lib/selected-district.tsx
var SelectedDistrictContext = createContext(null);
function SelectedDistrictProvider({ children }) {
	const [districtId, setDistrictId] = useState(null);
	return /* @__PURE__ */ jsx(SelectedDistrictContext.Provider, {
		value: {
			districtId,
			setDistrictId
		},
		children
	});
}
function useSelectedDistrict() {
	const ctx = useContext(SelectedDistrictContext);
	if (!ctx) throw new Error("useSelectedDistrict must be used within provider");
	return ctx;
}
//#endregion
export { useSelectedDistrict as n, SelectedDistrictProvider as t };
