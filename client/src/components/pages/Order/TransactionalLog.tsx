import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  InputAdornment,
  Button,
  Chip,
  Card,
  CardContent,
  Avatar,
  Skeleton,
  Fade,
  Collapse,
  IconButton,
  Tooltip,
  Container,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Calendar,
  User,
  Database,
  Clock,
  FilterIcon as  FilterList,
  RefreshCw,
  Eye,
  EyeOff,
  Activity,
  FileText,
  Layers,
  Filter,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import api, { API_ROUTES } from "../../../utils/api";

interface TransactionLog {
  id: string;
  type: string;
  entity: string;
  entityId: string;
  userId: string;
  description: string;
  createdAt: string;
  user?: { name: string; email: string };
}

const getSummary = (log: TransactionLog) => {
  if (!log.description) return "No description available";
  
  // Try to extract meaningful summary from various formats
  const lines = log.description.split('\n').filter(line => line.trim());
  if (lines.length === 0) return "No description available";
  
  const firstLine = lines[0].trim();
  
  // If it's a JSON-like structure, try to extract a meaningful title
  if (firstLine.includes('{') || firstLine.includes('[')) {
    try {
      const parsed = JSON.parse(log.description);
      if (parsed.action) return parsed.action;
      if (parsed.operation) return parsed.operation;
      if (parsed.type) return `${parsed.type} operation`;
      if (parsed.name) return `Operation on ${parsed.name}`;
    } catch (e) {
      // Fall back to entity-based summary
    }
  }
  
  // Extract from patterns like "Created X", "Updated Y", etc.
  const actionMatch = firstLine.match(/^(Created|Updated|Deleted|Modified|Added|Removed)\s+(.+?)(?:\s*:|\s*$)/i);
  if (actionMatch) {
    return `${actionMatch[1]} ${actionMatch[2]}`;
  }
  
  // If first line is too long, truncate it
  if (firstLine.length > 60) {
    return firstLine.substring(0, 57) + '...';
  }
  
  return firstLine || `${log.type} operation on ${log.entity}`;
};

const getDetails = (log: TransactionLog) => {
  if (!log.description) return "";
  
  // Look for details section
  const detailsIndex = log.description.toLowerCase().indexOf('details:');
  if (detailsIndex !== -1) {
    return log.description.substring(detailsIndex + 8).trim();
  }
  
  // If multi-line, return everything after first line
  const lines = log.description.split('\n');
  if (lines.length > 1) {
    return lines.slice(1).join('\n').trim();
  }
  
  // If single line and short, don't show details
  if (log.description.length < 100) return "";
  
  return log.description;
};

const formatDetailsContent = (details: string) => {
  if (!details) return "";
  
  try {
    // Try to parse and format as JSON
    const parsed = JSON.parse(details);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    // Return as-is if not JSON
    return details;
  }
};

const getTypeColor = (type: string) => {
  switch (type.toUpperCase()) {
    case 'CREATE': return { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: 'text-emerald-600' };
    case 'UPDATE': return { bg: 'bg-amber-100', text: 'text-amber-800', icon: 'text-amber-600' };
    case 'DELETE': return { bg: 'bg-red-100', text: 'text-red-800', icon: 'text-red-600' };
    case 'READ': return { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'text-blue-600' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'text-gray-600' };
  }
};

const getEntityIcon = (entity: string) => {
  switch (entity.toLowerCase()) {
    case 'purchaseorder': return <FileText size={16} />;
    case 'rawmaterialproduct': return <Layers size={16} />;
    case 'user': return <User size={16} />;
    default: return <Database size={16} />;
  }
};

