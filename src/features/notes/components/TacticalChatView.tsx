import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Image as ImageIcon,
  Pin,
  Trash2,
  Smile,
  Sparkles,
  X,
  MessageSquare,
  Tag,
  Eye,
} from 'lucide-react';
import { DEFAULT_TACTICAL_TAGS, type TacticalMessage } from '../types';
import { useNoteChannel } from '../hooks/useNoteChannel';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { uploadTacticalImage } from '../utils/imageUploadHelper';
import { ImageLightboxModal } from './ImageLightboxModal';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface TacticalChatViewProps {
  channelId: string;
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  icon?: React.ReactNode;
  emptyPlaceholderMessage?: string;
}

interface MessageGroup {
  id: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  createdAt: string;
  isPinned: boolean;
  messages: TacticalMessage[];
}

const EMOJI_REACTIONS = ['🔥', '🎯', '👍', '💡', '🛡️', '⚔️'];

export const TacticalChatView: React.FC<TacticalChatViewProps> = ({
  channelId,
  title,
  subtitle,
  badgeLabel,
  icon,
  emptyPlaceholderMessage = 'Aún no hay apuntes tácticos o mensajes en esta sección.',
}) => {
  const { user } = useAuthContext();
  const {
    messages,
    isLoading,
    isSending,
    sendMessage,
    deleteMessage,
    togglePin,
    toggleReaction,
  } = useNoteChannel(channelId);

  const [inputText, setInputText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeReactionPickerFor, setActiveReactionPickerFor] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Smoothly scroll only the inner container down without scrolling the whole window
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length, showPinnedOnly, channelId]);

  // Handle paste image from clipboard
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await handleUploadFile(file);
        }
      }
    }
  };

  const handleUploadFile = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const url = await uploadTacticalImage(file);
      setSelectedImages((prev) => [...prev, url]);
    } catch (err: any) {
      alert(err.message || 'Error al procesar la imagen');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      await handleUploadFile(files[i]);
    }
    e.target.value = '';
  };

  const toggleTagSelection = (tagLabel: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagLabel) ? prev.filter((t) => t !== tagLabel) : [...prev, tagLabel]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && selectedImages.length === 0) return;

    try {
      await sendMessage(inputText.trim(), selectedImages, selectedTags);
      setInputText('');
      setSelectedImages([]);
      setSelectedTags([]);
    } catch (err) {
      // Error handled in hook
    }
  };

  const pinnedMessages = messages.filter((m) => m.isPinned);
  const displayedMessages = showPinnedOnly ? pinnedMessages : messages;

  // Group consecutive messages by the same author sent within 8 minutes
  const groupedMessageBlocks = useMemo(() => {
    const groups: MessageGroup[] = [];

    displayedMessages.forEach((msg) => {
      const lastGroup = groups[groups.length - 1];
      const isSameAuthor = lastGroup && lastGroup.authorId === msg.authorId;
      const timeDiff = lastGroup
        ? (new Date(msg.createdAt).getTime() - new Date(lastGroup.createdAt).getTime()) / 60000
        : 999;

      // Group together if same author within 8 mins and neither is pinned individually
      if (isSameAuthor && timeDiff < 8 && !msg.isPinned && !lastGroup.isPinned) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({
          id: msg.id,
          authorId: msg.authorId,
          authorName: msg.authorName,
          authorRole: msg.authorRole,
          authorAvatar: msg.authorAvatar,
          createdAt: msg.createdAt,
          isPinned: Boolean(msg.isPinned),
          messages: [msg],
        });
      }
    });

    return groups;
  }, [displayedMessages]);

  const isUserAllowedToManagePins =
    user?.teamRole === 'CEO' ||
    user?.teamRole === 'Coach' ||
    user?.teamRole === 'Manager' ||
    user?.role === 'ceo' ||
    user?.role === 'coach';

  return (
    <div
      onPaste={handlePaste}
      className="flex flex-col h-full bg-[#140b21] border border-[#26143E] rounded-2xl overflow-hidden shadow-xl relative"
    >
      {/* Lightbox Modal */}
      <ImageLightboxModal imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />

      {/* Top Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#180d29] via-[#26143E]/50 to-[#180d29] border-b border-[#26143E] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E] shrink-0">
            {icon || <MessageSquare className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 truncate">
              <h3 className="text-xs sm:text-sm font-black text-white tracking-wide truncate">
                {title}
              </h3>
              {badgeLabel && (
                <Badge variant="gold" className="text-[9px] px-1.5 py-0 font-bold shrink-0">
                  {badgeLabel}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-gray-400 truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Pinned toggle and stats */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {pinnedMessages.length > 0 && (
            <button
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center space-x-1 border transition-all ${
                showPinnedOnly
                  ? 'bg-[#E2B86E] text-black border-[#E2B86E] shadow-md shadow-[#E2B86E]/20'
                  : 'bg-[#26143E] text-[#E2B86E] border-[#E2B86E]/40 hover:bg-[#522B80]'
              }`}
            >
              <Pin className="w-3 h-3 fill-current" />
              <span>{showPinnedOnly ? 'Todos' : `Destacados (${pinnedMessages.length})`}</span>
            </button>
          )}

          <span className="px-2 py-0.5 bg-[#180d29] border border-[#522B80]/40 rounded text-[10px] text-gray-400 font-mono">
            {messages.length} msg
          </span>
        </div>
      </div>

      {/* Pinned Quick Banner (if any pinned and not currently filtering pinned) */}
      {!showPinnedOnly && pinnedMessages.length > 0 && (
        <div className="px-3 py-1.5 bg-amber-950/20 border-b border-amber-500/20 flex items-center justify-between text-[11px] text-[#E2B86E] shrink-0">
          <div className="flex items-center space-x-1.5 truncate">
            <Pin className="w-3 h-3 text-amber-400 fill-current shrink-0" />
            <span className="font-bold text-white">Fijado:</span>
            <span className="truncate text-gray-300">
              {pinnedMessages[pinnedMessages.length - 1].content || 'Imagen / Apunte fijado'}
            </span>
          </div>
          <button
            onClick={() => setShowPinnedOnly(true)}
            className="text-[10px] font-bold text-amber-400 hover:underline shrink-0 ml-2"
          >
            Ver ({pinnedMessages.length})
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[160px] select-text"
      >
        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-400 space-y-2">
            <div className="w-5 h-5 border-2 border-[#8B44F7] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[11px]">Cargando notas...</p>
          </div>
        ) : groupedMessageBlocks.length === 0 ? (
          <div className="py-12 text-center text-gray-500 space-y-1.5 max-w-xs mx-auto">
            <div className="w-9 h-9 rounded-xl bg-[#180d29] border border-[#26143E] flex items-center justify-center mx-auto text-gray-600">
              <Sparkles className="w-4 h-4 text-[#8B44F7]/60" />
            </div>
            <h4 className="text-xs font-bold text-gray-300">Sin mensajes aún</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">{emptyPlaceholderMessage}</p>
          </div>
        ) : (
          groupedMessageBlocks.map((group) => {
            const isMe = user?.id === group.authorId;
            const canDeleteGeneral = isMe || isUserAllowedToManagePins;

            return (
              <div
                key={group.id}
                className={`relative rounded-2xl border transition-all p-3 space-y-2.5 ${
                  group.isPinned
                    ? 'bg-gradient-to-r from-amber-950/25 to-[#180d29] border-amber-500/40 shadow-sm'
                    : isMe
                    ? 'bg-[#1b102f]/90 border-[#522B80]/70'
                    : 'bg-[#180d29]/90 border-[#26143E]'
                }`}
              >
                {/* Author Header */}
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#8B44F7] to-[#522B80] flex items-center justify-center text-[10px] font-bold text-white shadow shrink-0">
                      {group.authorName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-white">{group.authorName}</span>
                    {group.authorRole && (
                      <Badge
                        variant={
                          group.authorRole === 'CEO'
                            ? 'gold'
                            : group.authorRole.includes('Coach')
                            ? 'purple'
                            : group.authorRole.includes('Titular')
                            ? 'gold'
                            : 'dark'
                        }
                        className="text-[8px] px-1.5 py-0 font-bold"
                      >
                        {group.authorRole}
                      </Badge>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(group.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Messages List Inside This Author's Group Card */}
                <div className="space-y-2">
                  {group.messages.map((msg) => (
                    <div key={msg.id} className="group/msg relative space-y-1.5">
                      {/* Pinned Tag Indicator if individual msg is pinned */}
                      {msg.isPinned && (
                        <div className="flex items-center space-x-1 text-[9px] font-bold text-amber-400">
                          <Pin className="w-2.5 h-2.5 fill-current" />
                          <span>APUNTE TÁCTICO FIJADO</span>
                        </div>
                      )}

                      {/* Tactical Tags */}
                      {msg.tags && msg.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {msg.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-[#26143E] border border-[#8B44F7]/40 rounded text-[9px] font-bold text-[#E2B86E]"
                            >
                              <Tag className="w-2 h-2" />
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Text content & Hover Actions */}
                      <div className="flex items-start justify-between gap-3">
                        {msg.content && (
                          <p className="text-xs sm:text-[13px] text-gray-200 leading-relaxed whitespace-pre-wrap font-sans flex-1">
                            {msg.content}
                          </p>
                        )}

                        {/* Inline Actions (Hover) */}
                        <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center space-x-1 shrink-0 pt-0.5">
                          {isUserAllowedToManagePins && (
                            <button
                              onClick={() => togglePin(msg.id, Boolean(msg.isPinned))}
                              className={`p-1 rounded hover:bg-[#26143E] transition-colors ${
                                msg.isPinned
                                  ? 'text-amber-400'
                                  : 'text-gray-400 hover:text-amber-400'
                              }`}
                              title={msg.isPinned ? 'Desfijar apunte' : 'Fijar apunte'}
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            onClick={() =>
                              setActiveReactionPickerFor(
                                activeReactionPickerFor === msg.id ? null : msg.id
                              )
                            }
                            className="p-1 text-gray-400 hover:text-yellow-400 rounded hover:bg-[#26143E] transition-colors"
                            title="Reaccionar"
                          >
                            <Smile className="w-3 h-3" />
                          </button>

                          {canDeleteGeneral && (
                            <button
                              onClick={() => {
                                if (confirm('¿Eliminar este apunte?')) deleteMessage(msg.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-400 rounded hover:bg-red-950/40 transition-colors"
                              title="Eliminar mensaje"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Attached Images */}
                      {msg.images && msg.images.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {msg.images.map((imgUrl, i) => (
                            <div
                              key={i}
                              onClick={() => setLightboxImage(imgUrl)}
                              className="group/img relative rounded-xl overflow-hidden border border-[#522B80]/60 bg-black/40 cursor-pointer max-h-48 flex items-center justify-center hover:border-[#E2B86E] transition-all"
                            >
                              <img
                                src={imgUrl}
                                alt="Estrategia / Apunte"
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center space-x-1 text-white text-[11px] font-bold backdrop-blur-[2px]">
                                <Eye className="w-3.5 h-3.5 text-[#E2B86E]" />
                                <span>Ampliar</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reaction Picker Popup */}
                      {activeReactionPickerFor === msg.id && (
                        <div className="absolute right-0 -top-7 z-30 bg-[#140b21] border border-[#522B80] rounded-xl p-1 flex items-center space-x-1 shadow-2xl animate-fade-in">
                          {EMOJI_REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                toggleReaction(msg.id, emoji);
                                setActiveReactionPickerFor(null);
                              }}
                              className="p-1 hover:bg-[#26143E] rounded text-xs transition-transform hover:scale-125"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Emoji Reactions Bar */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {Object.entries(msg.reactions).map(([emoji, users]) => {
                            const hasReacted = Boolean(user && users.includes(user.id));
                            return (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(msg.id, emoji)}
                                className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[10px] border transition-all ${
                                  hasReacted
                                    ? 'bg-[#522B80] border-[#E2B86E] text-white font-bold'
                                    : 'bg-[#180d29] border-[#522B80]/40 text-gray-300 hover:bg-[#26143E]'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="text-[9px] font-mono">{users.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Input Form */}
      <form
        onSubmit={handleSend}
        className="p-2.5 bg-[#0D0914] border-t border-[#26143E] space-y-2 shrink-0"
      >
        {/* Tactical Quick Tags Bar */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider shrink-0 mr-1">
            Etiquetas:
          </span>
          {DEFAULT_TACTICAL_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag.label);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTagSelection(tag.label)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-[#8B44F7] text-white border-[#E2B86E]'
                    : 'bg-[#180d29] text-gray-400 border-[#26143E] hover:border-[#8B44F7] hover:text-gray-200'
                }`}
              >
                +{tag.label}
              </button>
            );
          })}
        </div>

        {/* Selected Images Previews before sending */}
        {selectedImages.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-[#180d29] rounded-xl border border-[#522B80]/40">
            {selectedImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#8B44F7] shrink-0"
              >
                <img src={imgUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setSelectedImages((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Controls Bar */}
        <div className="flex items-center space-x-1.5">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Attach Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage}
            className="p-2 bg-[#180d29] hover:bg-[#26143E] border border-[#522B80]/60 rounded-xl text-gray-300 hover:text-[#E2B86E] transition-colors shrink-0 disabled:opacity-50"
            title="Adjuntar imagen táctica (o pega con Ctrl+V)"
          >
            {isUploadingImage ? (
              <div className="w-3.5 h-3.5 border-2 border-[#E2B86E] border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Main Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe un apunte o pega una imagen (Ctrl+V)..."
            className="flex-1 bg-[#180d29] border border-[#522B80]/60 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8B44F7]"
          />

          {/* Send Button */}
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            isLoading={isSending}
            disabled={!inputText.trim() && selectedImages.length === 0}
            className="px-3 py-2 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
};
