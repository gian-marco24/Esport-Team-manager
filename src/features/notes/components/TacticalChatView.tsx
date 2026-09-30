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
  CheckSquare,
  Bold,
  Italic,
  Strikethrough,
  Quote,
  Code,
  ChevronRight,
  Plus,
  FileEdit,
  Clock,
} from 'lucide-react';
import { DEFAULT_TACTICAL_TAGS, type TacticalMessage, type TacticalTask } from '../types';
import { useNoteChannel } from '../hooks/useNoteChannel';
import { useNoteTasks } from '../hooks/useNoteTasks';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { uploadTacticalImage } from '../utils/imageUploadHelper';
import { ImageLightboxModal } from './ImageLightboxModal';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import { MarkdownContent } from '../utils/markdownRenderer';
import { formatDeadlineDisplay } from '../utils/dateHelpers';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface TacticalChatViewProps {
  channelId: string;
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  icon?: React.ReactNode;
  emptyPlaceholderMessage?: string;
  allowTasks?: boolean;
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
  allowTasks = false,
}) => {
  const { user } = useAuthContext();
  const {
    messages,
    isLoading: isMessagesLoading,
    isSending,
    sendMessage,
    deleteMessage,
    togglePin,
    toggleReaction,
  } = useNoteChannel(channelId);

  const {
    tasks,
    createTask,
    updateTask,
    deleteTask,
  } = useNoteTasks(channelId);

  const [inputText, setInputText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeReactionPickerFor, setActiveReactionPickerFor] = useState<string | null>(null);

  // Tasks sidebar and modals state
  const [isTasksPanelOpen, setIsTasksPanelOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<TacticalTask | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea to fit text nicely
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        Math.max(textareaRef.current.scrollHeight, 38),
        140
      )}px`;
    }
  }, [inputText]);

  // Smoothly scroll only the inner container down
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length, showPinnedOnly, channelId]);

  // Keep modal task synced with live tasks
  useEffect(() => {
    if (selectedTaskForModal) {
      const updated = tasks.find((t) => t.id === selectedTaskForModal.id);
      if (updated) setSelectedTaskForModal(updated);
    }
  }, [tasks]);

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

  // Format insertion in textarea
  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const current = inputText;
    const selected = current.substring(start, end);

    let replacement = '';
    if (prefix === '> ') {
      // Discord quote prefix
      replacement = `> ${selected || 'Cita o requerimiento'}`;
    } else {
      replacement = `${prefix}${selected || 'texto'}${suffix}`;
    }

    const nextText = current.substring(0, start) + replacement + current.substring(end);
    setInputText(nextText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          start + prefix.length,
          start + replacement.length - suffix.length
        );
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && selectedImages.length === 0) return;

    try {
      await sendMessage(inputText.trim(), selectedImages, selectedTags);
      setInputText('');
      setSelectedImages([]);
      setSelectedTags([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = '38px';
      }
    } catch (err) {
      // Handled in hook
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

      if (isSameAuthor && timeDiff < 8 && !msg.isPinned && !lastGroup.isPinned && !msg.isTask) {
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

  const isUserAllowedToManage =
    user?.teamRole === 'CEO' ||
    user?.teamRole === 'Coach' ||
    user?.teamRole === 'Manager' ||
    user?.role === 'ceo' ||
    user?.role === 'coach';

  const pendingTasksCount = tasks.filter((t) => t.status !== 'completed').length;

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'pending') return tasks.filter((t) => t.status !== 'completed');
    if (taskFilter === 'completed') return tasks.filter((t) => t.status === 'completed');
    return tasks;
  }, [tasks, taskFilter]);

  return (
    <div
      onPaste={handlePaste}
      className="flex flex-col h-full bg-[#140b21] border border-[#26143E] rounded-2xl overflow-hidden shadow-xl relative"
    >
      {/* Lightbox Modal */}
      <ImageLightboxModal imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />

      {/* Big Task Detail Modal */}
      <TaskDetailModal
        task={selectedTaskForModal}
        isOpen={Boolean(selectedTaskForModal)}
        onClose={() => setSelectedTaskForModal(null)}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSubmit={createTask}
      />

      {/* Top Header */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-[#180d29] via-[#26143E]/60 to-[#180d29] border-b border-[#26143E] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E] shrink-0">
            {icon || <MessageSquare className="w-3.5 h-3.5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 truncate">
              <h3 className="text-xs sm:text-sm font-black text-white tracking-wide truncate">
                {title}
              </h3>
              {badgeLabel && (
                <Badge variant="gold" className="text-[8.5px] px-1.5 py-0 font-bold shrink-0">
                  {badgeLabel}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-[10.5px] text-gray-400 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Header Controls: Tareas button, Pinned toggle, message counter */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {allowTasks && (
            <button
              onClick={() => setIsTasksPanelOpen(!isTasksPanelOpen)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 border transition-all ${
                isTasksPanelOpen
                  ? 'bg-[#8B44F7] text-white border-[#E2B86E] shadow-md shadow-[#8B44F7]/30'
                  : pendingTasksCount > 0
                  ? 'bg-amber-950/40 text-[#E2B86E] border-amber-500/50 hover:bg-[#522B80]'
                  : 'bg-[#180d29] text-gray-300 border-[#522B80]/60 hover:bg-[#26143E]'
              }`}
              title="Abrir panel lateral de tareas y análisis"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#E2B86E]" />
              <span>Tareas</span>
              {pendingTasksCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#E2B86E] text-black text-[9px] font-black flex items-center justify-center">
                  {pendingTasksCount}
                </span>
              )}
            </button>
          )}

          {pinnedMessages.length > 0 && (
            <button
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold flex items-center space-x-1 border transition-all ${
                showPinnedOnly
                  ? 'bg-[#E2B86E] text-black border-[#E2B86E]'
                  : 'bg-[#26143E] text-[#E2B86E] border-[#E2B86E]/40 hover:bg-[#522B80]'
              }`}
            >
              <Pin className="w-3 h-3 fill-current" />
              <span>{showPinnedOnly ? 'Todos' : `Fijados (${pinnedMessages.length})`}</span>
            </button>
          )}

          <span className="hidden sm:inline-block px-2 py-0.5 bg-[#180d29] border border-[#522B80]/40 rounded text-[10px] text-gray-400 font-mono">
            {messages.length} msg
          </span>
        </div>
      </div>

      {/* Pinned Quick Banner */}
      {!showPinnedOnly && pinnedMessages.length > 0 && (
        <div className="px-3 py-1 bg-amber-950/20 border-b border-amber-500/20 flex items-center justify-between text-[11px] text-[#E2B86E] shrink-0">
          <div className="flex items-center space-x-1.5 truncate">
            <Pin className="w-3 h-3 text-amber-400 fill-current shrink-0" />
            <span className="font-bold text-white text-[10.5px]">Fijado:</span>
            <span className="truncate text-gray-300 text-[10.5px]">
              {pinnedMessages[pinnedMessages.length - 1].content || 'Apunte / Tarea fijada'}
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

      {/* Main Container Body: Chat Area + Optional Tasks Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Messages Scroll Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 p-2.5 sm:p-3.5 overflow-y-auto space-y-2.5 select-text"
        >
          {isMessagesLoading ? (
            <div className="py-12 text-center text-xs text-gray-400 space-y-2">
              <div className="w-5 h-5 border-2 border-[#8B44F7] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-[11px]">Cargando notas...</p>
            </div>
          ) : groupedMessageBlocks.length === 0 ? (
            <div className="py-12 text-center text-gray-500 space-y-1.5 max-w-xs mx-auto">
              <div className="w-8 h-8 rounded-xl bg-[#180d29] border border-[#26143E] flex items-center justify-center mx-auto text-gray-600">
                <Sparkles className="w-4 h-4 text-[#8B44F7]/60" />
              </div>
              <h4 className="text-xs font-bold text-gray-300">Sin mensajes aún</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">{emptyPlaceholderMessage}</p>
            </div>
          ) : (
            groupedMessageBlocks.map((group) => {
              const isMe = user?.id === group.authorId;
              const canDeleteGeneral = isMe || isUserAllowedToManage;

              return (
                <div
                  key={group.id}
                  className={`relative rounded-xl border transition-all p-2.5 space-y-2 ${
                    group.isPinned
                      ? 'bg-gradient-to-r from-amber-950/20 to-[#180d29] border-amber-500/40 shadow-sm'
                      : isMe
                      ? 'bg-[#1b102f]/90 border-[#522B80]/70'
                      : 'bg-[#180d29]/90 border-[#26143E]'
                  }`}
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#8B44F7] to-[#522B80] flex items-center justify-center text-[9px] font-bold text-white shadow shrink-0">
                        {group.authorName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[11.5px] font-bold text-white">{group.authorName}</span>
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
                          className="text-[7.5px] px-1 py-0 font-bold"
                        >
                          {group.authorRole}
                        </Badge>
                      )}
                    </div>

                    <span className="text-[9.5px] text-gray-500 font-mono">
                      {new Date(group.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Messages List Inside Group */}
                  <div className="space-y-2">
                    {group.messages.map((msg) => {
                      const linkedTask = msg.taskId
                        ? tasks.find((t) => t.id === msg.taskId)
                        : null;

                      return (
                        <div key={msg.id} className="group/msg relative space-y-1">
                          {/* Task / Pinned Tag Indicators */}
                          {msg.isTask && (
                            <div className="flex items-center justify-between p-1.5 rounded-lg bg-gradient-to-r from-[#522B80]/40 to-amber-950/20 border border-[#E2B86E]/40 text-[10px]">
                              <div className="flex items-center space-x-1 text-[#E2B86E] font-bold">
                                <CheckSquare className="w-3 h-3" />
                                <span>TAREA ASIGNADA</span>
                              </div>
                              <button
                                onClick={() => {
                                  if (linkedTask) {
                                    setSelectedTaskForModal(linkedTask);
                                  } else if (msg.taskData) {
                                    setSelectedTaskForModal(msg.taskData as TacticalTask);
                                  }
                                }}
                                className="text-[9.5px] font-bold text-[#E2B86E] hover:underline flex items-center gap-0.5"
                              >
                                <FileEdit className="w-2.5 h-2.5" />
                                <span>Ver Anotaciones / Detalle</span>
                              </button>
                            </div>
                          )}

                          {!msg.isTask && msg.isPinned && (
                            <div className="flex items-center space-x-1 text-[8.5px] font-bold text-amber-400">
                              <Pin className="w-2.5 h-2.5 fill-current" />
                              <span>APUNTE FIJADO</span>
                            </div>
                          )}

                          {/* Tactical Tags */}
                          {msg.tags && msg.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {msg.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-[#26143E] border border-[#8B44F7]/40 rounded text-[8.5px] font-bold text-[#E2B86E]"
                                >
                                  <Tag className="w-2 h-2" />
                                  <span>{tag}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Text content rendered with Markdown support */}
                          <div className="flex items-start justify-between gap-2">
                            {msg.content && (
                              <div className="flex-1 min-w-0 text-gray-200">
                                <MarkdownContent content={msg.content} />
                              </div>
                            )}

                            {/* Inline Actions (Hover) */}
                            <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center space-x-0.5 shrink-0 pt-0.5">
                              {isUserAllowedToManage && (
                                <button
                                  onClick={() => togglePin(msg.id, Boolean(msg.isPinned))}
                                  className={`p-1 rounded hover:bg-[#26143E] transition-colors ${
                                    msg.isPinned
                                      ? 'text-amber-400'
                                      : 'text-gray-400 hover:text-amber-400'
                                  }`}
                                  title={msg.isPinned ? 'Desfijar' : 'Fijar'}
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
                                    if (confirm('¿Eliminar este mensaje?')) deleteMessage(msg.id);
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                              {msg.images.map((imgUrl, i) => (
                                <div
                                  key={i}
                                  onClick={() => setLightboxImage(imgUrl)}
                                  className="group/img relative rounded-lg overflow-hidden border border-[#522B80]/60 bg-black/40 cursor-pointer max-h-40 flex items-center justify-center hover:border-[#E2B86E] transition-all"
                                >
                                  <img
                                    src={imgUrl}
                                    alt="Estrategia / Apunte"
                                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center space-x-1 text-white text-[10px] font-bold backdrop-blur-[2px]">
                                    <Eye className="w-3 h-3 text-[#E2B86E]" />
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
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {Object.entries(msg.reactions).map(([emoji, users]) => {
                                const hasReacted = Boolean(user && users.includes(user.id));
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => toggleReaction(msg.id, emoji)}
                                    className={`inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-full text-[9.5px] border transition-all ${
                                      hasReacted
                                        ? 'bg-[#522B80] border-[#E2B86E] text-white font-bold'
                                        : 'bg-[#180d29] border-[#522B80]/40 text-gray-300 hover:bg-[#26143E]'
                                    }`}
                                  >
                                    <span>{emoji}</span>
                                    <span className="text-[8.5px] font-mono">{users.length}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Sidebar: Mini barra lateral de Tareas (30% - 40% width) */}
        {allowTasks && isTasksPanelOpen && (
          <div className="w-[320px] sm:w-[35%] md:w-[38%] border-l border-[#26143E] bg-[#0D0914] flex flex-col shrink-0 animate-fade-in z-20">
            {/* Sidebar Header */}
            <div className="p-3 bg-[#140b21] border-b border-[#26143E] flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <CheckSquare className="w-4 h-4 text-[#E2B86E]" />
                <h4 className="text-xs font-black text-white">Tareas del Chat</h4>
                <span className="px-1.5 py-0.2 rounded bg-[#522B80] text-[9px] font-mono font-bold text-white">
                  {tasks.length}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsCreateTaskModalOpen(true)}
                  className="p-1 rounded-lg bg-[#522B80]/60 hover:bg-[#522B80] text-[#E2B86E] hover:text-white transition-colors"
                  title="Asignar nueva tarea"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsTasksPanelOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#26143E] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center border-b border-[#26143E] p-1 bg-[#140b21]/50 text-[10px]">
              <button
                onClick={() => setTaskFilter('all')}
                className={`flex-1 py-1 text-center rounded-md font-bold transition-all ${
                  taskFilter === 'all'
                    ? 'bg-[#522B80] text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Todas ({tasks.length})
              </button>
              <button
                onClick={() => setTaskFilter('pending')}
                className={`flex-1 py-1 text-center rounded-md font-bold transition-all ${
                  taskFilter === 'pending'
                    ? 'bg-[#522B80] text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Pendientes ({tasks.filter((t) => t.status !== 'completed').length})
              </button>
              <button
                onClick={() => setTaskFilter('completed')}
                className={`flex-1 py-1 text-center rounded-md font-bold transition-all ${
                  taskFilter === 'completed'
                    ? 'bg-[#522B80] text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Completadas ({tasks.filter((t) => t.status === 'completed').length})
              </button>
            </div>

            {/* Task Cards List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="py-8 text-center text-gray-500 space-y-2">
                  <CheckSquare className="w-6 h-6 mx-auto text-gray-600" />
                  <p className="text-[11px]">No hay tareas en esta vista.</p>
                  <button
                    onClick={() => setIsCreateTaskModalOpen(true)}
                    className="text-[10px] text-[#E2B86E] font-bold hover:underline"
                  >
                    + Asignar primera tarea
                  </button>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskForModal(task)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 hover:scale-[1.01] ${
                      task.status === 'completed'
                        ? 'bg-[#140b21]/60 border-emerald-500/30 opacity-75'
                        : 'bg-[#180d29] border-[#522B80]/60 hover:border-[#E2B86E]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                          task.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : task.status === 'in_progress'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {task.status === 'completed'
                          ? '✓ Completada'
                          : task.status === 'in_progress'
                          ? 'En Progreso'
                          : 'Pendiente'}
                      </span>

                      {task.deadline && (
                        <span className="text-[9px] text-amber-400 font-mono flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDeadlineDisplay(task.deadline)}
                        </span>
                      )}
                    </div>

                    <h5 className="text-[11.5px] font-bold text-white line-clamp-2 leading-snug">
                      {task.title}
                    </h5>

                    <div className="flex items-center justify-between text-[9px] text-gray-400 pt-1 border-t border-white/[0.05]">
                      <span className="truncate">Por: {task.authorName}</span>
                      <span className="text-[#E2B86E] font-semibold flex items-center gap-0.5">
                        {task.annotations ? 'Anotaciones ✓' : 'Sin anotaciones'}
                        <ChevronRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sidebar Bottom Action */}
            <div className="p-2 border-t border-[#26143E] bg-[#140b21]">
              <button
                onClick={() => setIsCreateTaskModalOpen(true)}
                className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#522B80] to-[#26143E] hover:from-[#8B44F7] hover:to-[#522B80] text-white text-xs font-bold border border-[#E2B86E]/40 flex items-center justify-center space-x-1.5 transition-all shadow-md"
              >
                <Plus className="w-3.5 h-3.5 text-[#E2B86E]" />
                <span>Nueva Tarea / VOD</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Input Form */}
      <form
        onSubmit={handleSend}
        className="p-2 bg-[#0D0914] border-t border-[#26143E] space-y-1.5 shrink-0"
      >
        {/* Formatting & Tags Top Mini-Toolbar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          {/* Markdown Quick Format Buttons */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              className="p-1 rounded bg-[#180d29] hover:bg-[#26143E] text-gray-300 hover:text-white border border-[#522B80]/40 transition-colors"
              title="Negrita (**texto**)"
            >
              <Bold className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*')}
              className="p-1 rounded bg-[#180d29] hover:bg-[#26143E] text-gray-300 hover:text-white border border-[#522B80]/40 transition-colors"
              title="Cursiva (*texto*)"
            >
              <Italic className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('~~', '~~')}
              className="p-1 rounded bg-[#180d29] hover:bg-[#26143E] text-gray-300 hover:text-white border border-[#522B80]/40 transition-colors"
              title="Tachado (~~texto~~)"
            >
              <Strikethrough className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('> ')}
              className="p-1 rounded bg-[#180d29] hover:bg-[#26143E] text-[#E2B86E] hover:text-white border border-[#522B80]/40 transition-colors"
              title="Cita con barra vertical estilo Discord (> texto)"
            >
              <Quote className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('`', '`')}
              className="p-1 rounded bg-[#180d29] hover:bg-[#26143E] text-gray-300 hover:text-white border border-[#522B80]/40 transition-colors"
              title="Código (`código`)"
            >
              <Code className="w-3 h-3" />
            </button>

            {allowTasks && (
              <button
                type="button"
                onClick={() => setIsCreateTaskModalOpen(true)}
                className="px-1.5 py-0.5 rounded bg-gradient-to-r from-[#522B80] to-[#26143E] hover:from-[#8B44F7] hover:to-[#522B80] text-[#E2B86E] border border-[#E2B86E]/40 text-[9px] font-bold flex items-center gap-1 transition-all"
                title="Asignar tarea en este chat"
              >
                <CheckSquare className="w-2.5 h-2.5" />
                <span>+ Tarea</span>
              </button>
            )}
          </div>

          {/* Tactical Quick Tags Bar */}
          <div className="flex items-center space-x-1 shrink-0">
            {DEFAULT_TACTICAL_TAGS.slice(0, 6).map((tag) => {
              const isSelected = selectedTags.includes(tag.label);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTagSelection(tag.label)}
                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold shrink-0 transition-all border ${
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
        </div>

        {/* Selected Images Previews */}
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

        {/* Input Controls Bar: File Upload + Auto-Expanding Textarea + Send */}
        <div className="flex items-end space-x-1.5">
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
            className="p-2 bg-[#180d29] hover:bg-[#26143E] border border-[#522B80]/60 rounded-xl text-gray-300 hover:text-[#E2B86E] transition-colors shrink-0 disabled:opacity-50 mb-0.5"
            title="Adjuntar imagen táctica (o pega con Ctrl+V)"
          >
            {isUploadingImage ? (
              <div className="w-3.5 h-3.5 border-2 border-[#E2B86E] border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Dynamic Auto-Expanding Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un apunte (Shift+Enter para nueva línea, > para citas)..."
              className="w-full bg-[#180d29] border border-[#522B80]/60 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8B44F7] resize-none overflow-y-auto leading-relaxed"
              style={{ minHeight: '38px', maxHeight: '140px' }}
            />
          </div>

          {/* Send Button */}
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            isLoading={isSending}
            disabled={!inputText.trim() && selectedImages.length === 0}
            className="px-3 py-2 shrink-0 mb-0.5"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
};
