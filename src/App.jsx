import OrderPage from "./OrderPage.jsx";
import AdminPage from "./AdminPage.jsx";

function App() {
  const path = window.location.pathname;

  if (path === "/admin") return <AdminPage />;
  return <OrderPage />;
}

export default App;
