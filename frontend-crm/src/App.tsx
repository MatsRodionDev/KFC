import OrdersPage from './pages/OrdersPage'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Header } from './components/Header'
import { LoginPage, ProtectedRoute } from './components/auth'
import DishesPage from './pages/DishesPage'
import IngredientsPage from './pages/IngredientsPage'
import ToppingsPage from './pages/ToppingsPage'
import DrinksPage from './pages/DrinksPage'
import './App.css'

const AppLayout = () => (
  <div className="app">
    <Header />
    <main>
      <Routes>
        <Route path="/" element={<Navigate to="/orders" replace />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/dishes" element={<DishesPage />} />
        <Route path="/ingredients" element={<IngredientsPage />} />
        <Route path="/toppings" element={<ToppingsPage />} />
        <Route path="/drinks" element={<DrinksPage />} />
      </Routes>
    </main>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
  )
}

export default App
