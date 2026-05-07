import { AdminSidebar } from "@/components/AdminSidebar";
import { ChatShell } from "@/components/chat/ChatShell";

export default function AdminMessages() {
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <ChatShell primaryLabel="Active Students" groupsLabel="Groups" />
    </div>
  );
}
