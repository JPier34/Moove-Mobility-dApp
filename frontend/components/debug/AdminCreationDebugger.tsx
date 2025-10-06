"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

export default function AdminCreationDebugger() {
  const { address, isConnected } = useAccount();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isMonitoring) return;

    // Intercetta i console.log per catturare i logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('🎨') || message.includes('🔍') || message.includes('📝') || 
          message.includes('🔐') || message.includes('🏆') || message.includes('🎯') ||
          message.includes('✅') || message.includes('❌') || message.includes('🚀')) {
        setLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          level: 'log',
          message: message,
          data: args.length > 1 ? args.slice(1) : undefined
        }]);
      }
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      const message = args.join(' ');
      setLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        level: 'error',
        message: message,
        data: args.length > 1 ? args.slice(1) : undefined
      }]);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      setLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        level: 'warn',
        message: message,
        data: args.length > 1 ? args.slice(1) : undefined
      }]);
      originalWarn.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [isMonitoring]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    setLogs([]);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'log': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getEmoji = (message: string) => {
    if (message.includes('🎨')) return '🎨';
    if (message.includes('🔍')) return '🔍';
    if (message.includes('📝')) return '📝';
    if (message.includes('🔐')) return '🔐';
    if (message.includes('🏆')) return '🏆';
    if (message.includes('🎯')) return '🎯';
    if (message.includes('✅')) return '✅';
    if (message.includes('❌')) return '❌';
    if (message.includes('🚀')) return '🚀';
    return '📝';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        🔍 Admin Creation Debugger
      </h2>
      
      <div className="mb-6 flex gap-4">
        <button
          onClick={startMonitoring}
          disabled={isMonitoring}
          className={`px-4 py-2 rounded-md font-medium ${
            isMonitoring 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isMonitoring ? 'Monitoring...' : 'Start Monitoring'}
        </button>
        
        <button
          onClick={stopMonitoring}
          disabled={!isMonitoring}
          className={`px-4 py-2 rounded-md font-medium ${
            !isMonitoring 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          Stop Monitoring
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-2 rounded-md font-medium bg-blue-500 text-white hover:bg-blue-600"
        >
          Clear Logs
        </button>
      </div>

      {!isConnected && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">⚠️ Please connect your wallet to monitor logs</p>
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Status: {isMonitoring ? '🟢 Monitoring' : '🔴 Stopped'} | 
          Logs: {logs.length} | 
          User: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
        </p>
      </div>

      <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500">No logs yet. Start monitoring and try creating an NFT in admin panel.</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-2">
              <span className="text-gray-400">[{log.timestamp}]</span>
              <span className="ml-2">{getEmoji(log.message)}</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${getLogColor(log.level)}`}>
                {log.message}
              </span>
              {log.data && (
                <div className="ml-8 mt-1 text-xs text-gray-300">
                  <pre>{JSON.stringify(log.data, null, 2)}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Click "Start Monitoring"</li>
          <li>Go to admin panel and try to create an NFT</li>
          <li>Watch the logs here to see where the process stops</li>
          <li>Look for error messages or incomplete flows</li>
        </ol>
      </div>
    </div>
  );
}
