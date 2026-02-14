import { useAppStore } from "@/stores/app-store";
import { useTheme } from "@/hooks/useTheme";
import { useSystemInfo } from "@/hooks/useSystemInfo";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { FileExplorer } from "@/components/files/FileExplorer";
import { SystemCleanup } from "@/components/system/SystemCleanup";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { MessageSquare } from "lucide-react";

function AiChatPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-surface-400">
      <MessageSquare size={48} className="mb-4" />
      <h2 className="text-xl font-semibold">AI Chat</h2>
      <p className="mt-1 text-sm">Coming soon. Configure a provider in Settings first.</p>
    </div>
  );
}

function App() {
  const { currentView } = useAppStore();
  useTheme();
  useSystemInfo();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "files" && <FileExplorer />}
        {currentView === "system" && <SystemCleanup />}
        {currentView === "ai-chat" && <AiChatPlaceholder />}
        {currentView === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}

export default App;
