export interface ReleaseNote {
  version: string;
  date: string;
  changes: string[];
}

const ReleaseNotesText: ReleaseNote[] = [
  {
    version: "v1.4.0",
    date: "2026-05-04",
    changes: [
      "Billing Planner - 1.Targets added for the graphs.Merged VA and NPI as VA/DTP.2.Segment wise graph completely modified.3. plus symbol provided beside jobnumber column to view additional details of job",
    ],
  },
  //  {

  //   version: "v1.3.0",
  //   date: "2026-03-16",
  //   changes: [
  //     "Billing Planner - costcenter delegation implemented",
  //     "Planned Hours - costcenter delegation implemented",
  //   ],
  // },
  // {
  //   version: "v1.2.0",
  //   date: "2026-03-13",
  //   changes: [
  //     "Billing Planner - costcenter delegation implemented",
  //     "Planned Hours - costcenter delegation implemented",
  //     "My Team Info - Meet My Team page introduced with team members details",
  //     "Other Sales Reports grid header column width altered",
  //     "View Enquiry Report - added esti and type columns"
  //   ],
  // },
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
