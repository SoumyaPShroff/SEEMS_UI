export interface ReleaseNote {
  version: string;
  date: string;
  changes: string[];
}

const ReleaseNotesText: ReleaseNote[] = [
  {
    version: "v1.1.0",
    date: "2026-02-17",
    changes: [
      "New HOME page - improvised sidebars/favourites/default page cards",
      "UI improvements - Menus/Icons/User profile icon/bell icon-new release notes",
      "Billing Planner chart and table styles improved",
      "Sales Management Dashboard - styles updated",
      "Planned Hours",
      "My Team Info"
    ],
  },
];

export default ReleaseNotesText;
