import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "@remix-run/react";
import { ShoppingBag } from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

interface SidebarNavProps {
  items: NavItem[];
  title?: string;
  subTitle?: string;
  footer?: ReactNode;
  classNames?: {
    nav?: string;
    link?: string;
    activeLink?: string;
    icon?: string;
  };
}

export function SidebarNav({ items, title, subTitle, footer, classNames }: SidebarNavProps) {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Header */}
      {title && (
        <div className="px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gray-800 p-2.5">
              <ShoppingBag className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-white">{title}</h1>
              {subTitle && <p className="text-xs font-medium text-gray-400">{subTitle}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className={classNames?.nav ?? "flex-1 space-y-1 px-3"}>
        {items.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={
                classNames?.link ??
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }`
              }
            >
              <Icon className={classNames?.icon ?? "size-5"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {footer && <div className="border-t border-gray-800 px-3 py-4">{footer}</div>}
    </div>
  );
}
