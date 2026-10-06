import { useEffect } from "react";
import type { NexusRepositoryActions } from "../services/nexusRepository";

interface AirAChatLauncherProps {
  actions?: NexusRepositoryActions;
}

export function AirAChatLauncher({ actions: _actions }: AirAChatLauncherProps) {
  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://elfsightcdn.com/platform.js"]',
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://elfsightcdn.com/platform.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(360px,calc(100vw-1rem))] max-w-full">
      <div
        className="elfsight-app-fe4f3cad-b863-4239-9b10-871c0415588e"
        data-elfsight-app-lazy
      />
    </div>
  );
}
