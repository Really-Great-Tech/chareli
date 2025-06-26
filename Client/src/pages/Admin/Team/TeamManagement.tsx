import { useState } from "react";
import { MdOutlineCancel } from "react-icons/md";
import { InviteSheet } from "../../../components/single/Invite-Sheet";
import {
  useAllTeamMembers,
  useRevokeRole,
  useTeamInvitations,
  useDeleteTeamInvitation,
} from "../../../backend/teams.service";
import { DeleteConfirmationModal } from "../../../components/modals/DeleteConfirmationModal";
import { NoResults } from "../../../components/single/NoResults";
import { RiTeamLine } from "react-icons/ri";
import { toast } from "sonner";
import type { User } from "../../../backend/types";
import { format } from "date-fns";
import { useAuth } from "../../../context/AuthContext";

export default function TeamManagement() {
  const { user } = useAuth();
  // const isAdmin = user?.role?.name?.toLowerCase() === 'admin';
  const isSuperAdmin = user?.role?.name?.toLowerCase() === "superadmin";
  const [activeTab, setActiveTab] = useState<"members" | "invitations">(
    "members"
  );
  const { data: teamData, isLoading, error } = useAllTeamMembers();
  const {
    data: invitationsData,
    isLoading: isLoadingInvitations,
    error: invitationsError,
  } = useTeamInvitations();
  const revokeRole = useRevokeRole();
  const deleteInvitation = useDeleteTeamInvitation();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedInvitationId, setSelectedInvitationId] = useState<
    string | null
  >(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteInviteConfirmOpen, setIsDeleteInviteConfirmOpen] =
    useState(false);

  const handleRevokeClick = (user: User) => {
    setSelectedUser(user);
    setIsConfirmOpen(true);
  };

  const handleConfirmRevoke = async () => {
    if (!selectedUser) return;

    try {
      await revokeRole.mutateAsync(selectedUser.id);
      toast.success(`${selectedUser.firstName}'s role has been revoked`);
      setIsConfirmOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.log(error, "revoke error");
      // const { message, type } = getErrorMessage(error, 'Failed to revoke role');
      // if (type === 'warning') {
      //   toast.warning(message);
      // } else {
      //   toast.error(message);
      // }
    }
  };

  const handleDeleteInviteClick = (id: string) => {
    setSelectedInvitationId(id);
    setIsDeleteInviteConfirmOpen(true);
  };

  const handleConfirmDeleteInvite = async () => {
    if (!selectedInvitationId) return;

    try {
      await deleteInvitation.mutateAsync(selectedInvitationId);
      toast.success("Invitation has been deleted");
      setIsDeleteInviteConfirmOpen(false);
      setSelectedInvitationId(null);
    } catch (error: any) {
      console.log(error);
      // const { message, type } = getErrorMessage(error, 'Failed to delete invitation');
      // if (type === 'warning') {
      //   toast.warning(message);
      // } else {
      //   toast.error(message);
      // }
    }
  };

  return (
    <div className="px-4 sm:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-[#D946EF] text-2xl sm:text-3xl font-worksans ">
          Team Management
        </h1>
        <InviteSheet>
          <button className="bg-[#D946EF] text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-[#c026d3] transition-all text-sm sm:text-base w-full sm:w-auto font-dmmono">
            Invite Team Member
          </button>
        </InviteSheet>
      </div>

      <div className="flex gap-2 sm:gap-4 mb-6 overflow-x-auto font-dmmono pb-2">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 sm:py-3 rounded-lg transition-all whitespace-nowrap text-xs sm:text-sm md:text-base flex-shrink-0 ${
            activeTab === "members"
              ? "bg-[#D946EF] text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          }`}
        >
          Team Members
        </button>
        <button
          onClick={() => setActiveTab("invitations")}
          className={`px-4 py-2 sm:py-3 rounded-lg transition-all whitespace-nowrap text-xs sm:text-sm md:text-base flex-shrink-0 ${
            activeTab === "invitations"
              ? "bg-[#D946EF] text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          }`}
        >
          Pending Invitations
        </button>
      </div>
      {activeTab === "members" ? (
        <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl shadow-none border-none w-full p-6 overflow-x-auto">
          <div className="min-w-[650px]">
            <table className="w-full text-left">
              <thead>
                <tr className="text-base text-[#121C2D] dark:text-white tracking-wide dark:font-none dark:tracking-wider sm:text-lg">
                  <th className="pb- font-normal">Name</th>
                  <th className="pb- font-normal">Email</th>
                  <th className="pb- font-normal">Role</th>
                  {isSuperAdmin && <th className="pb- font-normal">Action</th>}
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr className="font-worksans">
                    <td colSpan={4} className="text-center py-6 text-red-500">
                      Failed to load team members. Please try again.
                    </td>
                  </tr>
                ) : isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D946EF] mx-auto"></div>
                    </td>
                  </tr>
                ) : !teamData?.filter(
                    (member: User) =>
                      member.role.name.toLowerCase() !== "player"
                  )?.length ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6">
                      <NoResults
                        title="No team members found"
                        message="Your team doesn't have any members yet. Click 'Invite Team Member' to add someone."
                        icon={
                          <RiTeamLine className="w-12 h-12 text-gray-400" />
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  teamData
                    ?.filter(
                      (member: User) =>
                        member.role.name.toLowerCase() !== "player"
                    )
                    ?.map((member: User) => (
                      <tr
                        key={member.id}
                        className="border-t border-[#d8d9da] text-sm font-worksans font-normal tracking-wider"
                      >
                        <td className="py-6 text-[#121C2D] dark:text-white">
                          {member.firstName || ""} {member.lastName || ""}
                        </td>
                        <td className="py-6 text-[#121C2D] dark:text-white">
                          {member.email}
                        </td>
                        <td className="py-6">
                          {member.role.name.toLowerCase() === "admin" ? (
                            <span className="bg-[#D946EF] text-white px-3 py-2 rounded-lg text-md">
                              Admin
                            </span>
                          ) : member.role.name.toLowerCase() ===
                            "superadmin" ? (
                            <span className="bg-[#7C3AED] text-white px-3 py-2 rounded-lg text-md">
                              SuperAdmin
                            </span>
                          ) : (
                            <span className="bg-[#334154] text-white px-3 py-2 rounded-lg text-md">
                              {member.role.name}
                            </span>
                          )}
                        </td>
                        {isSuperAdmin && (
                          <td className="py-6">
                            {member.id !== user?.id ? (
                              <button
                                onClick={() => handleRevokeClick(member)}
                                className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#dc2626] text-white px-3 py-1 rounded-lg text-md transition-all"
                                disabled={
                                  revokeRole.isPending &&
                                  selectedUser?.id === member.id
                                }
                              >
                                <span className="text-xl">
                                  <MdOutlineCancel className="w-4 h-4" />
                                </span>
                                {revokeRole.isPending &&
                                selectedUser?.id === member.id
                                  ? "Revoking..."
                                  : "Revoke"}
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                Cannot revoke self
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl shadow-none border-none w-full p-3 sm:p-6 overflow-x-auto">
          <div className="min-w-[600px] sm:min-w-[750px]">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs sm:text-base lg:text-lg text-[#121C2D] dark:text-white tracking-wide dark:font-none dark:tracking-wider">
                  <th className="pb-2 sm:pb-4 font-normal pr-1 sm:pr-2">Email</th>
                  <th className="pb-2 sm:pb-4 font-normal pr-1 sm:pr-2">Role</th>
                  <th className="pb-2 sm:pb-4 font-normal pr-1 sm:pr-2">Status</th>
                  <th className="pb-2 sm:pb-4 font-normal pr-1 sm:pr-2">Invited By</th>
                  <th className="pb-2 sm:pb-4 font-normal pr-1 sm:pr-2">Expires At</th>
                  <th className="pb-2 sm:pb-4 font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                {invitationsError ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-red-500">
                      Failed to load invitations. Please try again.
                    </td>
                  </tr>
                ) : isLoadingInvitations ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D946EF] mx-auto"></div>
                    </td>
                  </tr>
                ) : !invitationsData?.data?.filter(
                    (invitation: any) => !invitation.isAccepted
                  )?.length ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6">
                      <NoResults
                        title="No pending invitations"
                        message="There are no pending team invitations at the moment."
                        icon={
                          <RiTeamLine className="w-12 h-12 text-gray-400" />
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  invitationsData.data
                    .filter((invitation: any) => !invitation.isAccepted)
                    .map((invitation: any) => (
                      <tr
                        key={invitation.id}
                        className="border-t border-[#d8d9da] font-worksans text-xs sm:text-sm tracking-wider"
                      >
                        <td className="py-3 sm:py-6 text-[#121C2D] dark:text-white pr-2 max-w-[120px] sm:max-w-none truncate">
                          {invitation.email}
                        </td>
                        <td className="py-3 sm:py-6 pr-1 sm:pr-2">
                          <span
                            className={`px-1 sm:px-2 py-1 rounded text-xs ${
                              invitation.role.name.toLowerCase() === "admin"
                                ? "bg-[#D946EF] text-white"
                                : "bg-[#334154] text-white"
                            }`}
                          >
                            {invitation.role.name}
                          </span>
                        </td>
                        <td className="py-3 sm:py-6 pr-1 sm:pr-2">
                          <span className="px-1 sm:px-2 py-1 rounded text-xs bg-yellow-500 text-white">
                            Pending
                          </span>
                        </td>
                        <td className="py-3 sm:py-6 text-[#121C2D] dark:text-white pr-1 sm:pr-2 text-xs sm:text-sm">
                          {invitation.invitedBy.firstName}{" "}
                          {invitation.invitedBy.lastName}
                        </td>
                        <td className="py-3 sm:py-6 text-[#121C2D] dark:text-white pr-1 sm:pr-2 text-xs sm:text-sm">
                          {format(
                            new Date(invitation.expiresAt),
                            "MMM d, h:mm a"
                          )}
                        </td>
                        <td className="py-3 sm:py-6">
                          <button
                            onClick={() =>
                              handleDeleteInviteClick(invitation.id)
                            }
                            className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#dc2626] text-white px-3 py-1 rounded-lg text-md transition-all"
                            disabled={
                              deleteInvitation.isPending &&
                              selectedInvitationId === invitation.id
                            }
                          >
                            <span className="text-xl">
                              <MdOutlineCancel className="w-4 h-4" />
                            </span>
                            {deleteInvitation.isPending &&
                            selectedInvitationId === invitation.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleConfirmRevoke}
        isDeleting={revokeRole.isPending}
        title="Revoke Team Member Role?"
        description={
          selectedUser
            ? `Are you sure you want to revoke ${selectedUser.firstName}'s ${selectedUser.role.name} role? They will be changed to a player.`
            : ""
        }
        confirmButtonText="Revoke"
        loadingText="Revoking..."
      />

      <DeleteConfirmationModal
        open={isDeleteInviteConfirmOpen}
        onOpenChange={setIsDeleteInviteConfirmOpen}
        onConfirm={handleConfirmDeleteInvite}
        isDeleting={deleteInvitation.isPending}
        title="Delete Team Invitation?"
        description="Are you sure you want to delete this invitation? This action cannot be undone."
        confirmButtonText="Delete"
        loadingText="Deleting..."
      />
    </div>
  );
}
