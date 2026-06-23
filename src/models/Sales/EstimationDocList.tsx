import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Button, FormControl, FormControlLabel, Radio, RadioGroup, TextField, Typography } from "@mui/material";
import CustomDataGrid from "../../components/resusablecontrols/CustomDataGrid";
import { baseUrl } from "../../const/BaseUrl";
import { toast } from "react-toastify";

interface EstimationDocRow {
  id: number;
  enqNo: string;
  fileName: string;
  pathOfDoc: string;
}

const EstimationDocList: React.FC = () => {
  const [rows, setRows] = useState<EstimationDocRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>("");
  const [enquiryType, setEnquiryType] = useState<string>("ONSITE");

  const columns = [
    { field: "enqNo", headerName: "Enquiry No", minWidth: 200  },
    { field: "hrs", headerName: "Hrs", minWidth: 90  },
    {
      field: "fileName",
      headerName: "Download Doc",
      minWidth: 250,
 
      renderCell: (params: any) => (
        <a
          href={`${baseUrl}/api/Sales/DownloadEstimationDoc/${encodeURIComponent(params.row.enqNo)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", color: "#1976d2" }}
        >
          Download Estimation
        </a>
      ),
    },
    { field: "pathofDoc", headerName: "FilePath", minWidth: 300, flex: 1 },
  
  ];

  const fetchEstimationDocs = async () => {
    setLoading(true);
    try {
      const url = `${baseUrl}/api/Sales/EstimationDocs?enquiryType=${encodeURIComponent(enquiryType)}&enquiryNo=${encodeURIComponent(searchText.trim())}`;
      const response = await axios.get<EstimationDocRow[]>(url);
      const mapped = response.data.map((item, index) => ({
        id: index + 1,
        ...item,
      }));
      setRows(mapped);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load estimation documents.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimationDocs();
  }, [enquiryType]);

  return (
    <Box sx={{ padding: "30px", mt: "10px", ml: "12px" }}>
      <Typography variant="h5" sx={{ mb: 2, color: "#1b4f91" }}>
        Estimation Documents
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <FormControl>
          <RadioGroup
            row
            value={enquiryType}
            onChange={(e) => setEnquiryType(e.target.value)}
          >
            <FormControlLabel value="OFFSHORE" control={<Radio size="small" />} label="OFFSHORE" />
            <FormControlLabel value="ONSITE" control={<Radio size="small" />} label="ONSITE" />
          </RadioGroup>
        </FormControl>

        <TextField
          label="Search Enquiry No"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: 300 }}
        />

        <Button variant="contained" onClick={fetchEstimationDocs}>
          Search
        </Button>
      </Box>

      <CustomDataGrid
        rows={rows}
        columns={columns}
        title="Estimation Documents"
        loading={loading}
        gridheight={500}
      />
    </Box>
  );
};

export default EstimationDocList;
