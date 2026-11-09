
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FileText,
  CreditCard,
  UserRound,
  Headset,
  Sprout,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    path: "/customer/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Orders",
    path: "/customer/orders",
    icon: ShoppingBag,
  },
  {
    label: "Products",
    path: "/customer/products",
    icon: Package,
  },
  {
    label: "Invoices",
    path: "/customer/invoices",
    icon: FileText,
  },
  {
    label: "Payments",
    path: "/customer/payments",
    icon: CreditCard,
  },
  {
    label: "My Profile",
    path: "/customer/profile",
    icon: UserRound,
  },
];

function CustomerSidebar({ isOpen, onNavigate }) {
  const handleLogout = () => {
    // Connect your existing logout function here.
    console.log("Logout clicked");
  };

  return (
    <aside className={`customer-sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Sprout size={29} />
        </div>

        <div className="brand-info">
          <h2>ARPPB</h2>
          <span>Agri Purchase Portal</span>
        </div>
      </div>

      <div className="sidebar-menu">
        <p className="sidebar-label">MAIN MENU</p>

        <nav>
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onNavigate}

                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={21} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="support-card">
          <Headset size={25} />

          <h4>Need Assistance?</h4>

          <p>Our support team is ready to help you.</p>

          <button type="button">
            Contact Support
          </button>
        </div>

        <button
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default CustomerSidebar;
