"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SiOpenai } from "react-icons/si";
import { HiOutlinePencilAlt, HiDotsHorizontal } from "react-icons/hi";
import { TbFolderPlus } from "react-icons/tb";
import { LuLayoutGrid, LuImages } from "react-icons/lu";
import { 
  FaDollarSign, 
  FaGraduationCap, 
  FaPen, 
  FaHeartbeat,
  FaEdit
} from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { MdDeleteOutline } from "react-icons/md";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useClerk } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { fetchWithRetry, getErrorMessage } from "@/lib/network-utils";

const mainItems = [
  {
    title: "New chat",
    url: "#",
    icon: HiOutlinePencilAlt,
  },
  {
    title: "Search chats",
    url: "#",
    icon: IoSearch,
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

// Chat items will be loaded dynamically from localStorage
interface ChatItem {
  id: string;
  title: string;
  timestamp: number;
  preview: string;
}

const AppSidebar = () => {
  const { state } = useSidebar();
  const { signOut } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [projects, setProjects] = useState<Array<{id: string, name: string, category: string}>>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{id: string, name: string} | null>(null);
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  const categories = [
    { name: 'Investing', icon: FaDollarSign, color: 'bg-green-500' },
    { name: 'Homework', icon: FaGraduationCap, color: 'bg-blue-500' },
    { name: 'Writing', icon: FaPen, color: 'bg-purple-500' },
    { name: 'Health', icon: FaHeartbeat, color: 'bg-red-500' }
  ];

  // Load chat items from MongoDB
  const loadChatItems = useCallback(async () => {
    if (!isClient) return;
    
    try {
      const response = await fetchWithRetry('/api/chats?userId=user_123', {}, {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 3000
      }); // TODO: Get from Clerk auth
      
      const chats = await response.json();
      const chatItems: ChatItem[] = chats.map((chat: { chatId: string; title: string; updatedAt: string; messages: { content: string }[] }) => ({
        id: chat.chatId,
        title: chat.title || 'New chat',
        timestamp: new Date(chat.updatedAt).getTime(),
        preview: chat.messages && chat.messages.length > 0 
          ? chat.messages[chat.messages.length - 1].content.substring(0, 50) + (chat.messages[chat.messages.length - 1].content.length > 50 ? '...' : '')
          : ''
      }));
      setChatItems(chatItems);
    } catch (error) {
      console.error('Error loading chat items:', error);
      toast.error(getErrorMessage(error));
    }
  }, [isClient]);

  // Set client state and load chats on mount
  useEffect(() => {
    setIsClient(true);
    loadChatItems();
  }, [isClient, loadChatItems]);

  useEffect(() => {
    if (isClient) {
      // Listen for custom chatSaved event to update chat list when new chats are created
      const handleChatSaved = () => {
        loadChatItems();
      };
      
      // Listen for custom chatDeleted event to update chat list when chats are deleted
      const handleChatDeleted = (event: CustomEvent) => {
        const { chatId } = event.detail;
        // Remove the chat from local state immediately
        setChatItems(prev => prev.filter(chat => chat.id !== chatId));
        // Also reload from server to ensure consistency
        loadChatItems();
      };
      
      if (typeof window !== 'undefined') {
        window.addEventListener('chatSaved', handleChatSaved);
        window.addEventListener('chatDeleted', handleChatDeleted as EventListener);
        
        return () => {
          window.removeEventListener('chatSaved', handleChatSaved);
          window.removeEventListener('chatDeleted', handleChatDeleted as EventListener);
        };
      }
    }
  }, [isClient, loadChatItems]);

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

  const handleChatClick = (chatId: string) => {
    // Navigate to chat page with the specific chat ID
    router.push(`/chat?chatId=${chatId}`);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await fetchWithRetry(`/api/chats?chatId=${chatId}`, {
        method: 'DELETE',
      }, {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 3000
      });
      
      // Remove the chat from local state immediately
      setChatItems(prev => prev.filter(chat => chat.id !== chatId));
      
      // If the deleted chat is currently active, clear the main content
      const currentChatId = new URLSearchParams(window.location.search).get('chatId');
      if (currentChatId === chatId) {
        // Dispatch event to clear main chat content
        window.dispatchEvent(new CustomEvent('clearChatContent'));
        // Navigate to new chat
        router.push('/chat?new=true');
      }
      
      // Also reload from server to ensure consistency
      await loadChatItems();
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error(getErrorMessage(error));
    }
  };


  const handleCreateProject = () => {
    if (projectName.trim() && selectedCategory) {
      const newProject = {
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: projectName.trim(),
        category: selectedCategory
      };
      
      setProjects(prev => [...prev, newProject]);
      setProjectName('');
      setSelectedCategory('');
      setIsNewProjectModalOpen(false);
      toast.success(`Project "${projectName.trim()}" created successfully!`);
    }
  };

  const handleCancelProject = () => {
    setProjectName('');
    setSelectedCategory('');
    setIsNewProjectModalOpen(false);
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    setProjectToDelete({ id: projectId, name: projectName });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      setProjects(prev => prev.filter(project => project.id !== projectToDelete.id));
      toast.success(`Project "${projectToDelete.name}" deleted successfully`);
      setProjectToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setProjectToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleRenameProject = (projectId: string, currentName: string) => {
    setEditingProjectId(projectId);
    setEditingProjectName(currentName);
    setIsRenameModalOpen(true);
  };

  const handleSaveRename = () => {
    if (editingProjectId && editingProjectName.trim()) {
      const project = projects.find(p => p.id === editingProjectId);
      const oldName = project?.name || '';
      const newName = editingProjectName.trim();
      
      setProjects(prev => prev.map(project => 
        project.id === editingProjectId 
          ? { ...project, name: newName }
          : project
      ));
      setEditingProjectId(null);
      setEditingProjectName('');
      setIsRenameModalOpen(false);
      toast.success(`Project "${oldName}" renamed to "${newName}"`);
    }
  };

  const handleCancelRename = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
    setIsRenameModalOpen(false);
  };
  
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-2 w-full group">
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
            <SidebarMenu className="flex flex-col gap-3">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.title === "New project" ? (
                    <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
                      <DialogTrigger asChild>
                        <SidebarMenuButton 
                          size="sm" 
                          className="px-2 py-4 h-8 cursor-pointer hover:py-4 hover:bg-gray-200 transition-all duration-200"
                        >
                          <item.icon className="w-5 h-5" />
                          <span className={`text-base transition-all duration-200 ${state === "expanded" ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`} style={{ fontSize: '16px' }}>{item.title}</span>
                        </SidebarMenuButton>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] flex flex-col gap-6 p-6" suppressHydrationWarning>
                        <div className="flex flex-col gap-2">
                          <DialogTitle>Create New Project</DialogTitle>
                          <DialogDescription>
                            Organize your work and collaborate with your team
                          </DialogDescription>
                        </div>
                        <div className="flex flex-col gap-6">
                          <div className="flex flex-col gap-3">
                            <Label htmlFor="project-name">Project Name</Label>
                            <Input
                              id="project-name"
                              value={projectName}
                              onChange={(e) => setProjectName(e.target.value)}
                              placeholder="Enter project name"
                              className="w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-3">
                            <Label>Category</Label>
                            <div className="flex flex-wrap gap-2">
                              {categories.map((category) => (
                                <div
                                  key={category.name}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer transition-all ${
                                    selectedCategory === category.name 
                                      ? 'bg-gray-200 border-2 border-gray-400' 
                                      : 'bg-gray-100 hover:bg-gray-150'
                                  }`}
                                  onClick={() => setSelectedCategory(category.name)}
                                >
                                  <div className={`w-5 h-5 rounded-full ${category.color} flex items-center justify-center text-white`}>
                                    <category.icon className="w-3 h-3" />
                                  </div>
                                  <span className="text-base text-black" style={{ fontSize: '16px' }}>{category.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={handleCancelProject}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleCreateProject}
                            disabled={!projectName.trim() || !selectedCategory}
                          >
                            Create Project
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <SidebarMenuButton 
                      size="sm" 
                      className="px-2 py-4 h-8 cursor-pointer hover:py-4 hover:bg-gray-200 transition-all duration-200"
                      onClick={item.title === "New chat" ? handleNewChat : undefined}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-base" style={{ fontSize: '16px' }}>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-base text-muted-foreground px-2 py-2" style={{ fontSize: '16px' }}>Projects</SidebarGroupLabel>
          <SidebarGroupContent className="pt-2">
            <SidebarMenu className="flex flex-col gap-3">
              {projects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <div className="group relative px-2 py-4 h-8 hover:bg-gray-200 transition-all duration-200 flex items-center justify-between cursor-pointer">
                    <Link href="#" className="flex-1">
                      <span className={`text-base transition-all duration-200 ${state === "expanded" ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`} style={{ fontSize: '16px' }}>{project.name}</span>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer ${state === "expanded" ? "" : "hidden"}`}>
                          <HiDotsHorizontal className="w-4 h-4 text-gray-600" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="bottom" sideOffset={5}>
                        <DropdownMenuItem onClick={() => handleRenameProject(project.id, project.name)}>
                          <FaEdit className="w-5 h-5 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="text-red-600 hover:text-red-600 focus:text-red-600"
                        >
                          <MdDeleteOutline className="w-5 h-5 mr-2 text-red-600" />
                          <span className="text-red-600">Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-base text-muted-foreground px-2 py-2" style={{ fontSize: '16px' }}>Chats</SidebarGroupLabel>
          <SidebarGroupContent className="pt-2">
            <SidebarMenu className="flex flex-col gap-3">
              {chatItems.map((chat) => {
                const currentChatId = searchParams.get('chatId');
                const isActive = currentChatId === chat.id;
                
                return (
                  <SidebarMenuItem key={chat.id}>
                    <div className={`group relative px-2 py-5 h-8 transition-all duration-200 flex items-center justify-between cursor-pointer ${
                      isActive && state === "expanded"
                        ? 'bg-gray-200 rounded-md' 
                        : 'hover:bg-gray-200'
                    }`} style={isActive && state === "expanded" ? { backgroundColor: '#e5e7eb', borderRadius: '6px' } : {}}>
                      <div 
                        className="flex-1 cursor-pointer" 
                        onClick={() => handleChatClick(chat.id)}
                      >
                        <div className={`text-base font-medium transition-all duration-200 ${state === "expanded" ? "opacity-100" : "opacity-0 w-0 overflow-hidden"} ${
                          isActive && state === "expanded" ? 'text-gray-900' : ''
                        }`} style={isActive && state === "expanded" ? { color: '#111827', fontSize: '16px' } : { fontSize: '16px' }}>
                          {chat.title}
                        </div>
                      </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer ${state === "expanded" ? "" : "hidden"}`}>
                          <HiDotsHorizontal className="w-4 h-4 text-gray-600" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="bottom" sideOffset={5}>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteChat(chat.id)}
                          className="text-red-600 hover:text-red-600 focus:text-red-600"
                        >
                          <MdDeleteOutline className="w-5 h-5 mr-2 text-red-600" />
                          <span className="text-red-600">Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {/* Rename Project Modal */}
      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent className="sm:max-w-[425px] flex flex-col gap-6 p-6" suppressHydrationWarning>
          <div className="flex flex-col gap-2">
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new name for your project
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="rename-project">Project Name</Label>
            <Input
              id="rename-project"
              value={editingProjectName}
              onChange={(e) => setEditingProjectName(e.target.value)}
              placeholder="Enter project name"
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename();
                if (e.key === 'Escape') handleCancelRename();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelRename}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveRename}
              disabled={!editingProjectName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Project Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]" suppressHydrationWarning>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{projectToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton 
                  className={`px-2 py-4 hover:py-4 hover:bg-gray-200 transition-all duration-200 ${state === "collapsed" ? "w-10 justify-center" : ""}`}
                  suppressHydrationWarning
                >
                  <div className={`w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs ${state === "collapsed" ? "mx-auto" : ""}`} style={{minWidth: '24px', minHeight: '24px', aspectRatio: '1/1'}}>
                    M
                  </div>
                  <div className={`transition-all duration-200 flex items-center ${state === "expanded" ? "opacity-100 ml-2" : "opacity-0 ml-0 w-0 overflow-hidden"}`}>
                    <span className="text-base" style={{ fontSize: '16px' }}>Maulik Tanna</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" suppressHydrationWarning>
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
