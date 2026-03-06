export interface ReleaseNote {
  version: string;
  date: string;
  changes: string[];
}

const ReleaseNotesText: ReleaseNote[] = [
   {
    version: "v1.2.0",
    date: "2026-03-04",
    changes: [
      "Billing Planner - Grid column header styles updated - three dots menu visibile by default",
      "Billing Planner - NDA Validity Column introduced",
      "My Team Info - Meet My Team page introduced with team members details",
      "Other Sales Reports grid header column width altered"
    ],
  },
  // {
  //   version: "v1.1.0",
  //   date: "2026-02-17",
  //   changes: [
  //     "New HOME page - improvised sidebars/favourites/default page cards",
  //     "UI improvements - Menus/Icons/User profile icon/bell icon-new release notes",
  //     "Billing Planner chart and table styles improved",
  //     "Sales Management Dashboard - styles updated",
  //     "Planned Hours",
  //     "My Team Info"
  //   ],
  // },
];

export default ReleaseNotesText;
