import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../app/components/ui/card";
import { Badge } from "../app/components/ui/badge";
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
    <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          <span className={`text-xl ${color}`}>{icon}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {trend && (
            <Badge
              variant={
                trend.type === "up"
                  ? "green"
                  : trend.type === "down"
                    ? "destructive"
                    : "secondary"
              }
              className="text-xs"
            >
              {trend.type === "up" ? "↗" : trend.type === "down" ? "↘" : "→"}{" "}
              {trend.value}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function MetricSection({ title, icon, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

export function MemoryUsageCard({ memoryUsage }) {
  if (!memoryUsage) return null;

  const used = Math.round(memoryUsage.used / 1024 / 1024);
  const total = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const percentage = Math.round((used / total) * 100);

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Memoria en uso
          </CardTitle>
          <span className="text-xl text-orange-600">🧠</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-foreground">{used}MB</div>
            <span className="text-sm text-muted-foreground">/ {total}MB</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {percentage}% del heap utilizado
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
