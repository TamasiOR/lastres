import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageReplySystem from '@/components/chat/MessageReplySystem';
import TypingIndicator from '@/components/chat/TypingIndicator';
import FileUpload from '@/components/chat/FileUpload';
import EnhancedEmojiPicker from '@/components/chat/EnhancedEmojiPicker';
import AdvancedTextStyler from '@/components/chat/AdvancedTextStyler';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import ChatOptionsMenu from '@/components/chat/ChatOptionsMenu';
import MessageOptionsMenu from '@/components/chat/MessageOptionsMenu';
import VoiceCallManager from '@/components/voice/VoiceCallManager';
import { 
  Send, Paperclip, Smile, Mic, Phone, Video, ArrowLeft, Shield, MapPin, Type, Settings
} from 'lucide-react';

export default function ChatArea() {
  const { activeChat, sendMessage, contacts, setActiveChat, typingUsers, setTyping } = useChat();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTextStyler, setShowTextStyler] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [isVoiceCallMinimized, setIsVoiceCallMinimized] = useState(false);
  const [chatSettings, setChatSettings] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const emojiButtonRef = useRef(null);

  const contact = contacts.find(c => activeChat?.participants.includes(c.id) && c.id !== user?.id);

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChat) return;
    try {
      await sendMessage(activeChat.id, message.trim());
      setMessage('');
      setTyping(activeChat.id, false);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleFileUpload = (fileData) => {
    if (!activeChat) return;
    const type = fileData.type;
    const meta = {
      fileName: fileData.name,
      fileSize: fileData.size,
      fileType: fileData.mimeType,
      previewUrl: fileData.previewUrl
    };
    const content = type === 'image' ? '' : `📎 ${fileData.name}`;
    sendMessage(activeChat.id, content, type, meta);
    setShowFileUpload(false);
  };

  const handleReply = (msg) => setReplyingTo(msg);
  const handleSendReply = async (replyData) => {
    if (!activeChat) return;
    try {
      await sendMessage(activeChat.id, replyData.content, replyData.type, replyData.meta);
      setReplyingTo(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to send reply', variant: 'destructive' });
    }
  };

  const handleVoiceNote = (blob) => {
    if (!activeChat) return;
    sendMessage(activeChat.id, '🎤 Voice message', 'voice', { audioUrl: URL.createObjectURL(blob) });
    setIsRecording(false);
  };

  if (!activeChat) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold">Select a Contact</h3>
          <p className="text-muted-foreground">Choose someone to start a conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative bg-background">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveChat(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
              {contact?.avatar || '👤'}
            </div>
            <div>
              <h3 className="font-semibold">{contact?.username || 'Unknown'}</h3>
              <p className="text-xs text-muted-foreground">{typingUsers[activeChat.id] ? 'Typing...' : 'Online'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setShowVoiceCall(true)}><Phone className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon"><Video className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setShowChatOptions(true)}><Settings className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <AnimatePresence>
          {activeChat.messages?.map((msg, i) => (
            <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id} contact={contact} previousMessage={activeChat.messages[i - 1]} onReply={handleReply} onShowOptions={setShowMessageOptions} />
          ))}
        </AnimatePresence>
        {typingUsers[activeChat.id] && typingUsers[activeChat.id] !== user?.id && <TypingIndicator contact={contact} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input ref={inputRef} value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." className="pr-12 resize-none" disabled={isRecording} />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <div className="relative">
                <Button ref={emojiButtonRef} type="button" variant="ghost" size="icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><Smile className="w-4 h-4" /></Button>
                <AnimatePresence>
                  {showEmojiPicker && (
                    <>
                      <div className="chat-emoji-backdrop" onClick={() => setShowEmojiPicker(false)} />
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }} transition={{ duration: 0.2 }} className="chat-emoji-picker">
                        <EnhancedEmojiPicker onEmojiSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => setShowTextStyler(true)}><Type className="w-4 h-4" /></Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => setShowFileUpload(true)}><Paperclip className="w-4 h-4" /></Button>
          <VoiceRecorder isRecording={isRecording} onStartRecording={() => setIsRecording(true)} onStopRecording={handleVoiceNote} />
          <Button type="submit" size="icon" disabled={!message.trim() || isRecording}><Send className="w-4 h-4" /></Button>
        </form>
      </div>

      {/* Modals */}
      <FileUpload isOpen={showFileUpload} onClose={() => setShowFileUpload(false)} onFileSelect={handleFileUpload} />
      <ChatOptionsMenu isOpen={showChatOptions} onClose={() => setShowChatOptions(false)} contact={contact} chatSettings={chatSettings} onUpdateSettings={setChatSettings} />
      <MessageOptionsMenu message={showMessageOptions} isOwn={showMessageOptions?.senderId === user?.id} isOpen={!!showMessageOptions} onClose={() => setShowMessageOptions(null)} onReply={handleReply} onQuote={() => {}} onDelete={() => {}} onEdit={() => {}} />
      <AdvancedTextStyler isOpen={showTextStyler} onClose={() => setShowTextStyler(false)} onApplyStyle={(data) => setMessage(data.text)} selectedText={message} />
      {showVoiceCall && <VoiceCallManager contact={contact} onEnd={() => setShowVoiceCall(false)} isMinimized={isVoiceCallMinimized} onToggleMinimize={() => setIsVoiceCallMinimized(!isVoiceCallMinimized)} />}
    </div>
  );
}