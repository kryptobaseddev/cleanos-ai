import { useAppStore } from "@/stores/app-store";
import { useTheme } from "@/hooks/useTheme";
import { useSystemInfo } from "@/hooks/useSystemInfo";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { FileExplorer } from "@/components/files/FileExplorer";
import { SystemCleanup } from "@/components/system/SystemCleanup";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { AiChat } from "@/components/ai-chat/AiChat";

function App() {
  const { currentView } = useAppStore();
  useTheme();
  useSystemInfo();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {currentView === "dashboard" && <Dashboard />}
          {currentView === "files" && <FileExplorer />}
          {currentView === "system" && <SystemCleanup />}
          {currentView === "ai-chat" && <AiChat />}
          {currentView === "settings" && <SettingsPage />}
        </main>
        <StatusBar />
      </div>
    </div>
  );
}

export default App;