const TransactionalLog: React.FC = () => {
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (fromDate) params.from = dayjs(fromDate).startOf("day").toISOString();
      if (toDate) params.to = dayjs(toDate).endOf("day").toISOString();

      const authToken = localStorage.getItem('authToken');
      const res = await api.get(API_ROUTES.RAW.GET_ALL_TRANSACTION_LOGS, {
        params,
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setLogs(res.data);
    } catch (err) {
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, []);

  const handleSearch = () => {
    fetchLogs();
  };

  const handleReset = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    fetchLogs();
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="w-20 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-32 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="w-24 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Container maxWidth="xl" className="py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <Typography variant="h4" className="font-bold text-gray-800 mb-1">
                  Transaction Logs
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Monitor and track all system activities
                </Typography>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Tooltip title="Refresh">
                <IconButton 
                  onClick={fetchLogs} 
                  disabled={loading}
                  className="bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </IconButton>
              </Tooltip>
              <Tooltip title={showFilters ? "Hide Filters" : "Show Filters"}>
                <IconButton 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`bg-white shadow-sm hover:shadow-md transition-all ${showFilters ? 'bg-blue-50 text-blue-600' : ''}`}
                >
                  <FilterList className="w-5 h-5" />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <TextField
                    fullWidth
                    label="Search transactions..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search className="w-5 h-5 text-gray-400" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                      }
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    Search
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl transition-all"
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <Collapse in={showFilters}>
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="From Date"
                        type="date"
                        value={fromDate}
                        onChange={e => setFromDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: 'white',
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="To Date"
                        type="date"
                        value={toDate}
                        onChange={e => setToDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: 'white',
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </div>
              </Collapse>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logs List */}
        <div className="space-y-4">
          {loading ? (
            <LoadingSkeleton />
          ) : logs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
              <Typography variant="h6" className="text-gray-600 mb-2">
                No transaction logs found
              </Typography>
              <Typography variant="body2" className="text-gray-500">
                Try adjusting your search criteria or check back later
              </Typography>
            </motion.div>
          ) : (
            <AnimatePresence>
              {logs.map((log, index) => {
                const typeColor = getTypeColor(log.type);
                const hasDetails = getDetails(log).length > 0;
                const isExpanded = expanded === log.id;
                
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`shadow-sm hover:shadow-md transition-all duration-200 border-0 overflow-hidden ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeColor.bg}`}>
                                <div className={typeColor.icon}>
                                  {getEntityIcon(log.entity)}
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <Chip
                                    label={log.type}
                                    size="small"
                                    className={`${typeColor.bg} ${typeColor.text} font-medium`}
                                  />
                                  <Typography variant="body2" className="text-gray-600">
                                    {log.entity}
                                  </Typography>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{dayjs(log.createdAt).format("MMM DD, YYYY HH:mm")}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <User className="w-4 h-4" />
                                    <span>{log.user?.name || log.userId}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {hasDetails && (
                              <IconButton
                                onClick={() => setExpanded(isExpanded ? null : log.id)}
                                className="text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                {isExpanded ? <ChevronUp /> : <ChevronDown />}
                              </IconButton>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                              <div className="w-1 h-full bg-blue-200 rounded-full mt-1"></div>
                              <div className="flex-1">
                                <Typography variant="body1" className="text-gray-800 font-medium mb-1">
                                  {getSummary(log)}
                                </Typography>
                                {log.user?.email && (
                                  <Typography variant="body2" className="text-gray-500">
                                    by {log.user.email}
                                  </Typography>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <Collapse in={isExpanded}>
                          <div className="px-6 pb-6">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <div className="flex items-center justify-between mb-3">
                                <Typography variant="subtitle2" className="text-gray-700 font-medium">
                                  Transaction Details
                                </Typography>
                                <div className="flex items-center space-x-2">
                                  <Info className="w-4 h-4 text-gray-400" />
                                  <Typography variant="caption" className="text-gray-500">
                                    ID: {log.entityId}
                                  </Typography>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words overflow-auto max-h-96">
                                  {formatDetailsContent(getDetails(log))}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </Collapse>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </Container>
    </div>
  );
};

export default TransactionalLog;