export interface ProductResource {
  id: string
  name: string
  slug: string
  price: number
  categories: Array<{ id: string; name: string; slug: string }>
  created_at: Date
  updated_at: Date
}
