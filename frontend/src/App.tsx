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
import { HistoryPage } from './pages/HistoryPage/index';
import { CustomProductBuilder } from './pages/CustomProductBuilder/index';
import './styles/global.css';

const AppLayout = () => {
  const location = useLocation();
  const hideFooter = location.pathname.startsWith('/order-checkout');

  return (
    <div className="app">
      <Header />
      <main style={{ flex: '1 0 auto' }}>
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-checkout/:orderId" element={<OrderCheckoutPage />} />
          <Route path="/order/:id" element={<OrderPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/custom-product" element={<CustomProductBuilder />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </Provider>
  );
}

export default App;

