import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_NAV, PURCHASER_NAV, SALESMAN_NAV } from '../../constants';
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, ClipboardList,
  FileText, Truck, BarChart3, Users, Activity, KeyRound, Plus, MapPin,
  LogOut, ChevronLeft, ChevronRight, Settings, X
} from 'lucide-react';
import { useState } from 'react';

const ICON_MAP = {
  LayoutDashboard, Package, Warehouse, ShoppingCart, ClipboardList,
  FileText, Truck, BarChart3, Users, Activity, KeyRound, Plus, MapPin, Settings,
};

const NAV_BY_ROLE = { admin: ADMIN_NAV, purchaser: PURCHASER_NAV, salesman: SALESMAN_NAV };

const ROLE_LABELS = {
  admin: { label: 'Administrator', color: 'text-red-400' },
  purchaser: { label: 'Purchaser', color: 'text-blue-400' },
  salesman: { label: 'Salesman', color: 'text-green-400' },
};

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[user?.role] || [];
  const roleInfo = ROLE_LABELS[user?.role] || {};

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          bg-gradient-to-b from-dark-900 via-dark-800 to-dark-700
          border-r border-primary-900/40
          flex flex-col transition-all duration-300 ease-in-out shadow-2xl
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Area */}
        <div className={`flex items-center gap-3 p-4 border-b border-primary-900/30 min-h-[72px] ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-700/30 border border-primary-600/40 flex items-center justify-center overflow-hidden">
            <img
              src="/logo.png"
              alt="Vardhman Family"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="text-primary-400 font-bold text-lg">V</span>';
              }}
            />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-heading font-bold text-sm leading-tight truncate">Vardhman Family</p>
              <p className="text-primary-400 text-[10px] truncate">ERP Management System</p>
            </div>
          )}
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="mx-3 mt-3 p-3 rounded-xl bg-primary-900/20 border border-primary-800/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                <p className={`text-xs font-medium ${roleInfo.color}`}>{roleInfo.label}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || Package;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-primary-600 text-white shadow-green-glow'
                    : 'text-gray-400 hover:bg-primary-900/30 hover:text-primary-300'
                  }
                  ${collapsed ? 'justify-center px-2' : ''}`
                }
                title={collapsed ? item.label : ''}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t border-primary-900/30 space-y-0.5">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Logout' : ''}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all ${collapsed ? 'justify-center' : ''}`}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
