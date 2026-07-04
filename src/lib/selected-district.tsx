import { createContext, useContext, useState, type ReactNode } from "react";

interface Ctx {
  districtId: string | null;
  setDistrictId: (id: string | null) => void;
}

const SelectedDistrictContext = createContext<Ctx | null>(null);

export function SelectedDistrictProvider({ children }: { children: ReactNode }) {
  const [districtId, setDistrictId] = useState<string | null>(null);
  return (
    <SelectedDistrictContext.Provider value={{ districtId, setDistrictId }}>
      {children}
    </SelectedDistrictContext.Provider>
  );
}

export function useSelectedDistrict() {
  const ctx = useContext(SelectedDistrictContext);
  if (!ctx) throw new Error("useSelectedDistrict must be used within provider");
  return ctx;
}
