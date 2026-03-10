import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MenuPage } from './pages/MenuPage/index';
import { ProductPage } from './pages/ProductPage/index';
import { CartPage } from './pages/CartPage/index';
import { CheckoutPage } from './pages/CheckoutPage/index';
import { OrderCheckoutPage } from './pages/OrderCheckoutPage/index';
import { OrderPage } from './pages/OrderPage/index';
import { CustomProductBuilder } from './pages/CustomProductBuilder/index';
import { ProfilePage } from './pages/ProfilePage/index';
import { LoginPage, ProtectedRoute } from './components/auth';
import { useAuth } from './hooks/useAuth';
import './styles/global.css';

/** Ленивая загрузка: запрос заказов по userId выполняется только на странице «История», не при открытии меню. */
const HistoryPage = lazy(() => import('./pages/HistoryPage/index').then((m) => ({ default: m.HistoryPage })));

const AppLayout = () => {
  const location = useLocation();
  const hideFooter = location.pathname.startsWith('/order-checkout');

  return (
    <div className="app">
      <Header />
      <main style={{ flex: '1 0 auto' }}>
        <Suspense fallback={<div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>}>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-checkout/:orderId" element={<OrderCheckoutPage />} />
            <Route path="/order/:id" element={<OrderPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/custom-product" element={<CustomProductBuilder />} />
          </Routes>
        </Suspense>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

function App() {
  useAuth();

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/login" 
            element={<LoginPage />} 
          />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;

