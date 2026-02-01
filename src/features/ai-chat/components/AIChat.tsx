import { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, Trash2, Sparkles, AlertCircle,
  ChevronDown, ChevronUp, X
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { useAIChat } from '@/hooks/useAIChat';
import { useAIConfig } from '@/features/ai-chat';
import { cn } from '@/lib/utils';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChat({ isOpen, onClose }: AIChatProps) {
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIChat();
  const { isConfigured } = useAIConfig();
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const quickPrompts = [
    'Bantu saya membuat CV',
    'Tips wawancara kerja',
    'Skill yang perlu dipelajari',
    'Ekspektasi gaji untuk posisi junior',
  ];

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-career-600 hover:bg-career-700 shadow-lg rounded-full px-6"
        >
          <Bot className="w-5 h-5 mr-2" />
          AI Assistant
          <ChevronUp className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-career-600 to-career-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Career Assistant</h3>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    isConfigured ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {isConfigured ? 'Online' : 'Demo Mode'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              className="text-white/80 hover:text-white hover:bg-white/20"
            >
              <ChevronDown className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="h-80 p-4" ref={scrollRef}>
          {!isConfigured && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  AI belum dikonfigurasi. Menjalankan dalam mode demo dengan respons simulasi.
                </p>
              </div>
            </div>
          )}

          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-career-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-career-600" />
              </div>
              <p className="text-slate-600 mb-4">Apa yang bisa saya bantu hari ini?</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(prompt);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-career-100 text-slate-600 hover:text-career-700 rounded-full text-sm transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-career-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="w-4 h-4 text-career-600" />
                      <span className="text-xs font-medium text-career-600">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-career-600 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-career-600 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-career-600 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-slate-200">
          {error && (
            <p className="text-xs text-red-500 mb-2">{error}</p>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pesan Anda..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-career-600 hover:bg-career-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={clearMessages}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Hapus riwayat
            </button>
            <p className="text-xs text-slate-400">
              Powered by GLM-4.7
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
