import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send,
  Users,
  MessageSquare
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { AIChatPanel } from "@/components/AIChatPanel";

export default function StudentMessages() {
  const { user } = useAuth();
  const { messages, contacts, loading, selectedContact, setSelectedContact, sendMessage } = useMessages();
  const [newMessage, setNewMessage] = useState('');

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

  const admins = contacts.filter(c => c.type === 'user');
  const groups = contacts.filter(c => c.type === 'group');

  return (
    <div className="min-h-screen bg-background flex">
      <StudentSidebar />

      <div className="flex-1 flex">
        {/* Contacts Panel */}
        <div className="w-80 bg-card border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Messages</h2>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : (
              <>
                {/* Admin Contact */}
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Admin
                  </h3>
                  {admins.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No admin available</p>
                  ) : (
                    <div className="space-y-1">
                      {admins.map(contact => (
                        <button
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            selectedContact?.id === contact.id
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedContact?.id === contact.id ? 'bg-primary-foreground/20' : 'bg-secondary'
                          }`}>
                            <span className="font-medium">{contact.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium truncate">{contact.name}</p>
                            <p className={`text-xs truncate ${
                              selectedContact?.id === contact.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              Admin
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Groups Section */}
                <div className="p-4 border-t border-border">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    My Groups ({groups.length})
                  </h3>
                  {groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No groups yet</p>
                  ) : (
                    <div className="space-y-1">
                      {groups.map(contact => (
                        <button
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            selectedContact?.id === contact.id
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedContact?.id === contact.id ? 'bg-primary-foreground/20' : 'bg-secondary'
                          }`}>
                            <Users className="w-5 h-5" />
                          </div>
                          <p className="font-medium truncate">{contact.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col">
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">Choose a contact to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    {selectedContact.type === 'group' ? (
                      <Users className="w-5 h-5 text-secondary-foreground" />
                    ) : (
                      <span className="font-medium text-secondary-foreground">{selectedContact.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{selectedContact.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedContact.type === 'group' ? 'Group Chat' : 'Admin'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}>
                        {selectedContact.type === 'group' && msg.sender_id !== user?.id && (
                          <p className="text-xs font-medium mb-1 opacity-70">{msg.sender_name}</p>
                        )}
                        <p>{msg.text}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleSend} disabled={!newMessage.trim()} className="btn-hover">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <AIChatPanel />
    </div>
  );
}