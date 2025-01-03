'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { PlusCircle, MessageCircle, LogOut, Upload, FileText, Loader2, Pencil, Trash2, Send, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  chatId: string
  createdAt: Date
}

type Chat = {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  userId: string
}

type ProcessingStatus = {
  fileId: string
  fileName: string
  status: 'processing' | 'completed' | 'error'
  progress?: number
}

type EditingChat = {
  id: string;
  title: string;
}

type EditingMessage = {
  id: string;
  content: string;
}

export default function Chat() {
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [input, setInput] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [processingFiles, setProcessingFiles] = useState<ProcessingStatus[]>([])
  const [editingChat, setEditingChat] = useState<EditingChat | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [editingMessage, setEditingMessage] = useState<EditingMessage | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch('/api/chats');
        if (!response.ok) throw new Error('Failed to fetch chats');
        const data = await response.json();
        setChats(data);
        if (data.length > 0) {
          setCurrentChat(data[0]);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    fetchChats();
  }, []);

  useEffect(() => {
    const getAuthToken = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/auth/token', {
          method: 'POST',
          credentials: 'include',
        });
        const data = await response.json();
        
        // Store the token in a cookie
        document.cookie = `user_token=${data.access_token}; path=/`;
      } catch (error) {
        console.error('Auth error:', error);
      }
    };

    getAuthToken();
  }, []);

  const handleSend = async (content?: string) => {
    if ((content || input.trim()) && currentChat) {
      const messageContent = content || input.trim();
      const userMessage = {
        role: 'user',
        content: messageContent
      }
      
      const msgResponse = await fetch(`/api/chats/${currentChat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userMessage)
      });

      const savedUserMessage = await msgResponse.json();
      
      setCurrentChat(prev => ({
        ...prev!,
        messages: [...prev!.messages, savedUserMessage]
      }))
      setInput('')

      try {
        // Get fresh token
        const authResponse = await fetch('http://localhost:8000/api/auth/token', {
          method: 'POST',
          credentials: 'include',
        });
        const authData = await authResponse.json();
        const token = authData.access_token;

        // Make QA request
        const response = await fetch('http://localhost:8000/api/qa/ask', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({ question: userMessage.content }),
        });

        if (!response.ok) {
          throw new Error('Failed to get answer');
        }

        const data = await response.json();
        
        // Format the assistant's response with better structure
        let formattedAnswer = `Here's what I found:\n\n`;
        formattedAnswer += `${data.answer}\n\n`;
        
        if (data.citations && data.citations.length > 0) {
          formattedAnswer += `📚 Sources:\n`;
          formattedAnswer += `This information comes from page(s) ${data.citations.join(', ')} of your documents.\n\n`;
        }
        
        formattedAnswer += `💡 Additional Context:\n`;
        formattedAnswer += `I've analyzed the relevant sections of your documents to provide this answer. `;
        formattedAnswer += `If you'd like more specific details about any part of this response, feel free to ask.`;

        // Save assistant message with formatted response
        const assistantMessage = {
          role: 'assistant',
          content: formattedAnswer
        };

        const assistantMsgResponse = await fetch(`/api/chats/${currentChat.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assistantMessage)
        });

        const savedAssistantMessage = await assistantMsgResponse.json();
        
        setCurrentChat(prev => ({
          ...prev!,
          messages: [...prev!.messages, savedAssistantMessage]
        }));
      } catch (error: any) {
        console.error('Error getting answer:', error);
        
        const errorMessage = {
          role: 'assistant',
          content: `I apologize, but I encountered an error while processing your question. Here's what you can try:\n\n` +
            `1. Rephrase your question to be more specific\n` +
            `2. Check if the relevant PDF documents are properly uploaded\n` +
            `3. Try breaking down your question into smaller parts\n\n` +
            `Technical Details: ${error?.message || 'Unknown error'}`
        };

        // Save error message
        const errorMsgResponse = await fetch(`/api/chats/${currentChat.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorMessage)
        });

        const savedErrorMessage = await errorMsgResponse.json();
        
        setCurrentChat(prev => ({
          ...prev!,
          messages: [...prev!.messages, savedErrorMessage]
        }));
      }
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !currentChat) return;

    setIsUploading(true);
    
    // Always get a fresh token
    let token;
    try {
      const authResponse = await fetch('http://localhost:8000/api/auth/token', {
        method: 'POST',
        credentials: 'include',
      });
      const authData = await authResponse.json();
      token = authData.access_token;
      document.cookie = `user_token=${token}; path=/`;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      setIsUploading(false);
      return;
    }

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:8000/api/pdf/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Upload failed');
        }
        
        // Create success message
        const msgResponse = await fetch(`/api/chats/${currentChat.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'assistant',
            content: `Successfully uploaded and processed ${file.name}`
          })
        });

        const savedMessage = await msgResponse.json();
        
        setCurrentChat(prev => ({
          ...prev!,
          messages: [...prev!.messages, savedMessage]
        }));
      } catch (error: any) {
        console.error('Upload error:', error);
        
        // Create error message with more specific error information
        const msgResponse = await fetch(`/api/chats/${currentChat.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'assistant',
            content: `Failed to upload ${file.name}: ${error.message}`
          })
        });

        const savedMessage = await msgResponse.json();
        
        setCurrentChat(prev => ({
          ...prev!,
          messages: [...prev!.messages, savedMessage]
        }));
      }
    }
    
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNewChat = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `New Chat ${chats?.length + 1 || 1}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }
      
      const newChat = await response.json();
      
      // Ensure the new chat has a messages array
      const chatWithMessages = {
        ...newChat,
        messages: [] // Initialize empty messages array
      };
      
      // Update state only after successful creation
      setChats(prev => prev ? [chatWithMessages, ...prev] : [chatWithMessages]);
      setCurrentChat(chatWithMessages);

      // Clear input and scroll to bottom
      setInput('');
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`);
      if (!response.ok) throw new Error('Failed to fetch chat');
      
      const chat = await response.json();
      setCurrentChat(chat);
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
      })
      router.push('/signin')
    } catch (error) {
      console.error('Signout error:', error)
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete chat');

      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) throw new Error('Failed to rename chat');

      const updatedChat = await response.json();
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? updatedChat : chat
      ));
      if (currentChat?.id === chatId) {
        setCurrentChat(updatedChat);
      }
      setEditingChat(null);
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  const handleMessageEdit = async (messageId: string, newContent: string) => {
    if (!currentChat) return;
    
    try {
      // Find the message index
      const messageIndex = currentChat.messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return;

      // Update the message
      const updatedMessage = {
        ...currentChat.messages[messageIndex],
        content: newContent
      };

      // Update in database
      const response = await fetch(`/api/chats/${currentChat.id}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });

      if (!response.ok) throw new Error('Failed to update message');

      // Remove all messages after this one
      const newMessages = currentChat.messages.slice(0, messageIndex + 1);
      setCurrentChat(prev => ({
        ...prev!,
        messages: newMessages.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        )
      }));

      // Clear editing state
      setEditingMessage(null);

      // Regenerate response
      await handleSend(newContent);
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentChat?.messages])

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="p-4">
          <Button 
            onClick={handleNewChat} 
            className="w-full btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" /> 
                New Chat
              </>
            )}
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {chats?.map((chat) => (
            <div key={chat.id} className="p-2 group">
              {editingChat?.id === chat.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingChat.title}
                    onChange={(e) => setEditingChat({ ...editingChat, title: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameChat(chat.id, editingChat.title);
                      }
                    }}
                    onBlur={() => handleRenameChat(chat.id, editingChat.title)}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant={currentChat?.id === chat.id ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      currentChat?.id === chat.id 
                        ? "bg-gray-100 font-bold" 
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <MessageCircle className={`mr-2 h-4 w-4 ${
                      currentChat?.id === chat.id 
                        ? "text-blue-600" 
                        : ""
                    }`} />
                    <span className="flex-1 truncate">
                      {chat.title}
                    </span>
                  </Button>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingChat({ id: chat.id, title: chat.title });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.id);
                      }}
                      className="btn-danger opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">DocuMind AI</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={!currentChat || isUploading}
              className="btn-secondary flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload PDFs
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSignOut}
              className="hover:text-red-500"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            multiple
            className="hidden"
          />
        </header>

        {/* Show processing files */}
        {processingFiles.length > 0 && (
          <div className="bg-white border-b p-2">
            <div className="flex flex-col space-y-2">
              {processingFiles.map(file => (
                <div key={file.fileId} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span>{file.fileName}</span>
                  {file.status === 'processing' && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span className="text-gray-500">
                    {file.status === 'completed' ? 'Ready for Q&A' : 'Processing...'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-hidden p-4">
          <Card className="h-full flex flex-col">
            <ScrollArea className="flex-1 p-4">
              {currentChat?.messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div className="relative group">
                    <div
                      className={`inline-block p-4 rounded-lg max-w-[80%] shadow-lg ${
                        message.role === 'user'
                          ? 'user-message'
                          : 'assistant-message'
                      }`}
                    >
                      {message.role === 'user' && (
                        <button
                          onClick={() => setEditingMessage({ id: message.id, content: message.content })}
                          className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                        </button>
                      )}
                      
                      {editingMessage?.id === message.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editingMessage.content}
                            onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleMessageEdit(message.id, editingMessage.content);
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleMessageEdit(message.id, editingMessage.content)}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        message.role === 'assistant' ? (
                          <div className="whitespace-pre-wrap prose prose-sm">
                            {message.content.split('\n').map((line, i) => (
                              <div key={i} className="mb-2">
                                {line.startsWith('📚') ? (
                                  <div className="message-source">{line}</div>
                                ) : line.startsWith('💡') ? (
                                  <div className="message-context">{line}</div>
                                ) : (
                                  <div className="message-main">{line}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="font-medium">{message.content}</div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </ScrollArea>
            <Separator />
            <CardContent className="p-4">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button 
                  onClick={() => handleSend()}
                  className="btn-primary"
                  disabled={!input.trim() || !currentChat || isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

