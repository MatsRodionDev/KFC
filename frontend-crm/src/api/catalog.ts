export interface ProductListItem {
  id: string
  name: string
  description: string
  price: number | null
  imageName: string | null
  productCategory: string
  userId: string | null
  ingredientsCount: number
}

export interface PagedProductsResponse {
  items: ProductListItem[]
  totalCount: number
}

export interface GetProductsPagedParams {
  page?: number
  pageSize?: number
  name?: string
  description?: string
  productCategory?: string
  userId?: string
}

export interface Ingredient {
  id: string
  name: string
  price: number
  weight: number
  calories: number
  isBase: boolean
  imageName: string | null
  forProductCategory: string | null
  availableForProductCategories: number[]
}

export interface IngredientListItem {
  id: string
  name: string
  price: number
  calories: number
  weight: number
  isBase: boolean
  forProductCategory: string | null
  availableForProductCategories: string[]
  imageName: string | null
}

export interface PagedIngredientsResponse {
  items: IngredientListItem[]
  totalCount: number
}

export interface GetIngredientsPagedParams {
  page?: number
  pageSize?: number
  name?: string
  isBase?: boolean
  forProductCategory?: string
}

export async function getIngredientsPaged(
  params: GetIngredientsPagedParams = {}
): Promise<PagedIngredientsResponse> {
  const search = new URLSearchParams()
  if (params.page != null) search.set('page', String(params.page))
  if (params.pageSize != null) search.set('pageSize', String(params.pageSize))
  if (params.name) search.set('name', params.name)
  if (params.isBase !== undefined && params.isBase !== null)
    search.set('isBase', String(params.isBase))
  if (params.forProductCategory)
    search.set('forProductCategory', params.forProductCategory)

  const url = `/api/ingredients?${search.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Catalog API error: ${res.status}`)
  const data = await res.json()
  return {
    items: (data.items ?? []).map((x: Record<string, unknown>) => ({
      id: x.id,
      name: x.name,
      price: Number(x.price),
      calories: Number(x.calories),
      weight: Number(x.weight),
      isBase: Boolean(x.isBase),
      forProductCategory: x.forProductCategory ?? null,
      availableForProductCategories: Array.isArray(x.availableForProductCategories)
        ? x.availableForProductCategories
        : [],
      imageName: x.imageName ?? null,
    })),
    totalCount: data.totalCount ?? 0,
  }
}

export interface ToppingListItem {
  id: string
  name: string
  price: number
  imageName: string | null
  availableForTypes: string[]
}

export interface PagedToppingsResponse {
  items: ToppingListItem[]
  totalCount: number
}

export interface GetToppingsPagedParams {
  page?: number
  pageSize?: number
  name?: string
  availableForDrinkType?: string
}

export async function getToppingsPaged(
  params: GetToppingsPagedParams = {}
): Promise<PagedToppingsResponse> {
  const search = new URLSearchParams()
  if (params.page != null) search.set('page', String(params.page))
  if (params.pageSize != null) search.set('pageSize', String(params.pageSize))
  if (params.name) search.set('name', params.name)
  if (params.availableForDrinkType)
    search.set('availableForDrinkType', params.availableForDrinkType)

  const res = await fetch(`/api/toppings?${search.toString()}`)
  if (!res.ok) throw new Error(`Catalog API error: ${res.status}`)
  const data = await res.json()
  return {
    items: (data.items ?? []).map((x: Record<string, unknown>) => ({
      id: x.id,
      name: x.name,
      price: Number(x.price),
      imageName: x.imageName ?? null,
      availableForTypes: Array.isArray(x.availableForTypes) ? x.availableForTypes : [],
    })),
    totalCount: data.totalCount ?? 0,
  }
}

export interface DrinkListItem {
  id: string
  name: string
  description: string
  price: number
  type: string
  imageName: string | null
  toppingsCount: number
}

export interface PagedDrinksResponse {
  items: DrinkListItem[]
  totalCount: number
}

export interface GetDrinksPagedParams {
  page?: number
  pageSize?: number
  name?: string
  description?: string
  type?: string
}

