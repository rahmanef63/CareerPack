import { useState, useCallback } from 'react';
import { useAIConfig } from '@/features/ai-chat/hooks/useAIConfig';
import type { ChatMessage } from '@/types';

interface UseAIChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export function useAIChat(): UseAIChatReturn {
  const { config, isConfigured } = useAIConfig();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Halo! Saya adalah AI Career Assistant. Saya bisa membantu Anda dengan:\n\n• Menyusun CV yang menarik\n• Memberikan tips wawancara\n• Rekomendasi skill yang perlu dipelajari\n• Informasi tentang dunia kerja\n• Dan banyak lagi!\n\nAda yang bisa saya bantu?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!isConfigured) {
      setError('AI belum dikonfigurasi. Silakan hubungi admin untuk mengaktifkan fitur AI.');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Prepare messages for API
      const apiMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      apiMessages.push({ role: 'user', content });

      // Call GLM-4.7 API through our backend proxy
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          config: {
            model: config.model,
            temperature: config.temperature,
            max_tokens: config.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal mendapatkan respons dari AI');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'Maaf, saya tidak dapat memproses permintaan Anda.',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');

      // Fallback: Simulate AI response for demo
      setTimeout(() => {
        const fallbackMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: generateFallbackResponse(content),
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, fallbackMessage]);
        setError(null);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  }, [config, isConfigured, messages]);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Halo! Saya adalah AI Career Assistant. Ada yang bisa saya bantu?',
        timestamp: new Date().toISOString(),
      },
    ]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}

// Fallback response generator for demo
function generateFallbackResponse(userMessage: string): string {
  const lowerMsg = userMessage.toLowerCase();

  if (lowerMsg.includes('cv') || lowerMsg.includes('resume')) {
    return 'Untuk membuat CV yang menarik, pastikan:\n\n1. **Gunakan format yang rapi** - ATS-friendly\n2. **Highlight pencapaian** - Gunakan angka/statistik\n3. **Sesuaikan dengan job desc** - Keyword matching\n4. **Tambahkan portfolio** - Jika relevan\n5. **Proofread** - Cek typo dan grammar\n\nAnda bisa menggunakan fitur CV Generator kami untuk membuat CV profesional!';
  }

  if (lowerMsg.includes('wawancara') || lowerMsg.includes('interview')) {
    return 'Tips sukses wawancara kerja:\n\n1. **Riset perusahaan** - Visi, misi, produk\n2. **Latihan STAR method** - Situation, Task, Action, Result\n3. **Siapkan pertanyaan** - Tunjukkan antusiasme\n4. **Dress appropriately** - Sesuaikan kultur perusahaan\n5. **Datang 15 menit lebih awal**\n\nCoba fitur Mock Interview kami untuk latihan!';
  }

  if (lowerMsg.includes('skill') || lowerMsg.includes('belajar')) {
    return 'Untuk mengembangkan skill, saya sarankan:\n\n1. **Identifikasi skill gap** - Bandingkan dengan job requirements\n2. **Buat learning plan** - Gunakan Skill Roadmap kami\n3. **Praktik secara konsisten** - 1 jam per hari\n4. **Build portfolio projects** - Tunjukkan hasil kerja\n5. **Join komunitas** - Networking dan belajar bersama\n\nLihat Skill Roadmap kami untuk berbagai bidang karir!';
  }

  if (lowerMsg.includes('gaji') || lowerMsg.includes('salary')) {
    return 'Tips negosiasi gaji:\n\n1. **Riset market rate** - Gunakan Financial Calculator\n2. **Know your worth** - Skill dan pengalaman\n3. **Tunggu tawaran pertama** - Tapi siapkan range\n4. **Pertimbangkan total compensation** - Benefit, bonus, dll\n5. **Negosiasi dengan data** - Jangan malu-malu\n\nCek Salary Insights di Financial Calculator kami!';
  }

  return 'Terima kasih atas pertanyaannya! Saya dapat membantu Anda dengan:\n\n• Penyusunan CV dan portfolio\n• Persiapan wawancara kerja\n• Rekomendasi pengembangan skill\n• Informasi gaji dan benefit\n• Tips karir lainnya\n\nSilakan tanyakan lebih spesifik agar saya bisa membantu lebih baik. 😊';
}
