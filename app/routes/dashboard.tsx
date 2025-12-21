import { redirect } from 'react-router';
import { Home, Settings, LogOut } from 'lucide-react';
import { callTrpc } from '~/utils/trpc.server';
import { useAuth } from '~/utils/auth';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '~/components/ui/sidebar';
import type { Route } from './+types/dashboard';

export async function loader({ request }: Route.LoaderArgs) {
  const caller = await callTrpc(request);
  const { isSignedIn, user } = await caller.auth.me();

  if (!isSignedIn) {
    return redirect('/login');
  }

  return { user };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { signOut } = useAuth();
  const user = loaderData.user;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <span className="text-sm font-medium">pre.dev</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton isActive>
                <Home className="size-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings className="size-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => signOut()}>
                <LogOut className="size-4" />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-6">
          <SidebarTrigger />
          <h1 className="text-sm font-medium">Dashboard</h1>
        </header>

        <main className="p-6">
          <p className="text-muted-foreground text-sm">
            Welcome back, {user?.email}
          </p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
