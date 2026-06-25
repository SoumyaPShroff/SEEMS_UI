import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Autocomplete,  Box,  Button,  Card,  CardContent,  Chip,  CircularProgress,  Divider,  FormControl,
  IconButton,  MenuItem,  Paper,  Select,  Stack,  TextField,  Typography,} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
//import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type { GridColDef } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import { baseUrl } from "../const/BaseUrl";
import CustomDataGrid2 from "./resusablecontrols/CustomDataGrid2";
import StandardPageLayout from "./resusablecontrols/StandardPageLayout";

type TableItem = {
  tableName: string;
};

type ColumnItem = {
  columnName: string;
  dataType: string;
  isNullable: boolean;
};

type QueryFilter = {
  column: string;
  operator: string;
  value: string;
  valueTo: string;
};

type QueryResult = {
  sql: string;
  columns: string[];
  rows: Record<string, any>[];
};

const operatorOptions = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "notequals", label: "Not equals" },
  { value: "startswith", label: "Starts with" },
  { value: "endswith", label: "Ends with" },
  { value: "greaterthan", label: "Greater than" },
  { value: "greaterorequal", label: "Greater or equal" },
  { value: "lessthan", label: "Less than" },
  { value: "lessorequal", label: "Less or equal" },
  { value: "between", label: "Between" },
  { value: "isnull", label: "Is null" },
  { value: "isnotnull", label: "Is not null" },
];

const defaultFilter = (): QueryFilter => ({
  column: "",
  operator: "contains",
  value: "",
  valueTo: "",
});

//const escapeSqlPreview = (value: string) => value.replace(/'/g, "''");

// const buildPreviewSql = (
//   tableName: string,
//   columns: string[],
//   filters: QueryFilter[],
//   sortColumn: string,
//   sortDirection: string,
//   limit: number,
//   distinct: boolean
// ) => {
//   if (!tableName) return "";

//   const selectColumns = columns.length > 0 ? columns.map((c) => `\`${c}\``).join(", ") : "*";
//   const parts = [`SELECT ${distinct ? "DISTINCT " : ""}${selectColumns}`, `FROM \`${tableName}\``];
//   const clauses: string[] = [];

//   filters.forEach((filter) => {
//     if (!filter.column) return;
//     const column = `\`${filter.column}\``;

//     switch (filter.operator) {
//       case "equals":
//         clauses.push(`${column} = '${escapeSqlPreview(filter.value)}'`);
//         break;
//       case "notequals":
//         clauses.push(`${column} <> '${escapeSqlPreview(filter.value)}'`);
//         break;
//       case "contains":
//         clauses.push(`${column} LIKE '%${escapeSqlPreview(filter.value)}%'`);
//         break;
//       case "startswith":
//         clauses.push(`${column} LIKE '${escapeSqlPreview(filter.value)}%'`);
//         break;
//       case "endswith":
//         clauses.push(`${column} LIKE '%${escapeSqlPreview(filter.value)}'`);
//         break;
//       case "greaterthan":
//         clauses.push(`${column} > '${escapeSqlPreview(filter.value)}'`);
//         break;
//       case "greaterorequal":
//         clauses.push(`${column} >= '${escapeSqlPreview(filter.value)}'`);
//         break;
//       case "lessthan":
//         clauses.push(`${column} < '${escapeSqlPreview(filter.value)}'`);
//         break;
//       case "lessorequal":
//         clauses.push(`${column} <= '${escapeSqlPreview(filter.value)}'`);
//         break;
//       case "between":
//         clauses.push(`${column} BETWEEN '${escapeSqlPreview(filter.value)}' AND '${escapeSqlPreview(filter.valueTo)}'`);
//         break;
//       case "isnull":
//         clauses.push(`${column} IS NULL`);
//         break;
//       case "isnotnull":
//         clauses.push(`${column} IS NOT NULL`);
//         break;
//       default:
//         break;
//     }
//   });

//   if (clauses.length) {
//     parts.push(`WHERE ${clauses.join(" AND ")}`);
//   }

//   if (sortColumn) {
//     parts.push(`ORDER BY \`${sortColumn}\` ${sortDirection}`);
//   }

//   parts.push(`LIMIT ${limit}`);
//   return parts.join(" ");
// };

