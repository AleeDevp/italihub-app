// /type/city.ts
// Client-facing City shape (JSON-safe):
// Dates are ISO strings; lat/lng are numbers (or null).

export type City = {
  id: number;
  name: string;
  slug: string;

  region: string | null;
  province: string | null;
  provinceCode: string | null;

  lat: number | null; // Decimal(9,6) -> number on client
  lng: number | null; // Decimal(9,6) -> number on client

  altNames: string[];

  isActive: boolean;
  sortOrder: number | null;

  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
};
