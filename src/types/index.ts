// Product type definition
export interface Brand {
  id: number;
  name: string;
  created_at?: string;
}

export interface ProductType {
  id: number;
  name: string;
  created_at?: string;
}

export interface Product {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  descuento: number;
  imagenes: string[];
  brand_id?: number | null;
  type_id?: number | null;
  brands?: Brand | null;
  product_types?: ProductType | null;
  created_at?: string;
  updated_at?: string;
}

export type ConvenioBannerMode = 'placeholder' | 'imagen';

export interface Convenio {
  id: number;
  nombre: string;
  descuento: number;
  logo_url?: string | null;
  link_url: string;
  banner_grande_url?: string | null;
  banner_chico_url?: string | null;
  banner_modo: ConvenioBannerMode;
  orden?: number | null;
  created_at?: string;
  updated_at?: string;
}

// Create/Update product payload
export interface ProductPayload {
  nombre: string;
  descripcion: string;
  precio: number;
  descuento: number;
  imagenes?: string[];
  brand_id?: number | null;
  type_id?: number | null;
}

export interface ConvenioPayload {
  nombre: string;
  descuento: number;
  logo_url?: string | null;
  link_url: string;
  banner_grande_url?: string | null;
  banner_chico_url?: string | null;
  banner_modo: ConvenioBannerMode;
}

// Filter options for product listing
export interface ProductFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  hasDiscount?: boolean;
  brandIds?: number[];
  typeIds?: number[];
}

// Auth session
export interface AuthSession {
  isAuthenticated: boolean;
  adminId?: string;
}
