import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Users, MessageSquare, Search, Paperclip, X, FileText } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { MathRenderer } from "@/components/MathRenderer";
import { useToast } from "@/hooks/use-toast";

interface ChatShellProps {
  /** Section title for the user/student list */
  primaryLabel: string;
  /** Section title for groups list */
  groupsLabel?: string;
}

export function ChatShell({ primaryLabel, groupsLabel = "Groups" }: ChatShellProps) {
  const { user } = useAuth();
  const { messages, contacts, loading, selectedContact, setSelectedContact, sendMessage, uploadAttachment } = useMessages();
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() && !pendingFile) return;
    setSending(true);
    try {
      let attachment: { url: string; name: string; type: string } | undefined;
      if (pendingFile) {
        const uploaded = await uploadAttachment(pendingFile);
        if (!uploaded) {
          toast({ title: "Upload failed", description: "Could not upload attachment.", variant: "destructive" });
          setSending(false);
          return;
        }
        attachment = uploaded;
      }
      await sendMessage(newMessage, attachment);
      setNewMessage("");
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const users = filtered.filter((c) => c.type === "user");
  const groups = filtered.filter((c) => c.type === "group");

  return (
    <div className="flex-1 flex">
      {/* Contacts Panel */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : (
            <>
              <div className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {primaryLabel} ({users.length})
                </h3>
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No contacts found</p>
                ) : (
                  <div className="space-y-1">
                    {users.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          selectedContact?.id === contact.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="relative">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedContact?.id === contact.id ? "bg-primary-foreground/20" : "bg-secondary"
                            }`}
                          >
                            <span className="font-medium">{contact.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                              contact.online ? "bg-green-500" : "bg-muted-foreground/40"
                            }`}
                            aria-label={contact.online ? "Online" : "Offline"}
                          />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium truncate">{contact.name}</p>
                          <p
                            className={`text-xs truncate ${
                              selectedContact?.id === contact.id
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {contact.online ? "Online" : "Offline"}
                            {contact.email ? ` · ${contact.email}` : ""}
                          </p>
                        </div>
                        {contact.unread && contact.unread > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-destructive text-destructive-foreground">
                            {contact.unread > 99 ? "99+" : contact.unread}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {groupsLabel} ({groups.length})
                </h3>
                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No groups yet</p>
                ) : (
                  <div className="space-y-1">
                    {groups.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          selectedContact?.id === contact.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedContact?.id === contact.id ? "bg-primary-foreground/20" : "bg-secondary"
                          }`}
                        >
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
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    {selectedContact.type === "group" ? (
                      <Users className="w-5 h-5 text-secondary-foreground" />
                    ) : (
                      <span className="font-medium text-secondary-foreground">
                        {selectedContact.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {selectedContact.type === "user" && (
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                        selectedContact.online ? "bg-green-500" : "bg-muted-foreground/40"
                      }`}
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedContact.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedContact.type === "group"
                      ? "Group Chat"
                      : selectedContact.online
                      ? "Online"
                      : "Offline"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const mine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          mine
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        {selectedContact.type === "group" && !mine && (
                          <p className="text-xs font-medium mb-1 opacity-70">{msg.sender_name}</p>
                        )}
                        {msg.attachment_url && (
                          <a
                            href={msg.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mb-2"
                          >
                            {msg.attachment_type?.startsWith("image/") ? (
                              <img
                                src={msg.attachment_url}
                                alt={msg.attachment_name || "attachment"}
                                className="rounded-lg max-h-60 max-w-full"
                              />
                            ) : (
                              <div
                                className={`flex items-center gap-2 p-2 rounded-md ${
                                  mine ? "bg-primary-foreground/10" : "bg-background/60"
                                }`}
                              >
                                <FileText className="w-4 h-4" />
                                <span className="text-sm truncate max-w-[200px]">
                                  {msg.attachment_name || "File"}
                                </span>
                              </div>
                            )}
                          </a>
                        )}
                        {msg.text && (
                          <div className="break-words">
                            <MathRenderer text={msg.text} />
                          </div>
                        )}
                        <p
                          className={`text-xs mt-1 ${
                            mine ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border bg-card">
              {pendingFile && (
                <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm">
                  <Paperclip className="w-4 h-4" />
                  <span className="flex-1 truncate">{pendingFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Remove attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 10 * 1024 * 1024) {
                        toast({
                          title: "File too large",
                          description: "Max attachment size is 10 MB.",
                          variant: "destructive",
                        });
                        return;
                      }
                      setPendingFile(f);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={sending || (!newMessage.trim() && !pendingFile)}
                  className="btn-hover"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
