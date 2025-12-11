import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle,
  X,
  Send,
  Users,
  ChevronDown,
  Minimize2,
  Maximize2
} from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";

export function FloatingMessenger() {
  const { user } = useAuth();
  const { messages, contacts, loading, selectedContact, setSelectedContact, sendMessage } = useMessages();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && selectedContact) {
      scrollToBottom();
    }
  }, [messages, isOpen, selectedContact]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await sendMessage(newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const students = contacts.filter(c => c.type === 'user');
  const groups = contacts.filter(c => c.type === 'group');

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center z-50 animate-bounce-gentle"
        >
          <MessageCircle className="w-6 h-6" />
          {contacts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
              {contacts.length > 9 ? '9+' : contacts.length}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`fixed z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${
            isExpanded 
              ? 'bottom-4 right-4 left-4 top-4 md:left-auto md:w-[500px] md:h-[600px]'
              : 'bottom-6 right-6 w-80 h-[450px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="font-display font-semibold text-foreground">Messages</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!selectedContact ? (
            /* Contact List */
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading contacts...</p>
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No contacts yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Contacts will appear here when available</p>
                </div>
              ) : (
                <div className="p-2">
                  {/* Users/Admins */}
                  {students.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                        Direct Messages
                      </p>
                      {students.map(contact => (
                        <button
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="font-medium text-primary">{contact.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-foreground">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.email || 'Tap to chat'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Groups */}
                  {groups.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                        Groups
                      </p>
                      {groups.map(contact => (
                        <button
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
                            <Users className="w-5 h-5 text-secondary-foreground" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-foreground">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">Group chat</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Chat View */
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-3 border-b border-border">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedContact(null)}>
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </Button>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  {selectedContact.type === 'group' ? (
                    <Users className="w-4 h-4 text-primary" />
                  ) : (
                    <span className="text-sm font-medium text-primary">{selectedContact.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{selectedContact.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedContact.type === 'group' ? 'Group chat' : 'Online'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-auto p-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="w-10 h-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">No messages yet</p>
                    <p className="text-xs text-muted-foreground">Say hello! 👋</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}>
                        {selectedContact.type === 'group' && msg.sender_id !== user?.id && (
                          <p className="text-xs font-medium mb-1 opacity-70">{msg.sender_name}</p>
                        )}
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 rounded-full"
                  />
                  <Button 
                    size="icon" 
                    className="rounded-full h-10 w-10" 
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
