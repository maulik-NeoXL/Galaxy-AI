"use client";

import {
  Search,
} from "lucide-react";
import Link from "next/link";
import { SiOpenai } from "react-icons/si";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { TbFolderPlus } from "react-icons/tb";
import { LuLayoutGrid, LuImages } from "react-icons/lu";
import { 
  FaDollarSign, 
  FaGraduationCap, 
  FaPen, 
  FaHeartbeat
} from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import { MdDeleteOutline } from "react-icons/md";
import { Pencil } from "lucide-react";
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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

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
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [projects, setProjects] = useState<Array<{id: string, name: string, category: string}>>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{id: string, name: string} | null>(null);

  const categories = [
    { name: 'Investing', icon: FaDollarSign, color: 'bg-green-500' },
    { name: 'Homework', icon: FaGraduationCap, color: 'bg-blue-500' },
    { name: 'Writing', icon: FaPen, color: 'bg-purple-500' },
    { name: 'Health', icon: FaHeartbeat, color: 'bg-red-500' }
  ];

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


  const handleCreateProject = () => {
    if (projectName.trim() && selectedCategory) {
      const newProject = {
        id: Date.now().toString(),
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
            <SidebarMenu className="space-y-0.5">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.title === "New project" ? (
                    <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
                      <DialogTrigger asChild>
                        <SidebarMenuButton 
                          size="sm" 
                          className="px-2 py-4 h-8 cursor-pointer hover:py-4 hover:bg-gray-200 transition-all duration-200"
                        >
                          <item.icon className="w-8 h-8" />
                          <span className={`text-sm transition-all duration-200 ${state === "expanded" ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>{item.title}</span>
                        </SidebarMenuButton>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] flex flex-col gap-6 p-6">
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
                                  <div className={`w-6 h-6 rounded-full ${category.color} flex items-center justify-center text-white`}>
                                    <category.icon className="w-3 h-3" />
                                  </div>
                                  <span className="text-sm text-black">{category.name}</span>
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
                      <item.icon className="w-8 h-8" />
                      <span className="text-sm">{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-sm text-muted-foreground px-2 py-2">Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {projects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <div className="group relative px-2 py-4 h-8 hover:bg-gray-200 transition-all duration-200 flex items-center justify-between cursor-pointer">
                    <Link href="#" className="flex-1">
                      <span className={`text-sm transition-all duration-200 ${state === "expanded" ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>{project.name}</span>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer">
                          <HiDotsHorizontal className="w-4 h-4 text-gray-600" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="bottom" sideOffset={5}>
                        <DropdownMenuItem onClick={() => handleRenameProject(project.id, project.name)}>
                          <Pencil className="w-8 h-8 mr-2" strokeWidth={2} />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="text-red-600 hover:text-red-600 focus:text-red-600"
                        >
                          <MdDeleteOutline className="w-8 h-8 mr-2 text-red-600" />
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
          <SidebarGroupLabel className="text-sm text-muted-foreground px-2 py-2">Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {chatItems.map((chat, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild size="sm" className={`px-2 py-4 h-8 hover:py-4 hover:bg-gray-200 transition-all duration-200 ${index === 0 ? "bg-sidebar-accent" : ""}`}>
                    <Link href="#">
                      <span className={`text-sm transition-all duration-200 ${state === "expanded" ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>{chat}</span>
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
      
      {/* Rename Project Modal */}
      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent className="sm:max-w-[425px] flex flex-col gap-6 p-6">
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
        <DialogContent className="sm:max-w-[425px]">
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
