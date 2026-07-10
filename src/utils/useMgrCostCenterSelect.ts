import { useEffect, useMemo, useState } from "react";
import { useManagers } from "./useManagers";

export interface Manager {
  hopc1id: string;
  hopc1name: string;
  costcenter: string;
}

export const useManagerCostCenterSelect = (
  loginId: string,
  module: string,
  autoSelectDefault = true
) => {
  const { managers } = useManagers(loginId, module);

  const [selectedManager, setSelectedManager] =
    useState<Manager | null>(null);

  // Auto-select default manager so SelectControl has an initial selected value.
  useEffect(() => {
    if (!autoSelectDefault) return;
    if (managers.length === 0) return;
    if (selectedManager) return;

    if (managers.length === 1) {
      setSelectedManager(managers[0]);
      return;
    }

    const allOption = managers.find((m) => m.hopc1id === "All");
    setSelectedManager(allOption || managers[0]);
  }, [managers, selectedManager, autoSelectDefault]);

  // Convert managers to SelectControl options.
  const managerOptions = useMemo(() => {
    return managers.map((m: Manager) => ({
      value:
        m.hopc1id === "All"
          ? "All"
          : `${m.hopc1id}_${m.costcenter}`,
      label:
        m.hopc1name === "All"
          ? "All"
          : `${m.hopc1name} (${m.costcenter})`,
    }));
  }, [managers]);

  // SelectControl onChange handler.
  const handleManagerChange = (value: string) => {
    if (!value) {
      setSelectedManager(null);
      return;
    }

    if (value === "All") {
      setSelectedManager({
        hopc1id: "All",
        hopc1name: "All",
        costcenter: "All",
      });
      return;
    }

    const [hopc1id, costcenter] = value.split("_");

    const manager = managers.find(
      (m: Manager) =>
        m.hopc1id === hopc1id && m.costcenter === costcenter
    );

    if (manager) {
      setSelectedManager(manager);
    }
  };

  // Value for SelectControl.
  const selectedValue = selectedManager
    ? selectedManager.hopc1id === "All"
      ? "All"
      : `${selectedManager.hopc1id}_${selectedManager.costcenter}`
    : "";

  return {
    selectedManager,
    selectedValue,
    managerOptions,
    handleManagerChange,
  };
};
