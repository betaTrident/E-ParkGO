"use client";

import { Shield, UserPlus, UserX } from "lucide-react";
import { useActionState, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface StaffManagementProps {
  currentProfile: ActiveProfile;
  staffMembers: StaffMemberRecord[];
}

function StatusBadge({ member }: { member: StaffMemberRecord }) {
  if (!member.is_active) {
    return <Badge variant="destructive">Disabled</Badge>;
  }

  return <Badge variant="secondary">Active</Badge>;
}

function InviteStaffDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    inviteStaffAction,
    initialActionState,
  );

  if (state.success && open) {
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="min-h-11 gap-2">
            <UserPlus aria-hidden="true" className="size-4" />
            Invite staff
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite staff member</DialogTitle>
          <DialogDescription>
            Create a local account and assign location-scoped permissions. The
            temporary password must be shared securely with the staff member.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
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
            <select
              id="invite-role"
              name="role"
              defaultValue="STAFF"
              disabled={isPending}
              className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-password">Temporary password</Label>
            <Input
              id="invite-password"
              name="temporaryPassword"
              type="password"
              autoComplete="new-password"
              required
              disabled={isPending}
            />
          </div>
          <fieldset className="space-y-3 rounded-lg border p-4">
            <legend className="px-1 text-sm font-medium">Permissions</legend>
            {staffPermissionKeys.map((permission) => (
              <label
                key={permission}
                className="flex min-h-10 items-center gap-3 text-sm"
              >
                <input
                  type="checkbox"
                  name={permission}
                  className="size-4 rounded border-slate-300"
                  disabled={isPending}
                />
                {permissionLabels[permission]}
              </label>
            ))}
          </fieldset>
          {state.error ? (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="min-h-11">
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
    <div className="flex flex-wrap gap-2">
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
          {reactivateState.error ? (
            <span className="sr-only">{reactivateState.error}</span>
          ) : null}
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
            <UserX aria-hidden="true" className="mr-1 size-4" />
            Disable
          </Button>
          {disableState.error ? (
            <span className="sr-only">{disableState.error}</span>
          ) : null}
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
          <Shield aria-hidden="true" className="mr-1 size-4" />
          Save permissions
        </Button>
        {permissionsState.error ? (
          <span className="sr-only">{permissionsState.error}</span>
        ) : null}
      </form>

      <form action={roleAction} className="inline-flex items-center gap-2">
        <input type="hidden" name="targetProfileId" value={member.id} />
        <select
          name="role"
          defaultValue={member.role}
          disabled={rolePending || isSelf}
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </select>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={rolePending || isSelf}
        >
          Update role
        </Button>
        {roleState.error ? (
          <span className="sr-only">{roleState.error}</span>
        ) : null}
      </form>
    </div>
  );
}

export function StaffManagement({
  currentProfile,
  staffMembers,
}: StaffManagementProps) {
  return (
    <div className="space-y-6 p-4 sm:p-6 xl:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Staff &amp; users
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Invite, disable, and manage permissions for staff in your assigned
            location. Cross-location access and self-elevation are blocked.
          </p>
        </div>
        <InviteStaffDialog />
      </div>

      <div className="hidden overflow-hidden rounded-xl border bg-white dark:bg-slate-950 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.full_name}</TableCell>
                <TableCell>{member.email ?? "—"}</TableCell>
                <TableCell className="capitalize">
                  {member.role.toLowerCase()}
                </TableCell>
                <TableCell>
                  <StatusBadge member={member} />
                </TableCell>
                <TableCell>
                  <StaffActions
                    member={member}
                    currentProfileId={currentProfile.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 md:hidden">
        {staffMembers.map((member) => (
          <article
            key={member.id}
            className="rounded-xl border bg-white p-4 shadow-xs dark:bg-slate-950"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{member.full_name}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {member.email ?? "No email on file"}
                </p>
              </div>
              <StatusBadge member={member} />
            </div>
            <p className="mt-2 text-sm capitalize text-slate-500">
              {member.role.toLowerCase()}
            </p>
            <div className="mt-4">
              <StaffActions
                member={member}
                currentProfileId={currentProfile.id}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
