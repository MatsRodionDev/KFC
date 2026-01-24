import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { catalogService } from '../../services/api';
import { Product, ProductCategory } from '../../types';

interface MenuState {
  products: Product[];
  loading: boolean;
  error: string | null;
  selectedCategory: ProductCategory | null;
  searchQuery: string;
}

const initialState: MenuState = {
  products: [],
  loading: false,
  error: null,
  selectedCategory: null,
  searchQuery: '',
};

// Async thunk для загрузки меню
export const fetchMenu = createAsyncThunk(
  'menu/fetchMenu',
  async (_, { rejectWithValue }) => {
    try {
      const menu = await catalogService.getMenu();
      return menu.products;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch menu';
      console.error('Error fetching menu:', error);
      return rejectWithValue(errorMessage);
    }
  }
);

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<ProductCategory | null>) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearSearchQuery: (state) => {
      state.searchQuery = '';
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMenu.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMenu.fulfilled, (state, action: PayloadAction<Product[]>) => {
      state.loading = false;
      state.products = action.payload;
    });
    builder.addCase(fetchMenu.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// Selectors
export const selectAllProducts = (state: { menu: MenuState }) => state.menu.products;
export const selectMenuLoading = (state: { menu: MenuState }) => state.menu.loading;
export const selectMenuError = (state: { menu: MenuState }) => state.menu.error;
export const selectSelectedCategory = (state: { menu: MenuState }) => state.menu.selectedCategory;
export const selectSearchQuery = (state: { menu: MenuState }) => state.menu.searchQuery;

// Мемоизированный селектор для отфильтрованных продуктов
export const selectFilteredProducts = (state: { menu: MenuState }) => {
  const { products, selectedCategory, searchQuery } = state.menu;
  
  return products.filter((product) => {
    const matchesCategory = selectedCategory === null || product.productCategory === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
};

export const { setSelectedCategory, setSearchQuery, clearSearchQuery, clearError } = menuSlice.actions;
export default menuSlice.reducer;



