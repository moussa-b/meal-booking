'use client';

import { ChevronsUpDown, LogOut, User2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import type { AdminUser } from '@/hooks/use-admin-user';
import { useAdminUserLoaded, useAdminUserSetter } from '@/hooks/use-admin-user';

function getInitials(firstname: string, lastname: string): string {
  const firstInitial = firstname?.trim().charAt(0) ?? '';
  const lastInitial = lastname?.trim().charAt(0) ?? '';
  return (firstInitial + lastInitial).toUpperCase() || '?';
}

interface NavUserProps {
  user: AdminUser | null;
}

export function NavUser({user}: NavUserProps) {
  const {isMobile} = useSidebar();
  const router = useRouter();
  const setAdminUser = useAdminUserSetter();
  const hasLoadedFromStorage = useAdminUserLoaded();

  const handleProfileClick = () => {
    router.push('/admin/profile');
  };

  const handleLogoutClick = async () => {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
      });
    } finally {
      setAdminUser(null);
      router.push('/admin/login');
      router.refresh();
    }
  };

  if (!hasLoadedFromStorage) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="pointer-events-none" asChild>
            <div className="flex w-full items-center gap-2">
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              <Skeleton className="h-4 flex-1 rounded" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={handleLogoutClick}
          >
            <LogOut className="mr-2 h-4 w-4"/>
            <span>Déconnexion</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const fullName = `${user.firstname} ${user.lastname.toUpperCase()}`;
  const initials = getInitials(user.firstname, user.lastname);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{fullName}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4"/>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{fullName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator/>
            <DropdownMenuItem onClick={handleProfileClick}>
              <User2 className="mr-2 h-4 w-4"/>
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogoutClick}>
              <LogOut className="mr-2 h-4 w-4"/>
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
