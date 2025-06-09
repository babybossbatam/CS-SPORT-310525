
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { auditLocalFlags, generateFlagDownloadList, getPriorityFlags, type LocalFlagInfo } from '@/lib/flagManager';

export const FlagAudit: React.FC = () => {
  const [auditResults, setAuditResults] = useState<{
    existing: LocalFlagInfo[];
    missing: LocalFlagInfo[];
    total: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runAudit = async () => {
    setIsLoading(true);
    try {
      const results = await auditLocalFlags();
      setAuditResults(results);
    } catch (error) {
      console.error('Failed to audit flags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPriorityList = () => {
    const priorityFlags = getPriorityFlags();
    const list = generateFlagDownloadList(priorityFlags);
    
    // Create downloadable text file
    const blob = new Blob([list], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'priority-flags-download-list.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadMissingList = () => {
    if (!auditResults) return;
    
    const list = generateFlagDownloadList(auditResults.missing);
    
    // Create downloadable text file
    const blob = new Blob([list], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'missing-flags-download-list.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>🎌 Local Flag Audit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runAudit} disabled={isLoading}>
            {isLoading ? 'Auditing...' : 'Run Flag Audit'}
          </Button>
          <Button variant="outline" onClick={downloadPriorityList}>
            Download Priority List
          </Button>
          {auditResults && (
            <Button variant="outline" onClick={downloadMissingList}>
              Download Missing List
            </Button>
          )}
        </div>

        {auditResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {auditResults.existing.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Existing Flags</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {auditResults.missing.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Missing Flags</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {((auditResults.existing.length / auditResults.total) * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Coverage</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">✅ Existing Flags ({auditResults.existing.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {auditResults.existing.slice(0, 20).map(flag => (
                      <div key={flag.countryCode} className="flex items-center gap-2">
                        <Badge variant="secondary">{flag.countryCode}</Badge>
                        <span className="text-sm">{flag.countryName}</span>
                      </div>
                    ))}
                    {auditResults.existing.length > 20 && (
                      <p className="text-sm text-muted-foreground">
                        ... and {auditResults.existing.length - 20} more
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">❌ Missing Flags ({auditResults.missing.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {auditResults.missing.slice(0, 20).map(flag => (
                      <div key={flag.countryCode} className="flex items-center gap-2">
                        <Badge variant="destructive">{flag.countryCode}</Badge>
                        <span className="text-sm">{flag.countryName}</span>
                      </div>
                    ))}
                    {auditResults.missing.length > 20 && (
                      <p className="text-sm text-muted-foreground">
                        ... and {auditResults.missing.length - 20} more
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
