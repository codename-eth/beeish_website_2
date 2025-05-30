"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ConsoleLogger() {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    // Store original console methods
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    const originalInfo = console.info

    // Override console methods
    console.log = (...args) => {
      setLogs((prev) => [...prev, `LOG: ${args.map((arg) => formatArg(arg)).join(" ")}`])
      originalLog.apply(console, args)
    }

    console.error = (...args) => {
      setLogs((prev) => [...prev, `ERROR: ${args.map((arg) => formatArg(arg)).join(" ")}`])
      originalError.apply(console, args)
    }

    console.warn = (...args) => {
      setLogs((prev) => [...prev, `WARN: ${args.map((arg) => formatArg(arg)).join(" ")}`])
      originalWarn.apply(console, args)
    }

    console.info = (...args) => {
      setLogs((prev) => [...prev, `INFO: ${args.map((arg) => formatArg(arg)).join(" ")}`])
      originalInfo.apply(console, args)
    }

    // Restore original methods on cleanup
    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
      console.info = originalInfo
    }
  }, [])

  // Format arguments for display
  const formatArg = (arg: any): string => {
    if (arg === undefined) return "undefined"
    if (arg === null) return "null"
    if (typeof arg === "object") {
      try {
        return JSON.stringify(arg)
      } catch (e) {
        return Object.prototype.toString.call(arg)
      }
    }
    return String(arg)
  }

  // Keep only the last 20 logs
  const recentLogs = logs.slice(-20)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Console Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs font-mono bg-black text-green-400 p-3 rounded-md overflow-auto max-h-60">
          {recentLogs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            recentLogs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
