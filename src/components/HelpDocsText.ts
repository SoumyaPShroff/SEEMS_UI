export type HelpDoc = {
  name: string;
  description: string;
  path: string;
};

// Add new entries here as more help documents become available.
const HelpDocsText: HelpDoc[] = [
  {
    name: "SIA - SEEMS Intelligent Assistant",
    description: "How to use SIA to navigate SEEMS and ask questions.",
    path: "/docs/chat_query_service.docx",
  },
 {
    name: "Billing Planner Report",
    description: "How to use the Billing Planner report and understand its color coding.",
    path: "",
  },
];

export default HelpDocsText;
