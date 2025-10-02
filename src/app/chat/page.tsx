"use client";

import { ChevronDown, Plus, Copy, ThumbsUp, ThumbsDown, Share, Paperclip, Telescope, Image, Lightbulb, BookOpen, Pencil, Check, X, Square } from "lucide-react";
import { MdDelete } from "react-icons/md";
import { CiMicrophoneOn } from "react-icons/ci";
import { RiVoiceprintFill } from "react-icons/ri";
import { BsArrowUpCircleFill } from "react-icons/bs";
import { SiOpenai, SiX } from "react-icons/si";
import { RiGeminiFill } from "react-icons/ri";
import { FaQuoteRight } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Textarea } from "@/components/ui/textarea";
import { estimateTokens, getModelLimit } from '@/lib/context-manager';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CodeBlock from "@/components/CodeBlock";
import { toast } from "sonner";
import { fetchWithRetry, fetchSilent, getErrorMessage } from "@/lib/network-utils";
import ImageWithProgress from "@/components/ImageWithProgress";
// import uploadcare from 'uploadcare-widget'; // Commented out - not currently using

const ChatPage = () => {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, files?: Array<{
    name: string;
    type: string;
    size: number;
    url: string;
    publicId: string;
  }>}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Array<{
    name: string;
    type: string;
    size: number;
    url: string;
    publicId: string;
  }>>([]);
  const [selectedModel, setSelectedModel] = useState('GPT-3.5 Turbo');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatId, setChatId] = useState<string>('');
  const [currentChatTitle, setCurrentChatTitle] = useState<string>('New chat');
  const [displayedTitle, setDisplayedTitle] = useState<string>('New chat');
  const [isTypingTitle, setIsTypingTitle] = useState(false);
  const [titleGenerated, setTitleGenerated] = useState(false);
  const [selectedText, setSelectedText] = useState<{text: string, messageId: string, position: {x: number, y: number}} | null>(null);
  const [suggestion, setSuggestion] = useState<{text: string, visible: boolean} | null>(null);
  const [floatingInput, setFloatingInput] = useState<{text: string, visible: boolean} | null>(null);
  // Removed userId as it's not needed for localStorage
  const [isClient, setIsClient] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // NEW: Context management state (only initialize on client)
  const [contextUsage, setContextUsage] = useState<{
    tokens: number;
    limit: number;
    percentage: number;
    needsOptimization: boolean;
  }>({
    tokens: 0,
    limit: 4096, // Default GPT-3.5 Turbo limit
    percentage: 0,
    needsOptimization: false
  });

  // NEW: Update context usage calculation
  function updateContextUsage(messagesToCheck: Array<{role: string; content: string}>, model: string) {
    const tokens = estimateTokens(messagesToCheck.map(msg => ({
      role: msg.role,
      content: msg.content
    })));
    const limit = getModelLimit(model);
    const percentage = Math.round((tokens / limit) * 100);
    const needsOptimization = tokens > limit * 0.85;
    
    setContextUsage({
      tokens,
      limit,
      percentage,
      needsOptimization
    });
  }

  const models = [
    { name: 'GPT-3.5 Turbo', logo: SiOpenai },
    { name: 'GPT-4', logo: SiOpenai },
    { name: 'GPT-4 Turbo', logo: SiOpenai },
    { name: 'GPT-4o', logo: SiOpenai },
    { name: 'GPT-4o Mini', logo: SiOpenai },
    { name: 'Gemini Pro', logo: RiGeminiFill },
    { name: 'Gemini Pro Vision', logo: RiGeminiFill },
    { name: 'Gemini 1.5 Pro', logo: RiGeminiFill },
    { name: 'Gemini 1.5 Flash', logo: RiGeminiFill },
    { name: 'Grok-1', logo: SiX },
    { name: 'Grok-2', logo: SiX }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle text selection and Ask ChatGPT button
  const handleTextSelection = (messageId: string, event: React.MouseEvent) => {
    // Prevent default selection behavior
    event.preventDefault();
    
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      console.log('Selection:', selection?.toString());
      if (selection && selection.toString().trim()) {
        const selectedText = selection.toString().trim();
        console.log('Selected text:', selectedText);
        if (selectedText.length > 0) {
          const rect = selection.getRangeAt(0).getBoundingClientRect();
          console.log('Selection rect:', rect);
          setSelectedText({
            text: selectedText,
            messageId: messageId,
            position: {
              x: rect.left + rect.width / 2,
              y: rect.top - 50 // Position higher above the selection
            }
          });
          // Clear the selection to remove cursor
          selection.removeAllRanges();
        }
      }
    }, 10);
  };

  // Handle double-click detection for "Recursion" text
  const handleDoubleClick = (messageId: string, event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const text = target.textContent || '';
    
    // Check if the double-clicked text contains "Recursion"
    if (text.toLowerCase().includes('recursion')) {
      setSuggestion({
        text: 'Click',
        visible: true
      });
    }
  };

  const handleAskChatGPT = () => {
    if (selectedText) {
      // Show floating input with quoted text
      setFloatingInput({
        text: `"${selectedText.text}"`,
        visible: true
      });
      setSelectedText(null);
    }
  };


  const handleCloseSuggestion = () => {
    setSuggestion(null);
  };

  const handleFloatingInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!floatingInput?.text.trim()) return;

    const userMessage = { 
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
      role: 'user' as const, 
      content: floatingInput.text.trim(),
      files: [] 
    };
    setMessages(prev => [...prev, userMessage]);
    setFloatingInput(null);
    setIsLoading(true);

    try {
              // Load memory context for AI BEFORE processing
              console.log('About to load memory context for floating input');
              
              // Force load memory context synchronously
              const memoryContext = await Promise.allSettled([
                fetch('/api/mem0', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'load',
                    filters: { user_id: user?.id || 'anonymous' }
                  }),
                }),
                fetch('/api/simple-memory', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'load',
                    userId: user?.id || 'anonymous',
                  }),
                })
              ]).then(async ([mem0Resp, simpleResp]) => {
                // Try Simple Memory first as it's faster for cross-chat
                if (simpleResp.status === 'fulfilled') {
                  const simpleResult = await simpleResp.value.json();
                  if (simpleResult.data && simpleResult.data.length > 0) {
                    console.log('✅ Using Simple Memory context:', simpleResult.data.length, 'memories');
                    return simpleResult.data.map((item: any) => ({ memory: item.memory }));
                  }
                }
                
                // Fallback to Mem0
                if (mem0Resp.status === 'fulfilled') {
                  const mem0Result = await mem0Resp.value.json();
                  if (mem0Result.data && mem0Result.data.length > 0) {
                    console.log('✅ Using Mem0 context:', mem0Result.data.length, 'memories');
                    return mem0Result.data || [];
                  }
                }
                
                return [];
              });
              
              // Prepare messages with context
              const contextMessages = memoryContext.length > 0
                ? [
                    { role: 'system', content: `Previous conversation context:\n${memoryContext.map((m: {memory?: string, role?: string, content?: string}) => m.memory || `${m.role}: ${m.content}`).join('\n')}` },
                    ...messages,
                    userMessage
                  ]
                : [...messages, userMessage];
      
      console.log('Floating input context messages:', contextMessages);

      const response = await fetchWithRetry('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: contextMessages,
          model: selectedModel 
        }),
      }, {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 8000
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const assistantMessage = { id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, role: 'assistant' as const, content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        assistantMessage.content += chunk;
        setMessages(prev => {
          const updatedMessages = prev.map(msg => 
          msg.id === assistantMessage.id ? { ...msg, content: assistantMessage.content } : msg
          );
          return updatedMessages;
        });
      }
      
                // Save completed conversation to MongoDB and memory
                console.log('🔍 isClient value:', isClient, 'typeof isClient:', typeof isClient);
                if (isClient) {
                  const finalMessages = [...messages, userMessage, assistantMessage];
                  console.log('🚀 Calling saveChatToMongoDB from handleFloatingInput - finalMessages:', finalMessages.length, 'isClient:', isClient);
                  saveChatToMongoDB(finalMessages, false);

                  // Save to memory asynchronously without blocking UI  
                  const memoryUserMessage = { ...userMessage, files: undefined };
                  const memoryAssistantMessage = { ...assistantMessage, files: undefined };
                  
                  // Don't await - let it save in background
                  saveToMemory([memoryUserMessage, memoryAssistantMessage]).catch(err => 
                    console.log('Memory save completed in background')
                  );
                }
    } catch (error) {
      console.error('Error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseFloatingInput = () => {
    setFloatingInput(null);
  };

  // Close selection on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking on the Ask ChatGPT button
      const target = event.target as HTMLElement;
      if (target && target.closest('[data-ask-chatgpt-button]')) {
        return;
      }
      setSelectedText(null);
    };
    
    if (selectedText) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [selectedText]);

  // Typing effect for chat title
  const typeTitle = (title: string) => {
    console.log('Starting typing effect for title:', title);
    setIsTypingTitle(true);
    setDisplayedTitle(''); // Start with empty title
    
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < title.length) {
        const partialTitle = title.slice(0, currentIndex + 1);
        console.log('Typing character:', partialTitle);
        setDisplayedTitle(partialTitle);
        currentIndex++;
      } else {
        console.log('Typing effect completed');
        clearInterval(typingInterval);
        setIsTypingTitle(false);
      }
    }, 80); // 80ms delay between characters for faster typing
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Set client flag on mount and initialize UploadCare
  useEffect(() => {
    setMounted(true);
    setIsClient(true);
    // Initialize context usage on mount
    updateContextUsage(messages, selectedModel);
    
    // UploadCare initialization removed - using native file input instead
  }, []);

  // Update document title and URL based on chat title
  useEffect(() => {
    if (mounted && isClient && chatId) { // Add mounted check to prevent hydration mismatch
      if (displayedTitle && displayedTitle !== 'GPT-3.5 Turbo' && displayedTitle !== 'New chat') {
        // Update document title to include chat title
        document.title = `${displayedTitle} - AI Chat`;
        
        // Update URL to include chat title in path
        const chatTitlePath = displayedTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .substring(0, 50); // Limit length
        
        const newPath = `/chat/${chatTitlePath}-${chatId.substring(5)}`; // Remove 'chat_' prefix
        
        // Only update URL if we're not already on the correct friendly URL
        const currentPath = window.location.pathname;
        if (chatId.startsWith('chat_') && currentPath !== newPath) {
          window.history.replaceState({}, '', newPath);
        }
      } else {
        // Fallback to proper AI Chat title  
        document.title = "AI Chat";
        // Also ensure we're on a clean /chat URL for basic chats
        if (window.location.pathname !== '/chat') {
          window.history.replaceState({}, '', '/chat');
        }
      }
    }
  }, [displayedTitle, chatId, isClient, mounted]); // Add mounted dependency

  // Redirect to sign-up if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-up');
    }
  }, [isLoaded, isSignedIn, router]);

  // Handle URL parameters and friendly URLs
  useEffect(() => {
    if (!mounted || !isClient) return; // Only run on client side
    
    const urlChatId = searchParams.get('chatId');
    const isNewChat = searchParams.get('new') === 'true';
    const currentPath = window.location.pathname;
    
    // Check if we're on a friendly URL like /chat/chat-title-abc123
    let extractedChatId = null;
    if (currentPath.startsWith('/chat/') && !currentPath.includes('?')) {
      const pathParts = currentPath.split('/');
      if (pathParts.length >= 3) {
        const lastPart = pathParts[2];
        // Extract chatId from format: title-abc123
        const chatIdMatch = lastPart.match(/-([a-z0-9]{8,})$/);
        if (chatIdMatch) {
          extractedChatId = `chat_${chatIdMatch[1]}`;
        }
      }
    }
    
    if (isNewChat) {
      handleNewChat();
      // Remove the query parameter from URL
      window.history.replaceState({}, '', '/chat');
      return;
    }
    
    if (urlChatId) {
      // Load existing chat from URL parameter
      console.log('Loading chat from URL parameter:', urlChatId);
      setChatId(urlChatId);
      return;
    }
    
    if (extractedChatId) {
      // Load chat from friendly URL
      console.log('Loading chat from friendly URL:', extractedChatId);
      setChatId(extractedChatId);
      return;
    }
    
    // Only create new chat if no URL parameters or friendly URL
    setChatId(prevChatId => {
      if (!prevChatId) {
        console.log('No chatId found, creating new chat');
        return `chat_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      }
      return prevChatId;
    });
  }, [searchParams, isClient]);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    if (isClient && chatId) {
      loadChatHistory();
    }
  }, [isClient, chatId]);

  // Listen for clearChatContent event from sidebar
  // NEW: Update context usage when messages or model changes
  useEffect(() => {
    if (mounted) {
      updateContextUsage(messages, selectedModel);
    }
  }, [messages, selectedModel, mounted]);

  useEffect(() => {
    const handleClearChatContent = () => {
      setMessages([]);
      setInput('');
      setEditingMessageId(null);
      setEditContent('');
      setCurrentChatTitle('New chat');
      setDisplayedTitle('New chat');
      setIsTypingTitle(false); // Ensure typing is not active when clearing chat
      setSelectedFiles([]);
      setIsLoading(false);
    };

    window.addEventListener('clearChatContent', handleClearChatContent);
    return () => window.removeEventListener('clearChatContent', handleClearChatContent);
  }, []);

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  const handleSaveEdit = async () => {
    if (editingMessageId && editContent.trim()) {
      const messageIndex = messages.findIndex(msg => msg.id === editingMessageId);
      if (messageIndex === -1) return;

      const editedMessage = messages[messageIndex];
      const updatedContent = editContent.trim();
      
      // First, close the edit UI
      setEditingMessageId(null);
      setEditContent('');
      
      // Update the message content
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessageId ? { ...msg, content: updatedContent } : msg
      ));

      // If it's a user message, regenerate the assistant response with updated content
      if (editedMessage.role === 'user') {
        await regenerateResponse(messageIndex, updatedContent);
      }
      // Assistant messages don't trigger regeneration
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleFileUpload = async () => {
    // Create a hidden file input and use UploadCare to process files
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '*/*'; // Allow all file types
    
    input.onchange = async function(event: Event) {
      const target = event.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      
      
      if (files.length === 0) return;
      
      // Process files and convert to base64 for persistence
      const processedFiles = await Promise.all(files.map(async (file) => {
        try {
          // Check file size - limit to 5MB for images, 10MB for other files
          const maxImageSize = 5 * 1024 * 1024; // 5MB
          const maxFileSize = 10 * 1024 * 1024; // 10MB
          
          if (file.size > (file.type.startsWith('image/') ? maxImageSize : maxFileSize)) {
            throw new Error(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB). Max allowed: ${file.type.startsWith('image/') ? '5MB' : '10MB'}`);
          }
          
          let url: string;
          
          // Convert images to base64 for persistence with compression
          if (file.type.startsWith('image/')) {
            url = await new Promise<string>((resolve, reject) => {
              // Compress image if it's larger than 2MB
              if (file.size > 2 * 1024 * 1024) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = () => {
                  // Calculate dimensions to reduce file size
                  let { width, height } = img;
                  const maxDimension = 1920; // Max width/height
                  
                  if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                      height = (height * maxDimension) / width;
                      width = maxDimension;
                    } else {
                      width = (width * maxDimension) / height;
                      height = maxDimension;
                    }
                  }
                  
                  canvas.width = width;
                  canvas.height = height;
                  ctx?.drawImage(img, 0, 0, width, height);
                  
                  // Convert to JPEG with quality 0.8 to reduce file size
                  const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                  resolve(compressedDataUrl);
                };
                
                img.onerror = () => reject(new Error('Failed to load image for compression'));
                
                const fileReader = new FileReader();
                fileReader.onload = (e) => {
                  img.src = e.target?.result as string;
                };
                fileReader.onerror = () => reject(new Error('Failed to read image file'));
                fileReader.readAsDataURL(file);
              } else {
                // Small image, convert directly to base64
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Failed to convert image to base64'));
                reader.readAsDataURL(file);
              }
            });
          } else {
            // For other files, use blob URL
            url = URL.createObjectURL(file);
          }
          
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            url: url,
            publicId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
        } catch (error) {
          console.error('Error processing file:', file.name, error);
          
          // Show file error to user
          const errorMessage = error instanceof Error ? error.message : 'Unknown error processing file';
          toast.error(`${file.name}: ${errorMessage}`);
          
          // For images under 20MB, try a simpler base64 conversion as fallback
          if (file.type.startsWith('image/') && file.size < 20 * 1024 * 1024) {
            console.log('Attempting fallback base64 conversion for image:', file.name);
            try {
              const base64Url = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(file);
              });
              return {
                name: file.name,
                type: file.type,
                size: file.size,
                url: base64Url,
                publicId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              };
            } catch (fallbackError) {
              console.error('Fallback base64 conversion also failed:', file.name, fallbackError);
              toast.error(`Failed to process ${file.name}. Try a smaller image.`);
            }
          }
          
          // Final fallback to blob URL
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            url: URL.createObjectURL(file),
            publicId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
        }
      }));
      
      setSelectedFiles(prev => [...prev, ...processedFiles]);
      toast.success(`${files.length} file(s) added successfully`);
    };
    
    // Trigger native file picker
    input.click();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateChatTitle = (firstMessage: string): string => {
    console.log('generateChatTitle called with:', firstMessage);
    // Remove common greetings and short responses
    const cleanMessage = firstMessage.toLowerCase().trim();
    
    // Skip very short messages or common greetings
    if (cleanMessage.length < 3 || 
        ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'].includes(cleanMessage)) {
      console.log('Message too short or greeting, returning New chat');
      return 'New chat';
    }
    
    // Remove common question words, filler words, and action words
    const wordsToRemove = [
      'what', 'how', 'when', 'where', 'why', 'who', 'which', 'can', 'could', 'would', 'should', 
      'is', 'are', 'do', 'does', 'did', 'the', 'a', 'an', 'and', 'or', 'but', 'to', 'for', 
      'of', 'in', 'on', 'at', 'by', 'with', 'from', 'up', 'about', 'into', 'through', 'during', 
      'before', 'after', 'above', 'below', 'between', 'among', 'i', 'you', 'he', 'she', 'it', 
      'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 
      'our', 'their', 'build', 'create', 'make', 'help', 'learn', 'understand', 'explain', 
      'tell', 'show', 'give', 'provide', 'need', 'want', 'looking', 'trying', 'working', 
      'setting', 'getting', 'using', 'app', 'application', 'project', 'website', 'site'
    ];
    
    const words = cleanMessage.split(' ').filter(word => 
      word.length > 2 && !wordsToRemove.includes(word)
    );
    
    // If nothing meaningful left, use original message
    if (words.length === 0) {
      const originalWords = cleanMessage.split(' ').filter(word => word.length > 2);
      if (originalWords.length === 0) return 'New chat';
      words.push(...originalWords.slice(0, 3));
    }
    
    // Take first few meaningful words and capitalize
    const titleWords = words.slice(0, 3); // Focus on main topic with 3 words
    const title = titleWords.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    console.log('Generated title:', title);
    return title || 'New chat';
  };

  const saveChatToMongoDB = async (newMessages: typeof messages, forceTitleGeneration = false) => {
    console.log('📊 saveChatToMongoDB called - mounted:', mounted, 'isClient:', isClient, 'messages:', newMessages.length);
    if (!mounted || !isClient) {
      console.log('❌ saveChatToMongoDB skipped - mounted:', mounted, 'isClient:', isClient);
      return;
    }
    
    try {
      // Generate title from first meaningful user message
      const userMessages = newMessages.filter(msg => msg.role === 'user');
      let chatTitle = currentChatTitle; // Use existing title by default
      
      console.log('saveChatToMongoDB - newMessages:', newMessages);
      console.log('saveChatToMongoDB - userMessages:', userMessages);
      console.log('saveChatToMongoDB - userMessages.length:', userMessages.length);
      console.log('saveChatToMongoDB - titleGenerated:', titleGenerated);
      console.log('saveChatToMongoDB - forceTitleGeneration:', forceTitleGeneration);
      console.log('saveChatToMongoDB - currentChatTitle:', currentChatTitle);
      console.log('saveChatToMongoDB - userId:', user?.id || 'anonymous');
      console.log('saveChatToMongoDB - chatId:', chatId);
      
      // Generate title if:
      // 1. Force generation is requested, OR
      // 2. Current title is "New chat" and we have user messages
      const shouldGenerateTitle = forceTitleGeneration || 
                                 (currentChatTitle === 'New chat' && userMessages.length > 0);
      
      if (shouldGenerateTitle && userMessages.length > 0) {
        // Find the most meaningful user message for title generation
        const meaningfulMessage = userMessages.find(msg => {
          const generatedTitle = generateChatTitle(msg.content);
          return generatedTitle !== 'New chat';
        }) || userMessages[0]; // Fallback to first message if none are meaningful
        
        console.log('Using message for title:', meaningfulMessage);
        chatTitle = generateChatTitle(meaningfulMessage.content);
        console.log('Generating title from:', meaningfulMessage.content, '→', chatTitle);
        console.log('Setting currentChatTitle to:', chatTitle);
        setTitleGenerated(true);
      } else {
        console.log('Using existing title:', chatTitle);
      }
      
      // Save to MongoDB with retry logic
      console.log('Sending chat to MongoDB:', {
        chatId,
        userId: user?.id || 'anonymous',
        title: chatTitle,
        messageCount: newMessages.length
      });
      
      await fetchWithRetry('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          userId: user?.id || 'anonymous',
          title: chatTitle,
          messages: newMessages
        }),
      }, {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 5000
      });
      
      console.log('Chat saved to MongoDB successfully:', chatId, 'Title:', chatTitle);
      
      // Update current chat title with typing effect only if title changed
      if (chatTitle !== currentChatTitle) {
        console.log('Updating currentChatTitle from', currentChatTitle, 'to', chatTitle);
        setCurrentChatTitle(chatTitle);
        // Start typing effect immediately - don't set displayedTitle first
        typeTitle(chatTitle);
        
        // Dispatch custom event to notify sidebar
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chatSaved', { detail: { chatId, title: chatTitle } }));
        }
      } else {
        console.log('Title unchanged, not updating UI');
      }
    } catch (error) {
      console.error('Failed to save chat to MongoDB:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const loadChatHistory = async () => {
    if (!mounted || !isClient) return;
    
    try {
      // Load from MongoDB using silent fetch for expected 404s
      const response = await fetchSilent(`/api/chats?chatId=${chatId}`);
      
      if (response) {
        const chatData = await response.json();
        console.log('Loaded chat from MongoDB:', chatData);
        
        if (chatData.messages && chatData.messages.length > 0) {
          setMessages(chatData.messages);
        }
        // Set the chat title from loaded data
        if (chatData.title) {
          setCurrentChatTitle(chatData.title);
          setDisplayedTitle(chatData.title);
          setIsTypingTitle(false); // Ensure typing is not active for loaded chats
          setTitleGenerated(true); // Mark title as already generated for loaded chats
        }
      } else {
        // 404 response (new chat) - silently handle
        setMessages([]);
      }
      
      // Memory context will be loaded when needed during conversation
      // Skipped for initial performance optimization
    } catch (error) {
      // For other errors, log and show user-friendly message
      console.error('Failed to load chat history from MongoDB:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const regenerateResponse = async (userMessageIndex: number, updatedContent: string) => {
    setIsLoading(true);
    try {
      // Get all messages up to the edited user message (excluding the edited message)
      const messagesUpToEdit = messages.slice(0, userMessageIndex);
      
      // Add the updated user message
      const updatedMessages = [
        ...messagesUpToEdit,
        { id: messages[userMessageIndex].id, role: 'user' as const, content: updatedContent }
      ];
      
      // Remove any assistant messages after the edited user message
      setMessages(prev => prev.slice(0, userMessageIndex + 1));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          model: selectedModel,
        }),
      });

      if (!response.ok) throw new Error('Failed to regenerate response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const assistantMessage = { id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, role: 'assistant' as const, content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: msg.content + chunk }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error regenerating response:', error);
      toast.error('Failed to regenerate response');
    } finally {
      setIsLoading(false);
    }
  };

  // Memory functions - use simple memory (skip Mem0 for now)
  const saveToMemory = async (messages: Array<{id: string, role: 'user' | 'assistant', content: string, files?: File[]}>) => {
    try {
      console.log('💾 Saving', messages.length, 'messages to memory systems...');
      
      // Save to both Mem0 and Simple Memory for redundancy
      
      // Save to Mem0 (for individual chat context)
      try {
        const mem0Response = await fetchWithRetry('/api/mem0', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'save',
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content
          })),
            userId: user?.id || 'anonymous',
            runId: chatId
          }),
        }, {
          maxRetries: 1,
          baseDelay: 1000,
          maxDelay: 2000
        });
        
        const mem0Result = await mem0Response.json();
        if (mem0Result.success) {
          console.log('✅ Mem0 save successful:', mem0Result.data?.length || 0, 'memories created');
        } else {
          console.log('⚠️ Mem0 save failed:', mem0Result.error);
        }
      } catch (mem0Error) {
        console.error('❌ Mem0 save error:', mem0Error);
      }
      
      // Save to Simple Memory (for cross-chat memory)
      try {
        const simpleResponse = await fetchWithRetry('/api/simple-memory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'save',
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            userId: user?.id || 'anonymous',
            runId: chatId
          }),
        }, {
          maxRetries: 1,
          baseDelay: 500,
          maxDelay: 1000
        });
        
        const simpleResult = await simpleResponse.json();
        if (simpleResult.success) {
          console.log('✅ Simple Memory save successful:', simpleResult.saved?.length || 0, 'memories saved');
          console.log('📝 Saved memories:', simpleResult.saved);
        } else {
          console.log('⚠️ Simple Memory save failed:', simpleResult.error);
        }
      } catch (simpleError) {
        console.error('❌ Simple Memory save error:', simpleError);
      }
    } catch (error) {
      console.error('❌ Failed to save to memory systems:', error);
    }
  };

  const loadMemoryContext = async () => {
    try {
      console.log('Loading memory context for user:', user?.id || 'anonymous');

      // Parallel loading for better performance
      const [mem0Response, simpleResponse] = await Promise.allSettled([
        fetchWithRetry('/api/mem0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'load',
            filters: { user_id: user?.id || 'anonymous' }
          }),
        }, { maxRetries: 1, baseDelay: 500, maxDelay: 1000 }),
        
        fetchWithRetry('/api/simple-memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'load',
            userId: user?.id || 'anonymous',
          }),
        }, { maxRetries: 1, baseDelay: 300, maxDelay: 800 })
      ]);

      // Process Mem0 response
      if (mem0Response.status === 'fulfilled') {
        const mem0Result = await mem0Response.value.json();
        if (mem0Result.data && mem0Result.data.length > 0) {
          console.log('✅ Using Mem0 context:', mem0Result.data.length, 'memories');
          return mem0Result.data || [];
        }
      }

      // Process Simple Memory response
      if (simpleResponse.status === 'fulfilled') {
        const simpleResult = await simpleResponse.value.json();
        console.log('✅ Simple Memory loaded:', simpleResult.data?.length || 0, 'memories');
        return simpleResult.data || [];
      }

      return [];
    } catch (error) {
      console.error('❌ Failed to load memory context:', error);
      return [];
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setEditingMessageId(null);
    setEditContent('');
    setCurrentChatTitle('New chat');
    setDisplayedTitle('New chat');
    setIsTypingTitle(false); // Ensure typing is not active for new chats
    setTitleGenerated(false); // Reset title generation flag
    const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setChatId(newChatId);
    setSelectedFiles([]);
  };

  const handleDeleteChat = async () => {
    try {
      // Delete from MongoDB
      const response = await fetch(`/api/chats?chatId=${chatId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMessages([]);
        setInput('');
        setEditingMessageId(null);
        setEditContent('');
        setSelectedFiles([]);
        setIsDeleteModalOpen(false);
        
        // Dispatch custom event to notify sidebar
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chatDeleted', { detail: { chatId } }));
        }
        
        toast.success('Chat deleted successfully');
      } else {
        toast.error('Failed to delete chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit main form if floating input is visible
    if (floatingInput?.visible) {
      console.log('Main form submission prevented - floating input is visible');
      return;
    }
    
    if (!input.trim() && selectedFiles.length === 0) return;

    // Validate payload size to prevent HTTP 413 errors
    const totalSize = selectedFiles.reduce((sum, file) => sum + (file.url.length || 0), 0);
    const textSize = new TextEncoder().encode(input.trim()).length;
    const totalPayloadSize = totalSize + textSize;
    
    // If payload is too large (over 25MB), warn and limit files
    if (totalPayloadSize > 25 * 1024 * 1024) {
      toast.error(`Message too large (${(totalPayloadSize / 1024 / 1024).toFixed(1)}MB). Please reduce file sizes or send fewer files.`);
      return;
    }

    const userMessage = { 
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
      role: 'user' as const, 
      content: input.trim(),
      files: selectedFiles 
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedFiles([]);
    setIsLoading(true);

    // Save chat immediately when user sends first message
    if (isClient && messages.length === 0) {
      console.log('First message detected, saving chat with title generation');
      console.log('User message being added:', userMessage);
      const initialMessages = [...messages, userMessage];
      console.log('Initial messages array:', initialMessages);
      saveChatToMongoDB(initialMessages, true); // Force title generation on first message
    }

    try {
      // Load memory context for AI BEFORE processing
      console.log('About to load memory context for user:', user?.id || 'anonymous');
      
      // Force load memory context synchronously
      const memoryContext = await Promise.allSettled([
        fetch('/api/mem0', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'load',
            filters: { user_id: user?.id || 'anonymous' }
          }),
        }),
        fetch('/api/simple-memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'load',
            userId: user?.id || 'anonymous',
          }),
        })
      ]).then(async ([mem0Resp, simpleResp]) => {
        // Try Simple Memory first as it's faster for cross-chat
        if (simpleResp.status === 'fulfilled') {
          const simpleResult = await simpleResp.value.json();
          if (simpleResult.data && simpleResult.data.length > 0) {
            console.log('✅ Using Simple Memory context:', simpleResult.data.length, 'memories');
            console.log('📊 Simple Memory data:', simpleResult.data);
            return simpleResult.data.map((item: any) => ({ memory: item.memory }));
          }
        }
        
        // Fallback to Mem0
        if (mem0Resp.status === 'fulfilled') {
          const mem0Result = await mem0Resp.value.json();
          if (mem0Result.data && mem0Result.data.length > 0) {
            console.log('✅ Using Mem0 context:', mem0Result.data.length, 'memories');
            return mem0Result.data || [];
          }
        }
        
        return [];
      });

      console.log('Using memory context:', memoryContext);
      console.log('Context messages count:', memoryContext.length);
      console.log('Memory context details:', memoryContext.map((m: {memory?: string}) => m.memory || 'No memory'));

      // Prepare messages with context
      const contextMessages = memoryContext.length > 0
        ? [
            { role: 'system', content: `Previous conversation context:\n${memoryContext.map((m: {memory?: string, role?: string, content?: string}) => m.memory || `${m.role}: ${m.content}`).join('\n')}` },
            ...messages,
            userMessage
          ]
        : [...messages, userMessage];
      
      console.log('Final context messages:', contextMessages);

      const response = await fetchWithRetry('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: contextMessages,
          model: selectedModel 
        }),
      }, {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 8000
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const assistantMessage = { id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, role: 'assistant' as const, content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        assistantMessage.content += chunk;
        setMessages(prev => {
          const updatedMessages = prev.map(msg => 
          msg.id === assistantMessage.id ? { ...msg, content: assistantMessage.content } : msg
          );
          return updatedMessages;
        });
      }

      // Save completed conversation to MongoDB (update existing chat)
      console.log('🔍 handleSubmit - isClient value:', isClient, 'typeof isClient:', typeof isClient);
      if (isClient) {
        const finalMessages = [...messages, userMessage, assistantMessage];
        console.log('🚀 Calling saveChatToMongoDB from handleSubmit - finalMessages:', finalMessages.length, 'isClient:', isClient);
        // Only update messages, don't regenerate title
        saveChatToMongoDB(finalMessages, false);
        
                // Save to memory asynchronously without blocking UI
                console.log('About to save memory for user:', user?.id || 'anonymous');
                console.log('Memory messages:', userMessage.content, assistantMessage.content);
                const memoryUserMessage = { ...userMessage, files: undefined };
                const memoryAssistantMessage = { ...assistantMessage, files: undefined };
                
                // Don't await - let it save in background
                saveToMemory([memoryUserMessage, memoryAssistantMessage]).catch(err => 
                  console.log('Memory save completed in background')
                );
      }
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while auth is loading or user is not authenticated
  if (!mounted || !isClient || !isLoaded || !isSignedIn || !chatId) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-500">
              {!mounted ? 'Loading...' : !isLoaded ? 'Loading...' : !isSignedIn ? 'Redirecting to sign up...' : 'Loading chat...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">
            {displayedTitle}
            {isTypingTitle && (
              <span className="animate-pulse text-gray-500">|</span>
            )}
          </h1>
        </div>
                      {messages.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                            <DialogTrigger asChild>
                              <button className="cursor-pointer">
                                <MdDelete className="w-5 h-5 text-red-500" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="space-y-4 p-0">
                              <DialogHeader className="space-y-4 p-6 pb-0">
                                <DialogTitle>Delete Chat</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete this chat? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="space-x-2 p-6 pt-0 m-0">
                                <button
                                  onClick={() => setIsDeleteModalOpen(false)}
                                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleDeleteChat}
                                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors cursor-pointer"
                                >
                                  Delete Chat
                                </button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
      </div>

      {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="max-w-4xl mx-auto space-y-4 w-full">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`${message.role === 'user' ? 'group' : 'flex flex-col'} ${editingMessageId === message.id ? 'w-full max-w-full' : message.role === 'user' ? 'max-w-2xl' : 'max-w-full w-full'}`}>
                  {editingMessageId === message.id ? (
                    <div className="rounded-2xl px-6 py-4 w-full bg-gray-100 min-h-[120px] flex flex-col">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit();
                          }
                        }}
                        className="flex-1 bg-transparent border-none outline-none resize-none text-base text-black placeholder-gray-500"
                        rows={Math.max(3, editContent.split('\n').length)}
                        autoFocus
                        placeholder="Type your message..."
                      />
                      <div className="flex gap-3 mt-4 justify-end">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-white border border-gray-300 text-black rounded-lg text-sm hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {/* File Attachments */}
                      {message.files && message.files.length > 0 && (
                        <div className={`flex flex-col gap-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {/* Image Thumbnails */}
                          {message.files.filter(file => file.type.startsWith('image/')).length > 0 && (
                            <div className="flex gap-2">
                              {message.files
                                .filter(file => file.type.startsWith('image/'))
                                .map((file, index) => (
                                  <div key={index} className="w-48 h-48 rounded-lg overflow-hidden">
                                    <ImageWithProgress
                                      src={file.url}
                                      alt={file.name}
                                      className="w-full h-full"
                                    />
                                  </div>
                                ))}
                            </div>
                          )}
                          
                          {/* Document Files */}
                          {message.files
                            .filter(file => !file.type.startsWith('image/'))
                            .map((file, index) => (
                              <div key={index} className="flex items-center gap-3 bg-gray-100 rounded-lg p-3 w-fit max-w-[400px]">
                                {file.type === 'application/pdf' ? (
                                  <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-black text-sm break-words">
                                    {file.name}
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    {file.type === 'application/pdf' ? 'PDF' : 
                                     file.type.includes('document') ? 'DOCUMENT' : 
                                     file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                      
                      {/* Message Content */}
                      {message.content && (
                        <div
                          className={`rounded-2xl px-4 py-2 block ${message.role === 'user' ? 'w-fit ml-auto' : 'w-full max-w-full'} ${message.role === 'user' ? 'break-all' : 'break-words'} overflow-hidden ${
                      message.role === 'user'
                              ? 'text-black text-base leading-normal bg-gray-200'
                        : 'bg-white text-gray-900 text-base'
                    }`}
                          onMouseUp={(e) => message.role === 'assistant' && handleTextSelection(message.id, e)}
                          onTouchEnd={(e) => message.role === 'assistant' && handleTextSelection(message.id, e as unknown as React.MouseEvent)}
                          onDoubleClick={(e) => message.role === 'assistant' && handleDoubleClick(message.id, e)}
                  >
                    {message.role === 'assistant' && message.content.includes('```') ? (
                      <div className="space-y-4 w-full max-w-full overflow-hidden block">
                        {message.content.split('```').map((part, index) => {
                          if (index % 2 === 1) {
                            // This is a code block
                            const lines = part.split('\n');
                            const language = lines[0] || 'text';
                            const code = lines.slice(1).join('\n');
                            return (
                              <CodeBlock
                                key={index}
                                code={code}
                                language={language}
                              />
                            );
                          } else if (part.trim()) {
                            // This is regular text
                            return (
                                    <p key={index} className="whitespace-pre-wrap break-words w-full max-w-full overflow-hidden block">
                                {part}
                              </p>
                            );
                          }
                          return null;
                        })}
                      </div>
                    ) : (
                            <p className="whitespace-pre-wrap break-words w-full max-w-full overflow-hidden block">{message.content}</p>
                          )}
                        </div>
                    )}
                  </div>
                  )}
                  {message.role === 'user' && editingMessageId !== message.id && (!message.files || message.files.length === 0) && (
                    <div className="flex items-center gap-2 mt-2 px-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(message.content);
                              toast.success("Message copied to clipboard");
                            }}
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                            onClick={() => handleEditMessage(message.id, message.content)}
                          >
                            <Pencil className="w-4 h-4 text-gray-500" strokeWidth={2.5} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                  {message.role === 'assistant' && editingMessageId !== message.id && (
                    <div className="flex items-center gap-2 mt-2 px-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(message.content);
                              toast.success("Message copied to clipboard");
                            }}
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                            <ThumbsUp className="w-4 h-4 text-gray-500" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Good response</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                            <ThumbsDown className="w-4 h-4 text-gray-500" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Bad response</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                            <Share className="w-4 h-4 text-gray-500" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Share</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
                      )}
                    </div>
                    <div ref={messagesEndRef} />
                  </div>
                )}

      {/* Main Content */}
      <div className={`flex items-center justify-center px-6 ${messages.length === 0 ? 'flex-1' : 'py-4'}`}>
        <div className="w-full max-w-4xl text-center">
          {messages.length === 0 && (
            <h2 className="text-2xl font-medium text-gray-900 mb-8">
              What are you working on?
            </h2>
          )}
          
          {/* Suggestion */}
          {suggestion && suggestion.visible && (
            <div className="mb-4 w-full max-w-4xl mx-auto">
              <div className="bg-gray-100 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors" onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Suggestion clicked, closing suggestion');
                setSuggestion(null);
              }}>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-gray-700 font-medium">{suggestion.text}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseSuggestion();
                  }}
                  className="p-1 hover:bg-gray-300 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          )}

          {/* Input Field */}
          <form onSubmit={handleSubmit} action="#" className="relative">
            <div className="bg-white border border-gray-300 rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Floating Input Bar */}
              {floatingInput && floatingInput.visible && (
                <div className="bg-gray-100 rounded-t-3xl px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Textarea
                      value={floatingInput.text}
                      onChange={(e) => setFloatingInput({...floatingInput, text: e.target.value})}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFloatingInputSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                        }
                      }}
                      placeholder="Ask anything"
                      className="flex-1 border-0 shadow-none focus-visible:ring-0 text-gray-900 placeholder-gray-500 resize-none min-h-[24px] max-h-[120px] !rounded-none bg-transparent leading-normal cursor-default"
                      rows={1}
                      autoFocus
                      style={{ caretColor: 'transparent' }}
                    />
                    <button
                      type="button"
                      onClick={handleCloseFloatingInput}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}
              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="px-4 py-2 border-b border-gray-200">
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative flex-shrink-0">
                        {file.type.startsWith('image/') ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                            <ImageWithProgress
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full"
                            />
                            <button
                              onClick={() => removeFile(index)}
                              className="absolute top-1 right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors z-10"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative bg-gray-100 rounded-lg p-3 w-fit max-w-[400px] flex items-center gap-3">
                            {file.type === 'application/pdf' ? (
                              <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-black text-sm break-words">
                                {file.name}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {file.type === 'application/pdf' ? 'PDF' : 
                                 file.type.includes('document') ? 'DOCUMENT' : 
                                 file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                              </div>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="w-5 h-5 bg-black rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors flex-shrink-0"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Input Area */}
              <div className="px-4 py-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                    }
                  }}
                  placeholder="Ask anything"
                  className="flex-1 border-0 shadow-none focus-visible:ring-0 text-gray-900 placeholder-gray-500 resize-none min-h-[24px] max-h-[120px] !rounded-none bg-transparent leading-normal input-16px"
                  rows={1}
                  disabled={isLoading}
                />
              </div>
              
              {/* Separator */}
              <div className="border-t border-gray-200"></div>
              
              {/* Hidden File Input */}
              
              {/* Control Bar */}
              <div className="flex items-center justify-between px-4 py-3">
                {/* Left side - Model Selector with Plus */}
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                        <Plus className="w-6 h-6 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-56" align="start">
                                    <DropdownMenuItem onClick={handleFileUpload}>
                                      <Paperclip className="w-4 h-4 mr-2" />
                                      Upload files
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Telescope className="w-4 h-4 mr-2" />
                                      Deep research
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Image className="w-4 h-4 mr-2" aria-label="Create image" />
                                      Create image
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Lightbulb className="w-4 h-4 mr-2" />
                                      Think longer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <BookOpen className="w-4 h-4 mr-2" />
                                      Study and learn
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                  </DropdownMenu>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button 
                                      className="flex items-center gap-1 hover:bg-gray-100 rounded-md transition-colors px-3 py-2"
                                      onClick={() => console.log('Dropdown clicked')}
                                    >
                                      {(() => {
                                        const selectedModelData = models.find(model => model.name === selectedModel);
                                        const SelectedLogo = selectedModelData?.logo;
                                        return (
                                          <>
                                            {SelectedLogo && <SelectedLogo className="w-4 h-4" />}
                                            <span className="text-sm font-medium text-gray-900">{selectedModel}</span>
                                          </>
                                        );
                                      })()}
                                      <ChevronDown className="w-3 h-3 text-gray-500" />
                                      {/* Context Usage Indicator */}
                                      <div className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                        contextUsage.needsOptimization 
                                          ? 'bg-red-100 text-red-600' 
                                          : contextUsage.percentage > 70 
                                            ? 'bg-yellow-100 text-yellow-600' 
                                            : 'bg-green-100 text-green-700'
                                      }`}>
                                        {contextUsage.percentage}%
                                      </div>
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-56 z-50" align="start">
                                    {models.map((model) => {
                                      const LogoIcon = model.logo;
                                      return (
                                        <DropdownMenuItem
                                          key={model.name}
                                          onClick={() => {
                                            console.log('Model selected:', model.name);
                                            console.log('Current chat title:', currentChatTitle);
                                            console.log('Current selected model:', selectedModel);
                                            setSelectedModel(model.name);
                                            updateContextUsage(messages, model.name);
                                            
                                            // Show notification if context optimization is needed
                                            if (messages.length > 0) {
                                              const tokens = estimateTokens(messages.map(msg => ({
                                                role: msg.role,
                                                content: msg.content
                                              })));
                                              const limit = getModelLimit(model.name);
                                              
                                              if (tokens > limit * 0.85) {
                                                toast.info(`💡 Context optimized for ${model.name}`, {
                                                  description: `Longer conversations were condensed for better performance`
                                                });
                                              }
                                            }
                                            // Update navbar title only if it's a new chat (showing "New chat")
                                            if (currentChatTitle === 'New chat') {
                                              console.log('Updating navbar title to model name for new chat:', model.name);
                                              setCurrentChatTitle(model.name);
                                              setDisplayedTitle(model.name);
                                              setIsTypingTitle(false); // Ensure typing is not active for model changes
                                            } else {
                                              console.log('Not updating navbar title - existing chat title:', currentChatTitle);
                                            }
                                          }}
                                          className={`flex items-center justify-between ${model.name === 'GPT-3.5 Turbo' ? 'py-3' : 'py-2'} ${selectedModel === model.name ? 'border border-blue-500 bg-blue-50' : ''}`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <LogoIcon className="w-4 h-4" />
                                            <span>{model.name}</span>
                                          </div>
                                          {selectedModel === model.name && (
                                            <Check className="w-4 h-4 text-gray-600" />
                                          )}
                                        </DropdownMenuItem>
                                      );
                                    })}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                </div>
                
                {/* Right side - Send Button Only */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className="hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <CiMicrophoneOn className="w-6 h-6 text-gray-500" />
                  </button>
                  {input.trim() ? (
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <BsArrowUpCircleFill className="w-6 h-6 text-black" />
                    </button>
                  ) : isLoading ? (
                    <button
                      type="button"
                      onClick={() => setIsLoading(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors bg-gray-200"
                      title="Stop generation"
                    >
                      <Square className="w-6 h-6 text-gray-500" fill="currentColor" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors bg-gray-200"
                    >
                      <RiVoiceprintFill className="w-6 h-6 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
      </div>
      </div>
      
      {/* Ask ChatGPT Button */}
      {selectedText && (
        <div
          data-ask-chatgpt-button
          className="fixed z-50 bg-white border border-gray-300 rounded-xl shadow-xl px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
          style={{
            left: `${selectedText.position.x}px`,
            top: `${selectedText.position.y}px`,
            transform: 'translateX(-50%)',
            maxWidth: '200px',
            whiteSpace: 'nowrap'
          }}
          title="Ask ChatGPT"
          onClick={(e) => {
            e.stopPropagation();
            handleAskChatGPT();
          }}
        >
          <FaQuoteRight className="w-3 h-3 text-gray-600" />
          <span className="font-medium text-gray-700" style={{ fontSize: '14px' }}>Ask ChatGPT</span>
        </div>
      )}

    </div>
    </TooltipProvider>
  );
};

export default ChatPage;
