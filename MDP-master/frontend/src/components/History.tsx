import { useState } from "react";
import { useMedicineStore } from "../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Calendar, Filter, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { HistoryLog } from "../lib/types";

export function History() {
  const { logs } = useMedicineStore();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredLogs = logs.filter((log) => {
    if (filterStatus === "all") return true;
    return log.status === filterStatus;
  });

  // Group logs by date
  const groupedLogs = filteredLogs.reduce((acc, log) => {
    // Extract date part from ISO string if needed
    const dateKey = log.date.split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(log);
    return acc;
  }, {} as Record<string, HistoryLog[]>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'dispensed') {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          Dispensed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
        Missed
      </Badge>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-foreground mb-2">History & Logs</h1>
        <p className="text-muted-foreground">
          View your medication intake history and track adherence
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Doses</p>
          <p className="text-3xl text-foreground">{logs.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Dispensed</p>
          <p className="text-3xl text-green-600">
            {logs.filter((l) => l.status === 'dispensed').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Missed</p>
          <p className="text-3xl text-red-600">
            {logs.filter((l) => l.status === 'missed').length}
          </p>
        </div>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>Filter by status:</span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="dispensed">Dispensed Only</SelectItem>
                <SelectItem value="missed">Missed Only</SelectItem>
              </SelectContent>
            </Select>
            {filterStatus !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedLogs)
          .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
          .map(([date, dateLogs]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  {formatDate(date)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Time</TableHead>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dateLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.time}</TableCell>
                          <TableCell>{log.medicineName}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.dosage}
                          </TableCell>
                          <TableCell className="text-right">
                            {getStatusBadge(log.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {dateLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-accent/50 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-foreground">{log.medicineName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {log.dosage}
                          </p>
                        </div>
                        {getStatusBadge(log.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {filteredLogs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground mb-2">No history found</h3>
            <p className="text-muted-foreground">
              {filterStatus === "all"
                ? "Your medication history will appear here"
                : "No records match the selected filter"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
