"use client";

import {
  Search,
} from "lucide-react";
import { SiOpenai } from "react-icons/si";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { TbFolderPlus } from "react-icons/tb";
import { LuLayoutGrid, LuImages } from "react-icons/lu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

const mainItems = [
  {
    title: "New chat",
    url: "#",
    icon: HiOutlinePencilAlt,
  },
  {
    title: "Search chats",
    url: "#",
    icon: Search,
  },
  {
    title: "New project",
    url: "#",
    icon: TbFolderPlus,
  },
  {
    title: "Library",
    url: "#",
    icon: LuImages,
  },
  {
    title: "GPTs",
    url: "#",
    icon: LuLayoutGrid,
  },
];

// Chat items will be loaded dynamically from memory
const chatItems: string[] = [];

const AppSidebar = () => {
  const { state, toggleSidebar } = useSidebar();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNewChat = () => {
    // Navigate to chat page with a query parameter to indicate new chat
    router.push('/chat?new=true');
  };
  
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className={`flex items-center justify-between px-2 py-2 w-full group ${
              state === "collapsed" ? "cursor-pointer" : ""
            }`} onClick={state === "collapsed" ? toggleSidebar : undefined}>
              <div className="flex items-center">
                <div className="relative w-5 h-5">
                  <SiOpenai className={`w-5 h-5 transition-opacity ${
                    state === "collapsed" 
                      ? "opacity-100 group-hover:opacity-0" 
                      : "opacity-100"
                  }`} />
                  <SidebarTrigger className={`absolute inset-0 w-5 h-5 transition-opacity ${
                    state === "collapsed" 
                      ? "opacity-0 group-hover:opacity-100" 
                      : "opacity-0"
                  }`} />
                </div>
              </div>
              <SidebarTrigger className={`px-1 py-1 transition-opacity ${
                state === "expanded" ? "opacity-100" : "opacity-0"
              }`} />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-2">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    size="sm" 
                    className="px-2 py-4 h-8 cursor-pointer hover:py-4 hover:bg-gray-200 transition-all duration-200"
                    onClick={item.title === "New chat" ? handleNewChat : undefined}
                  >
                    <item.icon className="w-8 h-8" />
                    <span className="text-sm">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-sm text-muted-foreground px-2 py-2">Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {chatItems.map((chat, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild size="sm" className={`px-2 py-4 h-8 hover:py-4 hover:bg-gray-200 transition-all duration-200 ${index === 0 ? "bg-sidebar-accent" : ""}`}>
                    <Link href="#">
                      <span className="text-sm">{chat}</span>
                    </Link>
                  </SidebarMenuButton>
                  {index === 1 && (
                    <SidebarMenuBadge className="bg-blue-500">•</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className={`px-2 py-4 hover:py-4 hover:bg-gray-200 transition-all duration-200 ${state === "collapsed" ? "w-10 justify-center" : ""}`}>
                  <div className={`w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs ${state === "collapsed" ? "mx-auto" : ""}`} style={{minWidth: '24px', minHeight: '24px', aspectRatio: '1/1'}}>
                    M
                  </div>
                  <div className={`transition-all duration-200 flex items-center ${state === "expanded" ? "opacity-100 ml-2" : "opacity-0 ml-0 w-0 overflow-hidden"}`}>
                    <span className="text-sm">Maulik Tanna</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Account</DropdownMenuItem>
                <DropdownMenuItem>Setting</DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
