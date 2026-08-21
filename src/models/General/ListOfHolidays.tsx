import React, { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Chip, CircularProgress, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import IconButton from "@mui/material/IconButton";
import axios from "axios";
import { toast } from "react-toastify";
import { baseUrl } from "../../const/BaseUrl";

interface Holiday {
  id: number;
  date: Date;
  name: string;
}

interface ApiHolidayRecord {
  [key: string]: unknown;
}

const HOLIDAYS_ENDPOINT = `${baseUrl}/api/Home/ListOfHolidays`;

const asString = (value: unknown): string => (value == null ? "" : String(value).trim());

const extractRecords = (data: unknown): ApiHolidayRecord[] => {
  if (Array.isArray(data)) {
    return data as ApiHolidayRecord[];
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    return (data as { data: ApiHolidayRecord[] }).data;
  }

  return [];
};

const mapApiHoliday = (record: ApiHolidayRecord, index: number): Holiday | null => {
  const rawDate = asString(record.date ?? record.Date);
  const parsedDate = rawDate ? new Date(rawDate) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return {
    id: index,
    date: parsedDate,
    name: asString(record.holiday ?? record.Holiday),
  };
};

const MONTH_THEMES = [
  { name: "January", color: "#3a6ea5", soft: "#eaf1fb" },
  { name: "February", color: "#8a4fbd", soft: "#f2ebf9" },
  { name: "March", color: "#2e9b6f", soft: "#e9f7f1" },
  { name: "April", color: "#d98a1f", soft: "#fdf3e4" },
  { name: "May", color: "#e0578c", soft: "#fceef3" },
  { name: "June", color: "#1f9bab", soft: "#e6f6f8" },
  { name: "July", color: "#c0522e", soft: "#faece6" },
  { name: "August", color: "#5c6bc0", soft: "#edeffb" },
  { name: "September", color: "#7a8a2e", soft: "#f2f6e6" },
  { name: "October", color: "#b8611f", soft: "#faeee3" },
  { name: "November", color: "#3f7d8c", soft: "#e8f3f5" },
  { name: "December", color: "#a13f5f", soft: "#f7e9ee" },
];

const startOfToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

const dayDiff = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000);

const currentYear = new Date().getFullYear();

