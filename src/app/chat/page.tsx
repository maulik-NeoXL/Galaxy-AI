"use client";

import { ChevronDown, Plus, Copy, ThumbsUp, ThumbsDown, Share, Paperclip, Telescope, Image, Lightbulb, BookOpen, Pencil, Check } from "lucide-react";
import { MdDelete } from "react-icons/md";
import { CiMicrophoneOn } from "react-icons/ci";
import { RiVoiceprintFill } from "react-icons/ri";
import { BsArrowUpCircleFill } from "react-icons/bs";
import { SiOpenai, SiX } from "react-icons/si";
import { RiGeminiFill } from "react-icons/ri";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CodeBlock from "@/components/CodeBlock";
import { toast } from "sonner";

const ChatPage = () => {
  const searchParams = useSearchParams();
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [selectedModel, setSelectedModel] = useState('GPT-3.5 Turbo');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle new chat from sidebar
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      handleNewChat();
      // Remove the query parameter from URL
      window.history.replaceState({}, '', '/chat');
    }
  }, [searchParams]);

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  const handleSaveEdit = async () => {
    if (editingMessageId && editContent.trim()) {
      const messageIndex = messages.findIndex(msg => msg.id === editingMessageId);
      if (messageIndex === -1) return;

      const editedMessage = messages[messageIndex];
      
      // First, close the edit UI and show the updated message
      setEditingMessageId(null);
      setEditContent('');
      
      // Update the message content
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessageId ? { ...msg, content: editContent.trim() } : msg
      ));

      // If it's a user message, regenerate the assistant response
      if (editedMessage.role === 'user') {
        await regenerateResponse(messageIndex);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const regenerateResponse = async (userMessageIndex: number) => {
    setIsLoading(true);
    try {
      // Get all messages up to the edited user message
      const messagesUpToEdit = messages.slice(0, userMessageIndex + 1);
      
      // Remove any assistant messages after the edited user message
      setMessages(prev => prev.slice(0, userMessageIndex + 1));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesUpToEdit,
          model: selectedModel,
        }),
      });

      if (!response.ok) throw new Error('Failed to regenerate response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const assistantMessage = { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: '' };
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

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleDeleteChat = () => {
    setMessages([]);
    setInput('');
    setEditingMessageId(null);
    setEditContent('');
    setIsDeleteModalOpen(false);
    toast.success('Chat deleted successfully');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          model: selectedModel 
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const assistantMessage = { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        assistantMessage.content += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id ? { ...msg, content: assistantMessage.content } : msg
        ));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">
            {selectedModel}
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
                    <div className="rounded-2xl px-6 py-4 block w-full bg-gray-100 min-h-[120px] flex flex-col">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
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
                    <div
                      className={`rounded-2xl px-4 py-2 block ${message.role === 'user' ? 'w-fit' : 'w-full max-w-full'} ${message.role === 'user' ? 'break-all' : 'break-words'} overflow-hidden ${
                        message.role === 'user'
                          ? 'text-black text-base leading-normal bg-gray-200'
                          : 'bg-white text-gray-900 text-base'
                      }`}
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
                  {message.role === 'user' && (
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
                  {message.role === 'assistant' && (
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
          
          {/* Input Field */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="bg-white border border-gray-300 rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
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
                  placeholder="What would you like to know?"
                  className="flex-1 border-0 shadow-none focus-visible:ring-0 text-gray-900 placeholder-gray-500 resize-none min-h-[24px] max-h-[120px] !rounded-none bg-transparent text-base placeholder:text-base leading-normal md:text-base"
                  rows={1}
                  disabled={isLoading}
                />
              </div>
              
              {/* Separator */}
              <div className="border-t border-gray-200"></div>
              
              {/* Control Bar */}
              <div className="flex items-center justify-between px-4 py-3">
                {/* Left side - Model Selector with Plus */}
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                        <Plus className="w-4 h-4 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-56" align="start">
                                    <DropdownMenuItem>
                                      <Paperclip className="w-4 h-4 mr-2" />
                                      Add photos & files
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
                                      className="flex items-center gap-1 hover:bg-gray-100 rounded-md transition-colors px-2 py-1"
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
                                            setSelectedModel(model.name);
                                          }}
                                          className="flex items-center justify-between"
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
                
                {/* Right side - Send Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <CiMicrophoneOn className="w-6 h-6 text-gray-500" />
                  </button>
                  {input.trim() ? (
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="p-1 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <BsArrowUpCircleFill className="w-6 h-6 text-black" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="p-1 hover:bg-gray-100 rounded-md transition-colors"
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
    </div>
    </TooltipProvider>
  );
};

export default ChatPage;
