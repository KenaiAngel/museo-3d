import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

export function StatusBar({ status }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "OK":
        return "bg-green-500";
      case "Error":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusPercentage = (status) => {
    switch (status) {
      case "OK":
        return 100;
      case "Error":
        return 100;
      default:
        return 60;
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Estado General del Sistema
        </span>
        <Badge
          variant={
            status === "OK"
              ? "green"
              : status === "Error"
                ? "destructive"
                : "yellow"
          }
        >
          {status === "OK"
            ? "Operacional"
            : status === "Error"
              ? "Error Crítico"
              : "Advertencia"}
        </Badge>
      </div>
      <Progress
        value={getStatusPercentage(status)}
        className={`h-3 ${getStatusColor(status)}`}
      />
    </div>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  color = "text-gray-700",
  description,
  trend,
}) {
  return (
    <Card className="transition-shadow duration-200 hover:shadow-md p-2 md:p-3 min-w-[120px]">
      <CardHeader className="pb-1 mb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {label}
          </CardTitle>
          <span className={`text-lg ${color}`}>{icon}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-1">
          <div className="text-lg font-bold text-foreground">{value}</div>
          {trend && (
            <Badge
              variant={
                trend.type === "up"
                  ? "green"
                  : trend.type === "down"
                    ? "destructive"
                    : "secondary"
              }
              className="text-[10px]"
            >
              {trend.type === "up" ? "↗" : trend.type === "down" ? "↘" : "→"}{" "}
              {trend.value}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function MetricSection({ title, icon, children }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{children}</div>
    </div>
  );
}

export function MemoryUsageCard({ memoryUsage }) {
  if (
    !memoryUsage ||
    typeof memoryUsage.heapUsed !== "number" ||
    typeof memoryUsage.heapTotal !== "number"
  )
    return null;

  const used = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const total = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

  return (
    <Card className="transition-shadow duration-200 hover:shadow-md p-2 md:p-3 min-w-[120px]">
      <CardHeader className="pb-1 mb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Memoria en uso
          </CardTitle>
          <span className="text-lg text-orange-600">🧠</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <div className="text-lg font-bold text-foreground">{used}MB</div>
            <span className="text-xs text-muted-foreground">/ {total}MB</span>
          </div>
          <Progress value={percentage} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {percentage}% del heap utilizado
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
