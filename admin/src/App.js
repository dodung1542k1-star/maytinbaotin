import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminRoutes from "./routes/AdminRoutes";
import Login from "./pages/Loginpage/Login"; // Nhớ import trang Login

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang Login để bên ngoài để ai cũng vào được */}
        <Route path="/login" element={<Login />} />
        {/* Các route Admin */}
        <Route path="/*" element={<AdminRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;