const QueryBuilder = () => {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [columns, setColumns] = useState<ColumnItem[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<QueryFilter[]>([defaultFilter()]);
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("ASC");
  const [limit, setLimit] = useState(250);
  const [distinct, setDistinct] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [runningQuery, setRunningQuery] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);

  const tableOptions = useMemo(
    () => tables.map((table) => ({ label: table.tableName, value: table.tableName })),
    [tables]
  );

  const columnOptions = useMemo(
    () => columns.map((column) => ({ label: column.columnName, value: column.columnName })),
    [columns]
  );

  useEffect(() => {
    const loadTables = async () => {
      setLoadingTables(true);
      try {
        const res = await axios.get<TableItem[]>(`${baseUrl}/api/QueryBuilder/tables`);
        setTables(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error(error);
        toast.error("Unable to load tables from the API.");
      } finally {
        setLoadingTables(false);
      }
    };

    loadTables();
  }, []);

  useEffect(() => {
    const loadColumns = async () => {
      if (!selectedTable) {
        setColumns([]);
        setSelectedColumns([]);
        setSortColumn("");
        return;
      }

      setLoadingColumns(true);
      try {
        const res = await axios.get<ColumnItem[]>(
          `${baseUrl}/api/QueryBuilder/tables/${encodeURIComponent(selectedTable)}/columns`
        );
        const nextColumns = Array.isArray(res.data) ? res.data : [];
        setColumns(nextColumns);

        setSelectedColumns((current) =>
          current.filter((column) => nextColumns.some((item) => item.columnName === column))
        );
        setSortColumn((current) => (nextColumns.some((item) => item.columnName === current) ? current : ""));
      } catch (error) {
        console.error(error);
        toast.error("Unable to load table columns.");
      } finally {
        setLoadingColumns(false);
      }
    };

    loadColumns();
  }, [selectedTable]);

  // const previewSql = useMemo(
  //   () => buildPreviewSql(selectedTable, selectedColumns, filters, sortColumn, sortDirection, limit, distinct),
  //   [selectedTable, selectedColumns, filters, sortColumn, sortDirection, limit, distinct]
  // );

  const updateFilter = (index: number, patch: Partial<QueryFilter>) => {
    setFilters((current) =>
      current.map((filter, currentIndex) => (currentIndex === index ? { ...filter, ...patch } : filter))
    );
  };

  const addFilter = () => setFilters((current) => [...current, defaultFilter()]);
  const removeFilter = (index: number) =>
    setFilters((current) => current.filter((_, currentIndex) => currentIndex !== index));

  const runQuery = async () => {
    if (!selectedTable) {
      toast.warning("Please choose a table first.");
      return;
    }

    setRunningQuery(true);
    try {
      const payload = {
        tableName: selectedTable,
        columns: selectedColumns,
        filters: filters.filter((filter) => filter.column),
        sort: sortColumn ? { column: sortColumn, direction: sortDirection } : null,
        limit,
        distinct,
      };

      const res = await axios.post<QueryResult>(`${baseUrl}/api/QueryBuilder/execute`, payload);
      setResult(res.data);
      toast.success("Query executed successfully.");
    } catch (error: any) {
      console.error(error);
      const message = error?.response?.data?.message ?? "Query execution failed.";
      toast.error(message);
    } finally {
      setRunningQuery(false);
    }
  };

  const resetAll = () => {
    setSelectedTable("");
    setColumns([]);
    setSelectedColumns([]);
    setFilters([defaultFilter()]);
    setSortColumn("");
    setSortDirection("ASC");
    setLimit(250);
    setDistinct(false);
    setResult(null);
  };

  // const copySql = async () => {
  //   if (!previewSql) return;
  //   await navigator.clipboard.writeText(previewSql);
  //   toast.success("SQL copied to clipboard.");
  // };

  const resultColumns: GridColDef[] = useMemo(
    () =>
      (result?.columns ?? []).map((column) => ({
        field: column,
        headerName: column,
        minWidth: 160,
        flex: 1,
      })),
    [result]
  );

  const resultRows = useMemo(
    () =>
      (result?.rows ?? []).map((row, index) => ({
        id: index + 1,
        ...row,
      })),
    [result]
  );

  return (
    <StandardPageLayout
      title="Query Builder"
      subtitle="Build ad-hoc data queries without writing SQL by hand."
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={resetAll}>
            Reset
          </Button>
          {/* <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={copySql} disabled={!previewSql}>
            Copy SQL
          </Button> */}
          <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={runQuery} disabled={runningQuery}>
            {runningQuery ? "Running..." : "Run Query"}
          </Button>
        </Stack>
      }
    >
      <Paper elevation={0} sx={{ border: "1px solid #d8e3f2", borderRadius: 3, overflow: "hidden" }}>
        <CardContent>
          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.3fr 1fr" },
                gap: 2,
                alignItems: "start",
              }}
            >
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "#163b67" }}>
                        Data Source
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Select the table you want to explore.
                      </Typography>
                    </Box>

                    <Autocomplete
                      options={tableOptions}
                      loading={loadingTables}
                      value={tableOptions.find((option) => option.value === selectedTable) ?? null}
                      onChange={(_, value) => setSelectedTable(value?.value ?? "")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Table"
                          placeholder="Choose a table"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingTables ? <CircularProgress color="inherit" size={18} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />

                    <Autocomplete
                      multiple
                      options={columnOptions}
                      value={columnOptions.filter((option) => selectedColumns.includes(option.value))}
                      onChange={(_, value) => setSelectedColumns(value.map((item) => item.value))}
                      disabled={!selectedTable || loadingColumns}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={option.label}
                            {...getTagProps({ index })}
                            key={option.value}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Columns"
                          placeholder={selectedTable ? "Pick columns" : "Select a table first"}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingColumns ? <CircularProgress color="inherit" size={18} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {columns.slice(0, 8).map((column) => (
                        <Chip key={column.columnName} label={`${column.columnName} (${column.dataType})`} size="small" />
                      ))}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "#163b67" }}>
                        Query Options
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Control sorting, limits, and whether duplicate rows should be removed.
                      </Typography>
                    </Box>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <FormControl fullWidth>
                        <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 700 }}>
                          Sort By
                        </Typography>
                        <Select
                          value={sortColumn}
                          onChange={(e) => setSortColumn(String(e.target.value))}
                          displayEmpty
                          size="small"
                        >
                          <MenuItem value="">None</MenuItem>
                          {columns.map((column) => (
                            <MenuItem key={column.columnName} value={column.columnName}>
                              {column.columnName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 700 }}>
                          Direction
                        </Typography>
                        <Select
                          value={sortDirection}
                          onChange={(e) => setSortDirection(String(e.target.value))}
                          size="small"
                        >
                          <MenuItem value="ASC">Ascending</MenuItem>
                          <MenuItem value="DESC">Descending</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Row limit"
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value) || 0)}
                        fullWidth
                        size="small"
                      />
                      <TextField
                        label="Query mode"
                        value={distinct ? "Distinct" : "Standard"}
                        fullWidth
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Stack>

                    <Button variant={distinct ? "contained" : "outlined"} onClick={() => setDistinct((value) => !value)}>
                      {distinct ? "Distinct enabled" : "Enable distinct rows"}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "#163b67" }}>
                        Filters
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add one or more conditions to narrow the result set.
                      </Typography>
                    </Box>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={addFilter}>
                      Add filter
                    </Button>
                  </Box>

                  <Stack spacing={1.5}>
                    {filters.map((filter, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr 1fr 1fr auto" },
                          gap: 1.2,
                          alignItems: "center",
                        }}
                      >
                        <Select
                          value={filter.column}
                          onChange={(e) => updateFilter(index, { column: String(e.target.value) })}
                          displayEmpty
                          size="small"
                        >
                          <MenuItem value="">Column</MenuItem>
                          {columns.map((column) => (
                            <MenuItem key={column.columnName} value={column.columnName}>
                              {column.columnName}
                            </MenuItem>
                          ))}
                        </Select>

                        <Select
                          value={filter.operator}
                          onChange={(e) => updateFilter(index, { operator: String(e.target.value) })}
                          size="small"
                        >
                          {operatorOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>

                        <TextField
                          label="Value"
                          size="small"
                          value={filter.value}
                          onChange={(e) => updateFilter(index, { value: e.target.value })}
                        />

                        <TextField
                          label="Value 2"
                          size="small"
                          value={filter.valueTo}
                          onChange={(e) => updateFilter(index, { valueTo: e.target.value })}
                          disabled={filter.operator !== "between"}
                        />

                        <IconButton
                          aria-label="remove filter"
                          onClick={() => removeFilter(index)}
                          disabled={filters.length === 1}
                          sx={{ justifySelf: "end" }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
{/* 
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#163b67" }}>
                      SQL Preview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This is the query that will be executed on the API service.
                    </Typography>
                  </Box>
                  <TextField
                    value={previewSql}
                    multiline
                    minRows={4}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    placeholder="Your query preview will appear here."
                  />
                </Stack>
              </CardContent>
            </Card> */}

            <Divider />

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: "#163b67" }}>
                Results
              </Typography>

              {resultRows.length > 0 ? (
                <CustomDataGrid2
                  rows={resultRows}
                  columns={resultColumns}
                  loading={runningQuery}
                  gridHeight={560}
                  title={result?.rows?.length ? `${result.rows.length} row(s) returned` : "Results"}
                />
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 4,
                    textAlign: "center",
                    borderStyle: "dashed",
                    borderRadius: 3,
                    color: "text.secondary",
                  }}
                >
                  Run a query to see the results here.
                </Paper>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Paper>
    </StandardPageLayout>
  );
};

export default QueryBuilder;
