import React from "react";
import { MoreHorizontal } from "lucide-react";
import IconButton from "./IconButton";
import { useMenu, MenuPanel, MenuItem } from "./Menu";

// Row actions (PUI-2): one "More actions" button per record that opens the
// shared accessible menu. Pass only the actions the user may take; with
// none, nothing is rendered.
export default function RowActions({ label, actions = [] }) {
  const menu = useMenu();
  const shown = actions.filter(Boolean);
  if (!shown.length) return null;
  return (
    <div className="px-menu-anchor" onClick={(e) => e.stopPropagation()}>
      <IconButton label={`More actions for ${label}`} className="px-row-btn" {...menu.triggerProps}>
        <MoreHorizontal size={17} aria-hidden="true" />
      </IconButton>
      {menu.open ? (
        <MenuPanel panelProps={menu.panelProps} label={`Actions for ${label}`}>
          {shown.map((a) =>
            a.separator ? (
              <div key={a.key} className="px-menu-sep" />
            ) : (
              <MenuItem key={a.key} icon={a.icon} tone={a.tone} close={() => menu.close(true)} onSelect={a.onSelect}>
                {a.label}
              </MenuItem>
            )
          )}
        </MenuPanel>
      ) : null}
    </div>
  );
}
