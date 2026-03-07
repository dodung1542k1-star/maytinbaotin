import { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "../assets/styles/main.css"
export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="d-flex">
      <Sidebar collapsed={collapsed} />

      <div className="flex-grow-1">
        <Header onToggle={() => setCollapsed(!collapsed)} />
        <main className="p-3">{children}</main>
      </div>
    </div>
  );
}
