import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { MainLayout } from './layouts/MainLayout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import TripDetail from './pages/TripDetail';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import Confirmation from './pages/Confirmation';
import MyTrips from './pages/MyTrips';
import BookingDetail from './pages/BookingDetail';
import Profile from './pages/Profile';
import Login from './pages/login';
import Register from './pages/register';
import NotFound from './components/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <QueryProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/trips/:id" element={<TripDetail />} />
            <Route path="/booking/:id" element={<Booking />} />
            <Route path="/payment/:bookingId" element={<Payment />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/my-trips" element={<MyTrips />} />
            <Route path="/my-trips/:bookingId" element={<BookingDetail />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </QueryProvider>
    </BrowserRouter>
  );
}
