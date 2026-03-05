'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  School,
  Utensils,
  ChefHat,
  ShoppingCart,
  Users,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AdminUserProvider, useAdminUser } from '@/hooks/use-admin-user';
import { NavUser } from './nav-user';

const menuItems = [
    {
      title: 'Tableau de bord',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      title: 'Établissement scolaire',
      href: '/admin/schools',
      icon: School,
    },
    {
      title: 'Repas',
      href: '/admin/meals',
      icon: Utensils,
    },
    {
      title: 'Menus',
      href: '/admin/menus',
      icon: ChefHat,
    },
    {
      title: 'Commandes',
      href: '/admin/orders',
      icon: ShoppingCart,
    },
    {
      title: 'Élèves enregistrés',
      href: '/admin/students',
      icon: Users,
    },
];

export default function AdminLayout({children,}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AdminUserProvider>
      <AdminLayoutInner pathname={pathname}>
        {children}
      </AdminLayoutInner>
    </AdminUserProvider>
  );
}

function AdminLayoutInner({pathname, children,}: {
  pathname: string;
  children: React.ReactNode;
}) {
  const adminUser = useAdminUser();

  const currentPage = menuItems.find((item) => item.href === pathname);
  const pageTitle = currentPage?.title || 'Administration';
  const PageIcon = currentPage?.icon;

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <h2 className="text-lg font-semibold">Administration</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={adminUser} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          {PageIcon && <PageIcon className="h-5 w-5" />}
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
