"use client";

import { useState } from "react";

import {
  SettingsButton,
  SettingsGroup,
  SettingsPanel,
  SettingsRow,
  SettingsSelect,
  SettingsToggle,
} from "@/lib/embed";

export default function SettingsEmbedPage() {
  const [sampleFeatureEnabled, setSampleFeatureEnabled] = useState(false);
  const [density, setDensity] = useState("comfortable");

  return (
    <SettingsPanel className="p-4">
      <SettingsGroup title="Example">
        <SettingsRow
          label="Enable sample feature"
          description="Replace this with a real app preference."
          control={
            <SettingsToggle
              checked={sampleFeatureEnabled}
              onChange={setSampleFeatureEnabled}
              aria-label="Enable sample feature"
            />
          }
        />
        <SettingsRow
          label="Display density"
          description="Small controls that fit inside YouEye Settings."
          control={
            <SettingsSelect
              value={density}
              options={[
                { value: "compact", label: "Compact" },
                { value: "comfortable", label: "Comfortable" },
              ]}
              onChange={setDensity}
            />
          }
        />
      </SettingsGroup>
      <div className="flex justify-end">
        <SettingsButton variant="primary" onClick={() => undefined}>
          Save Settings
        </SettingsButton>
      </div>
    </SettingsPanel>
  );
}