const ListOfHolidays: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    void loadHolidays();
  }, []);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const response = await axios.get(HOLIDAYS_ENDPOINT, { params: { year: currentYear } });
      const result = extractRecords(response.data)
        .map(mapApiHoliday)
        .filter((item): item is Holiday => item !== null)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      setHolidays(result);
    } catch (error) {
      toast.error("Unable to load list of holidays.");
      console.warn("Failed to load list of holidays.", error);
    } finally {
      setLoading(false);
    }
  };

  const today = startOfToday();

  const filteredHolidays = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    if (!term) return holidays;
    return holidays.filter(
      (h) =>
        h.name.toLowerCase().includes(term) ||
        h.date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", weekday: "long" }).toLowerCase().includes(term)
    );
  }, [holidays, searchInput]);

  const nextHoliday = useMemo(
    () => holidays.find((h) => dayDiff(h.date, today) >= 0) ?? null,
    [holidays, today]
  );

  const upcomingCount = useMemo(() => holidays.filter((h) => dayDiff(h.date, today) >= 0).length, [holidays, today]);
  const passedCount = holidays.length - upcomingCount;

  const grouped = useMemo(() => {
    const map = new Map<number, Holiday[]>();
    filteredHolidays.forEach((h) => {
      const month = h.date.getMonth();
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(h);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [filteredHolidays]);

  return (
    <Box
      sx={{
        p: { xs: 1, md: 1.25 },
        mt: 15,
        width: "100%",
        maxWidth: 900,
        mx: "auto",
        pb: 2.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.7, mb: 1.25 }}>
        <CelebrationRoundedIcon sx={{ color: "#e0578c", fontSize: 22 }} />
        <Typography
          sx={{
            fontSize: { xs: "0.95rem", md: "1.2rem" },
            fontWeight: 800,
            color: "#1b4f91",
            fontFamily: "Arial",
            letterSpacing: 0.2,
          }}
        >
          List of Holidays &mdash; {currentYear}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : holidays.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            border: "1px dashed #a8bfdc",
            borderRadius: 2,
            p: 3,
            textAlign: "center",
            color: "#4c6282",
            background: "linear-gradient(180deg, #fcfeff 0%, #f3f8ff 100%)",
          }}
        >
          <Typography>No holidays found for {currentYear}.</Typography>
        </Paper>
      ) : (
        <>
          {/* Hero: next holiday + stats */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: nextHoliday ? "1.6fr 1fr 1fr" : "1fr 1fr" },
              gap: 0.9,
              mb: 1.4,
            }}
          >
            {nextHoliday && (
              <Card
                sx={{
                  borderRadius: 2,
                  border: "none",
                  color: "#fff",
                  background: "linear-gradient(135deg, #1e5fae 0%, #2b7ad8 55%, #4fa3e8 100%)",
                  boxShadow: "0 8px 18px rgba(24, 71, 153, 0.26)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <CelebrationRoundedIcon
                  sx={{ position: "absolute", right: -8, bottom: -10, fontSize: 70, opacity: 0.15 }}
                />
                <CardContent sx={{ py: 1, px: 1.4, position: "relative", "&:last-child": { pb: 1 } }}>
                  <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: 0.8, opacity: 0.85 }}>
                    {dayDiff(nextHoliday.date, today) === 0 ? "TODAY'S HOLIDAY" : "NEXT HOLIDAY"}
                  </Typography>
                  <Typography sx={{ fontSize: "1rem", fontWeight: 800, mt: 0.1, lineHeight: 1.2 }}>
                    {nextHoliday.name}
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", mt: 0.1, opacity: 0.92 }}>
                    {nextHoliday.date.toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                    })}
                  </Typography>
                  <Chip
                    size="small"
                    label={
                      dayDiff(nextHoliday.date, today) === 0
                        ? "Today 🎉"
                        : `In ${dayDiff(nextHoliday.date, today)} day${dayDiff(nextHoliday.date, today) === 1 ? "" : "s"}`
                    }
                    sx={{
                      mt: 0.6,
                      height: 20,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: "#1e5fae",
                      backgroundColor: "#ffffff",
                    }}
                  />
                </CardContent>
              </Card>
            )}

            <Card
              sx={{
                borderRadius: 2,
                border: "1px solid #d5e1f8",
                background: "#ffffff",
                boxShadow: "0 4px 10px rgba(33, 75, 149, 0.07)",
              }}
            >
              <CardContent sx={{ py: 1, px: 1.4, display: "flex", alignItems: "center", gap: 0.9, "&:last-child": { pb: 1 } }}>
                <EventAvailableRoundedIcon sx={{ fontSize: 22, color: "#2f80ed" }} />
                <Box>
                  <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: "#1b4f91", lineHeight: 1 }}>
                    {upcomingCount}
                  </Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: "#5a6b85", fontWeight: 600 }}>Upcoming</Typography>
                </Box>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 2,
                border: "1px solid #d5e1f8",
                background: "#ffffff",
                boxShadow: "0 4px 10px rgba(33, 75, 149, 0.07)",
              }}
            >
              <CardContent sx={{ py: 1, px: 1.4, display: "flex", alignItems: "center", gap: 0.9, "&:last-child": { pb: 1 } }}>
                <EventBusyRoundedIcon sx={{ fontSize: 22, color: "#9aa5b5" }} />
                <Box>
                  <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: "#1b4f91", lineHeight: 1 }}>
                    {passedCount}
                  </Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: "#5a6b85", fontWeight: 600 }}>Already Passed</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Search */}
          <TextField
            size="small"
            placeholder="Search holidays by name, month or day..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            fullWidth
            sx={{
              mb: 1.4,
              backgroundColor: "#fff",
              borderRadius: 1,
              "& .MuiInputBase-input": { py: 0.7, fontSize: "0.82rem" },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchInput("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          {/* Month groups */}
          {grouped.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                border: "1px dashed #a8bfdc",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                color: "#4c6282",
                background: "linear-gradient(180deg, #fcfeff 0%, #f3f8ff 100%)",
              }}
            >
              <Typography>No holidays match your search.</Typography>
            </Paper>
          ) : (
            grouped.map(([month, items]) => {
              const theme = MONTH_THEMES[month];
              return (
                <Box key={month} sx={{ mb: 1.4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.6 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: theme.color }} />
                    <Typography sx={{ fontWeight: 800, color: theme.color, fontSize: "0.78rem" }}>
                      {theme.name}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                      gap: 0.7,
                    }}
                  >
                    {items.map((h) => {
                      const diff = dayDiff(h.date, today);
                      const isToday = diff === 0;
                      const isPast = diff < 0;
                      const isWeekend = h.date.getDay() === 0 || h.date.getDay() === 6;

                      return (
                        <Card
                          key={h.id}
                          sx={{
                            borderRadius: 1.75,
                            border: isToday ? `2px solid ${theme.color}` : "1px solid #e2e9f5",
                            background: isPast ? "#f7f8fa" : theme.soft,
                            opacity: isPast ? 0.65 : 1,
                            boxShadow: isToday ? `0 6px 14px ${theme.color}33` : "0 2px 6px rgba(33,75,149,0.05)",
                            transition: "transform 0.15s ease, box-shadow 0.15s ease",
                            "&:hover": {
                              transform: isPast ? "none" : "translateY(-2px)",
                              boxShadow: isPast ? "0 2px 6px rgba(33,75,149,0.05)" : `0 8px 16px ${theme.color}2e`,
                            },
                          }}
                        >
                          <CardContent sx={{ py: 0.8, px: 0.9, display: "flex", alignItems: "center", gap: 0.8, "&:last-child": { pb: 0.8 } }}>
                            <Box
                              sx={{
                                minWidth: 38,
                                height: 38,
                                borderRadius: 1.5,
                                backgroundColor: theme.color,
                                color: "#fff",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                lineHeight: 1,
                                flexShrink: 0,
                              }}
                            >
                              <Typography sx={{ fontSize: "0.88rem", fontWeight: 800, lineHeight: 1.1 }}>
                                {h.date.getDate()}
                              </Typography>
                              <Typography sx={{ fontSize: "0.52rem", fontWeight: 700, opacity: 0.9 }}>
                                {h.date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                              </Typography>
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.76rem",
                                  color: "#25334d",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  lineHeight: 1.25,
                                }}
                                title={h.name}
                              >
                                {h.name || "Holiday"}
                              </Typography>
                              {(isToday || isWeekend || isPast) && (
                                <Box sx={{ display: "flex", gap: 0.35, mt: 0.25, flexWrap: "wrap" }}>
                                  {isToday && (
                                    <Chip
                                      size="small"
                                      icon={<TodayRoundedIcon sx={{ fontSize: "11px !important" }} />}
                                      label="Today"
                                      sx={{
                                        height: 16,
                                        fontSize: "0.58rem",
                                        fontWeight: 700,
                                        backgroundColor: theme.color,
                                        color: "#fff",
                                        "& .MuiChip-label": { px: 0.6 },
                                      }}
                                    />
                                  )}
                                  {isWeekend && (
                                    <Chip
                                      size="small"
                                      label="Weekend"
                                      variant="outlined"
                                      sx={{
                                        height: 16,
                                        fontSize: "0.58rem",
                                        fontWeight: 600,
                                        borderColor: theme.color,
                                        color: theme.color,
                                        "& .MuiChip-label": { px: 0.6 },
                                      }}
                                    />
                                  )}
                                  {isPast && (
                                    <Chip
                                      size="small"
                                      label="Passed"
                                      sx={{
                                        height: 16,
                                        fontSize: "0.58rem",
                                        fontWeight: 600,
                                        backgroundColor: "#e3e7ee",
                                        color: "#6b7688",
                                        "& .MuiChip-label": { px: 0.6 },
                                      }}
                                    />
                                  )}
                                </Box>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                </Box>
              );
            })
          )}
        </>
      )}
    </Box>
  );
};

export default ListOfHolidays;
