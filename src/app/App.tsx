import { useState } from "react";
import LoginScreen from "../components/LoginScreen";
import { AirAChatLauncher } from "../components/AirAChatLauncher";
import { NavTabs, LoadingPulse } from "../components/motion";
import { useNexusData } from "../hooks/useNexusData";
import { isFirebaseConfigured } from "../lib/firebase";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";
import { AppShell } from "./AppShell";
import { TabContent } from "./TabContent";
import { APP_TABS } from "./tabConfig";
import type { AppTab } from "./types";

export default function App() {
  const useFirestore = isFirebaseConfigured();

  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    if (useFirestore) return null;
    const current = sessionStorage.getItem("company_nexus_session");
    if (current) return current;
    const legacy = sessionStorage.getItem("irapp_nexus_session");
    if (legacy) sessionStorage.setItem("company_nexus_session", legacy);
    return legacy || null;
  });

  const nexus = useNexusData(sessionToken);
  const isAuthenticated = useFirestore ? Boolean(nexus.firebaseUser) : Boolean(sessionToken);

  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [sectionFilter, setSectionFilter] = useState("");

  const navigateToTab = (tab: AppTab, filter = "") => {
    setActiveTab(tab);
    setSectionFilter(filter);
  };

  const handleLoginSuccess = (token: string) => {
    if (!useFirestore) {
      sessionStorage.setItem("company_nexus_session", token);
      setSessionToken(token);
    }
  };

  if (!nexus.isAuthReady) {
    return <LoadingPulse label="Initializing..." />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (useFirestore && !nexus.isDataReady) {
    return (
      <LoadingPulse label="Syncing team repository...">
        {nexus.syncError && (
          <p className="text-amber-300 text-xs max-w-md mt-2">{nexus.syncError}</p>
        )}
      </LoadingPulse>
    );
  }

  return (
    <AppShell>
      <AppHeader
        useFirestore={useFirestore}
        syncError={nexus.syncError}
        collections={{
          tools: nexus.tools,
          faqs: nexus.faqs,
          articles: nexus.articles,
          links: nexus.links,
        }}
        onNavigate={navigateToTab}
      />

      <NavTabs
        tabs={APP_TABS}
        activeId={activeTab}
        onChange={(id) => navigateToTab(id as AppTab)}
      />

      <TabContent
        activeTab={activeTab}
        sectionFilter={sectionFilter}
        nexus={nexus}
        onNavigate={navigateToTab}
      />

      <AppFooter />
      <AirAChatLauncher actions={nexus.actions} />
    </AppShell>
  );
}
