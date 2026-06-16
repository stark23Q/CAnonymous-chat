"use client";

import type { ReactNode } from "react";
import { Ban, Check, Copy, Database, Flag, HardDrive, LockKeyhole, ShieldAlert, UserMinus, UserPlus, Users, X } from "lucide-react";
import type { AdminUser, Community, JoinRequest, Member } from "@/lib/types";
import { AnonymousAvatar } from "@/components/anonymous-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AdminReport = {
  id: string;
  messageId: string;
  reason: string;
  createdAt: string;
  status: "OPEN" | "REVIEWED" | "DISMISSED" | "ACTIONED";
};

export function AdminPanel({
  community,
  requests,
  members,
  onApprove,
  onReject,
  onUpdateName,
  onTogglePrivacy,
  onToggleReadReceipts,
  onToggleTyping,
  onToggleE2EE,
  onCreateInvite,
  onDeleteRoom,
  onRetentionChange,
  onToggleBan,
  latestInvite,
  busyRequestId,
  reports,
  onReviewReport,
  adminUsers,
  onLoadAdminUsers
}: {
  community: Community;
  requests: JoinRequest[];
  members: Member[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onUpdateName: (newName: string) => Promise<void>;
  onTogglePrivacy: (enabled: boolean) => void;
  onToggleReadReceipts: (enabled: boolean) => void;
  onToggleTyping: (enabled: boolean) => void;
  onToggleE2EE: (enabled: boolean) => void;
  onCreateInvite: () => void;
  onDeleteRoom: () => void;
  onRetentionChange: (policy: Community["retentionPolicy"]) => void;
  onToggleBan: (member: Member) => void;
  latestInvite: string | null;
  busyRequestId: string | null;
  reports: AdminReport[];
  onReviewReport: (reportId: string, action: "DISMISSED" | "ACTIONED") => void;
  adminUsers?: AdminUser[] | null;
  onLoadAdminUsers?: () => void;
}) {
  const openReports = reports.filter((r) => r.status === "OPEN");

  return (
    <aside className="hidden h-full min-h-0 w-[344px] shrink-0 border-l border-white/5 glass-panel xl:block">
      <div className="flex min-h-0 h-full flex-col">
        <div className="border-b border-white/5 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Admin</h2>
              <p className="mt-1 text-xs text-muted-foreground">{community.memberCount} anonymous members</p>
            </div>
            <Badge tone="good">NoTrace</Badge>
          </div>
        </div>

        <Tabs defaultValue="queue" className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-white/5 px-4 py-3">
            <TabsList className="grid w-full grid-cols-5 bg-black/40 border border-white/5 h-10 px-1 text-xs">
              <TabsTrigger value="queue" className="text-[10px]">Queue</TabsTrigger>
              <TabsTrigger value="settings" className="text-[10px]">Settings</TabsTrigger>
              <TabsTrigger value="members" className="text-[10px]">Members</TabsTrigger>
              <TabsTrigger value="users" className="text-[10px]" onClick={() => onLoadAdminUsers?.()}>Users</TabsTrigger>
              <TabsTrigger value="reports" className="relative text-[10px]">
                Reports
                {openReports.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {openReports.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── QUEUE TAB ── */}
          <TabsContent value="queue" className="scrollbar-thin m-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-3">
              <UserPlus className="h-4 w-4 text-primary" aria-hidden />
              <Input value={latestInvite ?? "Create a live invite"} readOnly className="h-8 text-xs border-0 bg-transparent" />
              <Button
                type="button"
                variant="ghost"
                size="iconSm"
                onClick={() => {
                  if (latestInvite) {
                    void navigator.clipboard?.writeText(latestInvite);
                    return;
                  }
                  onCreateInvite();
                }}
              >
                <Copy className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            <Button type="button" variant="secondary" size="sm" className="mb-4 w-full shadow-[0_0_15px_-3px] shadow-secondary/20 hover:shadow-secondary/40 transition-all hover:scale-[1.02]" onClick={onCreateInvite}>
              <UserPlus className="h-4 w-4" aria-hidden />
              Generate invite
            </Button>

            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="rounded-lg border border-white/10 bg-black/40 p-3 transition-colors hover:border-primary/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{request.requestedAlias ?? "Auto alias"}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{request.groupName}</div>
                    </div>
                    <Badge tone="warn">{request.status.toLowerCase()}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-5 text-muted-foreground">{request.reason}</p>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyRequestId === request.id || request.status !== "PENDING"}
                      onClick={() => onReject(request.id)}
                    >
                      <X className="h-4 w-4" aria-hidden />
                      Reject
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyRequestId === request.id || request.status !== "PENDING"}
                      onClick={() => onApprove(request.id)}
                    >
                      <Check className="h-4 w-4" aria-hidden />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
              {requests.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">No pending join requests.</p>
              )}
            </div>
          </TabsContent>

          {/* ── SETTINGS TAB ── */}
          <TabsContent value="settings" className="scrollbar-thin m-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                <label className="text-sm font-semibold text-foreground">Group Name</label>
                <div className="flex items-center gap-2">
                  <Input
                    defaultValue={community.name}
                    className="h-8 bg-black/50 text-sm"
                    maxLength={80}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value.trim() !== community.name) {
                        void onUpdateName(e.target.value.trim());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = e.currentTarget.value.trim();
                        if (val && val !== community.name) void onUpdateName(val);
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Press Enter or click outside to save.</p>
              </div>

              <div className="space-y-3">
                <SettingRow
                  icon={<LockKeyhole className="h-4 w-4" aria-hidden />}
                title="Privacy mode"
                detail="Hide online and last-seen state"
                checked={community.privacyMode}
                onCheckedChange={onTogglePrivacy}
              />
              <SettingRow
                icon={<LockKeyhole className="h-4 w-4" aria-hidden />}
                title="E2EE mode"
                detail="End-to-end encryption for all channels"
                checked={community.e2eeMode}
                onCheckedChange={onToggleE2EE}
              />
              <SettingRow
                icon={<ShieldAlert className="h-4 w-4" aria-hidden />}
                title="Read receipts"
                detail="Show who has seen messages"
                checked={community.readReceiptsEnabled}
                onCheckedChange={onToggleReadReceipts}
              />
              <SettingRow
                icon={<Database className="h-4 w-4" aria-hidden />}
                title="Typing indicators"
                detail="Show when someone is typing"
                checked={community.typingEnabled}
                onCheckedChange={onToggleTyping}
              />
            </div>
            <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-xs font-bold uppercase text-muted-foreground">Retention</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ["24 hours", "HOURS_24"],
                  ["7 days", "DAYS_7"],
                  ["30 days", "DAYS_30"],
                  ["Never", "NEVER"]
                ].map(([label, policy]) => (
                  <Button
                    key={label}
                    type="button"
                    variant={community.retentionPolicy === policy ? "secondary" : "outline"}
                    size="sm"
                    className="justify-center"
                    onClick={() => onRetentionChange(policy as Community["retentionPolicy"])}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <div className="text-xs font-bold uppercase text-red-500/80 mb-2">Danger Zone</div>
              <p className="text-xs text-muted-foreground mb-3">Deleting this room will permanently remove all channels, messages, and members.</p>
              <Button type="button" variant="destructive" size="sm" className="w-full justify-center shadow-[0_0_15px_-3px] shadow-red-500/20 hover:shadow-red-500/40" onClick={onDeleteRoom}>
                <Ban className="h-4 w-4 mr-2" aria-hidden />
                Delete Room
              </Button>
            </div>
          </div>
          </TabsContent>

          {/* ── MEMBERS TAB ── */}
          <TabsContent value="members" className="scrollbar-thin m-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3 hover:bg-black/60 transition-colors">
                  <AnonymousAvatar seed={member.avatarSeed} name={member.anonymousName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{member.anonymousName}</div>
                    <div className="text-xs text-muted-foreground">{member.status.toLowerCase()}</div>
                  </div>
                  <Button type="button" variant="ghost" size="iconSm" onClick={() => onToggleBan(member)}>
                    {member.status === "BANNED" ? <UserMinus className="h-4 w-4" aria-hidden /> : <Ban className="h-4 w-4" aria-hidden />}
                  </Button>
                </div>
              ))}
              {members.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">No members yet.</p>
              )}
            </div>
          </TabsContent>

          {/* ── REPORTS TAB ── */}
          <TabsContent value="reports" className="scrollbar-thin m-0 flex-1 overflow-y-auto px-4 py-4">
            {reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-green-500/10 text-green-400">
                  <Flag className="h-6 w-6" aria-hidden />
                </div>
                <p className="text-sm font-semibold text-foreground">All clear!</p>
                <p className="text-xs text-muted-foreground">No reported messages in this room.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      report.status === "OPEN"
                        ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
                        : "border-white/10 bg-black/40 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Flag className="h-3.5 w-3.5 text-red-400 shrink-0" aria-hidden />
                        <span className="text-xs font-semibold text-red-300">Reported message</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${
                        report.status === "OPEN" ? "bg-red-500/20 text-red-300" :
                        report.status === "ACTIONED" ? "bg-green-500/20 text-green-300" :
                        "bg-white/10 text-muted-foreground"
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">{report.reason}</p>
                    {report.status === "OPEN" && (
                      <div className="mt-3 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => onReviewReport(report.id, "DISMISSED")}
                        >
                          <X className="h-3.5 w-3.5 mr-1" aria-hidden />
                          Dismiss
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="text-xs"
                          onClick={() => onReviewReport(report.id, "ACTIONED")}
                        >
                          <Ban className="h-3.5 w-3.5 mr-1" aria-hidden />
                          Action
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── USERS TAB (Global Admin) ── */}
          <TabsContent value="users" className="scrollbar-thin m-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              {!adminUsers ? (
                <div className="text-center py-8 text-sm text-muted-foreground">Loading users...</div>
              ) : adminUsers.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No users found.</div>
              ) : (
                adminUsers.map((u) => (
                  <div key={u.id} className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-3 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold font-mono text-primary truncate max-w-[150px]" title={u.id}>
                          {u.id.substring(0, 10)}...
                        </span>
                        <span className="text-[10px] text-muted-foreground">Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                      {u.role === "ADMIN" && <Badge tone="good">ADMIN</Badge>}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Current Base Alias:</span>
                        <span className="font-semibold">{u.anonymousName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Last IP:</span>
                        <span className="font-mono text-orange-300">{u.lastIp || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Active Sessions:</span>
                        <span>{u.sessionCount}</span>
                      </div>
                    </div>

                    {u.aliases.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/5 space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Group Aliases</p>
                        <div className="space-y-1">
                          {u.aliases.map((alias) => (
                            <div key={alias.groupId} className="flex flex-col gap-0.5 rounded bg-white/5 p-1.5">
                              <span className="text-[10px] font-semibold text-blue-300 truncate">{alias.groupName}</span>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-foreground">{alias.anonymousName}</span>
                                <span className="text-muted-foreground">{alias.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}

function SettingRow({
  icon,
  title,
  detail,
  checked,
  onCheckedChange
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3 hover:bg-black/60 transition-colors">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/5 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{detail}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
