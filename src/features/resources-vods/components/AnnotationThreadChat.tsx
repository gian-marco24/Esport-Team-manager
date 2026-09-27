import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import type { VodAnnotation } from '../types';
import { useAnnotationChat } from '../hooks/useAnnotationChat';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface AnnotationThreadChatProps {
  annotation: VodAnnotation;
  onBack: () => void;
}

export const AnnotationThreadChat: React.FC<AnnotationThreadChatProps> = ({
  annotation,
  onBack,
}) => {
  const { messages, isSending, sendMessage } = useAnnotationChat(annotation);
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-[#140b21] border border-[#26143E] rounded-xl overflow-hidden shadow-xl animate-fadeIn">
      {/* Top Header */}
      <div className="p-3 bg-[#0D0914] border-b border-[#26143E] flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-[#E2B86E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Marcadores</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 bg-[#522B80] text-[#E2B86E] border border-[#E2B86E]/40 rounded font-mono text-[11px] font-bold">
            ⏱️ {annotation.timestampFormatted}
          </span>
        </div>
      </div>

      {/* Target Marker Summary Card */}
      <div className="p-3 bg-[#26143E]/40 border-b border-[#26143E] shrink-0 space-y-1">
        <div className="flex items-center space-x-2">
          <Badge variant="gold" className="text-[9px] px-1.5 py-0">
            {annotation.authorRole || 'Marcador'}
          </Badge>
          <span className="text-xs font-bold text-white">{annotation.authorName}</span>
        </div>
        <p className="text-xs text-gray-200 font-medium leading-relaxed">{annotation.title}</p>
      </div>

      {/* Live Chat Messages Scroll Container */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 space-y-1">
            <MessageSquare className="w-6 h-6 mx-auto text-gray-600" />
            <p className="text-xs text-gray-400">Aún no hay comentarios en este marcador.</p>
            <p className="text-[11px]">Escribe el primer mensaje a continuación.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="p-2.5 bg-[#0D0914]/80 border border-[#26143E] rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#522B80] flex items-center justify-center text-[10px] font-bold text-white">
                    {msg.authorName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-white">{msg.authorName}</span>
                  {msg.authorRole && (
                    <Badge variant="purple" className="text-[8px] px-1 py-0">
                      {msg.authorRole}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-gray-500">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-gray-200 leading-relaxed pl-6">{msg.text}</p>
            </div>
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-[#0D0914] border-t border-[#26143E] flex gap-2 shrink-0">
        <input
          type="text"
          placeholder="Escribe un comentario..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-[#180d29] border border-[#522B80]/60 rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#8B44F7]"
        />
        <Button type="submit" variant="secondary" size="sm" isLoading={isSending} className="px-3 shrink-0">
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
};
