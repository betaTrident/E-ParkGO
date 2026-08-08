"use client";

import { useActionState, useMemo, useState } from "react";
import { Eye, EyeOff, Shield, UserPlus, UserX } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DataTable,
  type DataTableColumnDef,
} from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { SectionPanel } from "@/components/shared/section-panel";
import { StatusChip } from "@/components/shared/status-chip";
import {
  disableStaffAction,
  inviteStaffAction,
  reactivateStaffAction,
  updateStaffPermissionsAction,
  updateStaffRoleAction,
  type StaffActionState,
} from "@/features/staff/actions";
import { staffPermissionKeys } from "@/features/staff/schemas";
import type { StaffMemberRecord } from "@/features/staff/service";
import type { ActiveProfile } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const initialActionState: StaffActionState = {
  success: false,
  error: null,
  message: null,
};

const permissionLabels: Record<(typeof staffPermissionKeys)[number], string> = {
  can_approve_overrides: "Approve overrides",
  can_void_payments: "Void payments",
  can_process_lost_tickets: "Process lost tickets",
  can_correct_session_times: "Correct session times",
  can_cancel_sessions: "Cancel sessions",
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function InviteStaffDialog() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("STAFF");
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [state, formAction, isPending] = useActionState(
    inviteStaffAction,
    initialActionState,
  );

  if (state.success && open) {
    setOpen(false);
  }

  const togglePermission = (key: string, checked: boolean) => {
    setPermissions((prev) => ({ ...prev, [key]: checked }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <UserPlus aria-hidden="true" className="size-4" />
            Invite staff
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite staff member</DialogTitle>
          <DialogDescription>
            Create a local account and assign location-scoped permissions.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="role" value={role} />

          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              autoComplete="off"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-full-name">Full name</Label>
            <Input
              id="invite-full-name"
              name="fullName"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={(val) => val && setRole(val as "STAFF" | "ADMIN")} disabled={isPending}>
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-password">Temporary password</Label>
            <div className="relative">
              <Input
                id="invite-password"
                name="temporaryPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                disabled={isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs font-semibold text-muted-foreground">Permissions</p>
            <div className="space-y-2.5">
              {staffPermissionKeys.map((permission) => {
                const isChecked = !!permissions[permission];
                return (
                  <label
                    key={permission}
                    className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => togglePermission(permission, !!checked)}
                      disabled={isPending}
                    />
                    {isChecked && <input type="hidden" name={permission} value="on" />}
                    <span>{permissionLabels[permission]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create staff account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StaffActions({
  member,
  currentProfileId,
}: {
  member: StaffMemberRecord;
  currentProfileId: string;
}) {
  const [role, setRole] = useState(member.role);
  const [disableState, disableAction, disablePending] = useActionState(
    disableStaffAction,
    initialActionState,
  );
  const [reactivateState, reactivateAction, reactivatePending] = useActionState(
    reactivateStaffAction,
    initialActionState,
  );
  const [permissionsState, permissionsAction, permissionsPending] =
    useActionState(updateStaffPermissionsAction, initialActionState);
  const [roleState, roleAction, rolePending] = useActionState(
    updateStaffRoleAction,
    initialActionState,
  );

  const isSelf = member.id === currentProfileId;

  return (
    <div className="flex flex-wrap items-center gap-2 justify-end">
      {!member.is_active ? (
        <form action={reactivateAction}>
          <input type="hidden" name="targetProfileId" value={member.id} />
          <input
            type="hidden"
            name="reason"
            value="Reactivated by administrator"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={reactivatePending}
          >
            Reactivate
          </Button>
        </form>
      ) : (
        <form action={disableAction}>
          <input type="hidden" name="targetProfileId" value={member.id} />
          <input
            type="hidden"
            name="reason"
            value="Disabled by administrator"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={disablePending || isSelf}
            title={isSelf ? "You cannot disable your own account" : undefined}
          >
            <UserX aria-hidden="true" className="mr-1 size-3.5" />
            Disable
          </Button>
        </form>
      )}

      <form action={permissionsAction} className="inline-flex">
        <input type="hidden" name="targetProfileId" value={member.id} />
        {staffPermissionKeys.map((permission) => (
          <input
            key={permission}
            type="hidden"
            name={permission}
            value={member.permissions[permission] ? "on" : "off"}
          />
        ))}
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={permissionsPending || isSelf}
          title={isSelf ? "You cannot edit your own permissions" : undefined}
        >
          <Shield aria-hidden="true" className="mr-1 size-3.5" />
          Permissions
        </Button>
      </form>

      <form action={roleAction} className="inline-flex items-center gap-1.5">
        <input type="hidden" name="targetProfileId" value={member.id} />
        <input type="hidden" name="role" value={role} />
        <Select value={role} onValueChange={(val) => val && setRole(val as "STAFF" | "ADMIN")} disabled={rolePending || isSelf}>
          <SelectTrigger size="sm" className="h-8 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STAFF">Staff</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={rolePending || isSelf || role === member.role}
        >
          Save role
        </Button>
      </form>
    </div>
  );
}

interface StaffManagementProps {
  currentProfile: ActiveProfile;
  staffMembers: StaffMemberRecord[];
}

export function StaffManagement({
  currentProfile,
  staffMembers,
}: StaffManagementProps) {
  const columns = useMemo<Array<DataTableColumnDef<StaffMemberRecord>>>(
    () => [
      {
        accessorKey: "full_name",
        header: "Name",
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <Avatar className="size-7">
                <AvatarFallback className="text-[10px] font-bold">
                  {getInitials(member.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{member.full_name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.email ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant={row.original.role === "ADMIN" ? "default" : "outline"}>
            {row.original.role}
          </Badge>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusChip status={row.original.is_active ? "ACTIVE" : "DISABLED"} />
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <StaffActions
            member={row.original}
            currentProfileId={currentProfile.id}
          />
        ),
      },
    ],
    [currentProfile.id],
  );

  return (
    <SectionPanel title="Team members" bodyClassName="p-0 overflow-hidden">
      <DataTable
        className="border-0 rounded-none"
        columns={columns}
        data={staffMembers}
        getRowId={(row) => row.id}
      />
    </SectionPanel>
  );
}

export { InviteStaffDialog };
