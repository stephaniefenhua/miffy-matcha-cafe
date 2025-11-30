import OrderPage from "./OrderPage.jsx";
import AdminPage from "./AdminPage.jsx";
import OrderStatusPage from "./OrderStatusPage.jsx";

function App() {
  const path = window.location.pathname;

  if (path === "/admin") return <AdminPage />;
  if (path === "/status") return <OrderStatusPage />;
  return <OrderPage />;
}

export default App;
