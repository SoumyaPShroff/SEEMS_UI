import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

const OnsiteEnquiry: React.FC = () => {
  return (
    <Card sx={{ boxShadow: 6, borderRadius: 3, p: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          🏢 Onsite Enquiry
        </Typography>

        {/* Add your Onsite-specific form fields here */}
      </CardContent>
    </Card>
  );
};

export default OnsiteEnquiry;
