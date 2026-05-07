import { StudentSidebar } from "@/components/StudentSidebar";
import { ChatShell } from "@/components/chat/ChatShell";
import { AIChatPanel } from "@/components/AIChatPanel";

export default function StudentMessages() {
  return (
    <div className="min-h-screen bg-background flex">
      <StudentSidebar />
      <ChatShell primaryLabel="Admins" groupsLabel="My Groups" />
      <AIChatPanel />
    </div>
  );
}