export async function getDrinksPaged(
  params: GetDrinksPagedParams = {}
): Promise<PagedDrinksResponse> {
  const search = new URLSearchParams()
  if (params.page != null) search.set('page', String(params.page))
  if (params.pageSize != null) search.set('pageSize', String(params.pageSize))
  if (params.name) search.set('name', params.name)
  if (params.description) search.set('description', params.description)
  if (params.type) search.set('type', params.type)

  const res = await fetch(`/api/drinks?${search.toString()}`)
  if (!res.ok) throw new Error(`Catalog API error: ${res.status}`)
  const data = await res.json()
  return {
    items: (data.items ?? []).map((x: Record<string, unknown>) => ({
      id: x.id,
      name: x.name,
      description: x.description ?? '',
      price: Number(x.price),
      type: x.type ?? '',
      imageName: x.imageName ?? null,
      toppingsCount: Number(x.toppingsCount) || 0,
    })),
    totalCount: data.totalCount ?? 0,
  }
}

/** Создание напитка: Name, Description, Price, DrinkType (Tea|Coffe|HotChocolate|Cocktail), ToppingsIds[] (guid), Image? */
export async function createDrink(formData: FormData): Promise<string> {
  const res = await fetch('/api/drinks', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Catalog API error: ${res.status}`)
  }
  const data = await res.json()
  return typeof data === 'string' ? data : data?.id ?? String(data)
}

/** Создание топинга: Name, Price, AvailableForTypes[] (0=Tea,1=Coffe,2=HotChocolate,3=Cocktail), Image? */
export async function createTopping(formData: FormData): Promise<string> {
  const res = await fetch('/api/toppings', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Catalog API error: ${res.status}`)
  }
  const data = await res.json()
  return typeof data === 'string' ? data : data?.id ?? String(data)
}

export async function getIngredientsByCategory(
  category: string
): Promise<Ingredient[]> {
  const res = await fetch(`/api/ingredients/${encodeURIComponent(category)}`)
  if (!res.ok) throw new Error(`Catalog API error: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

/** Создание обычного ингредиента: Name, Price, Weight, Calories, AvailableForProductCategories[] (0=Pizza,1=Burger,2=Basket), Image? */
export async function createIngredient(formData: FormData): Promise<string> {
  const res = await fetch('/api/ingredients', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Catalog API error: ${res.status}`)
  }
  const data = await res.json()
  return typeof data === 'string' ? data : data?.id ?? String(data)
}

/** Создание базового ингредиента: Name, Price, Weight, Calories, ForProductCategory (0|1|2), Image? */
export async function createBaseIngredient(formData: FormData): Promise<string> {
  const res = await fetch('/api/ingredients/base', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Catalog API error: ${res.status}`)
  }
  const data = await res.json()
  return typeof data === 'string' ? data : data?.id ?? String(data)
}

/** Создание продукта (multipart/form-data по контракту Catalog API) */
export async function addProduct(formData: FormData): Promise<string> {
  const res = await fetch('/api/products', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Catalog API error: ${res.status}`)
  }
  const data = await res.json()
  return typeof data === 'string' ? data : data?.id ?? String(data)
}

export async function getProductsPaged(
  params: GetProductsPagedParams = {}
): Promise<PagedProductsResponse> {
  const search = new URLSearchParams()
  if (params.page != null) search.set('page', String(params.page))
  if (params.pageSize != null) search.set('pageSize', String(params.pageSize))
  if (params.name) search.set('name', params.name)
  if (params.description) search.set('description', params.description)
  if (params.productCategory) search.set('productCategory', params.productCategory)
  if (params.userId) search.set('userId', params.userId)

  const url = `/api/products?${search.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Catalog API error: ${res.status}`)
  const data = await res.json()
  return {
    items: data.items.map((x: Record<string, unknown>) => ({
      id: x.id,
      name: x.name,
      description: x.description,
      price: x.price,
      imageName: x.imageName,
      productCategory: x.productCategory,
      userId: x.userId,
      ingredientsCount: x.ingredientsCount,
    })),
    totalCount: data.totalCount,
  }
}
