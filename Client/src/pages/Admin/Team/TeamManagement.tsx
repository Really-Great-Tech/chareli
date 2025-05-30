import { useState } from "react";
import { MdOutlineCancel } from "react-icons/md";
import { InviteSheet } from "../../../components/single/Invite-Sheet";
import { useAllTeamMembers, useRevokeRole, useTeamInvitations, useDeleteTeamInvitation } from "../../../backend/teams.service";
import { DeleteConfirmationModal } from "../../../components/modals/DeleteConfirmationModal";
import { NoResults } from '../../../components/single/NoResults';
import { RiTeamLine } from 'react-icons/ri';
import { toast } from "sonner";
import type { User } from "../../../backend/types";
import { format } from "date-fns";

export default function TeamManagement() {
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const { data: teamData, isLoading, error } = useAllTeamMembers();
  const { data: invitationsData, isLoading: isLoadingInvitations, error: invitationsError } = useTeamInvitations();
  const revokeRole = useRevokeRole();
  const deleteInvitation = useDeleteTeamInvitation();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedInvitationId, setSelectedInvitationId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteInviteConfirmOpen, setIsDeleteInviteConfirmOpen] = useState(false);


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
      toast.error(error.response?.data?.message || 'Failed to revoke role');
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
      toast.success('Invitation has been deleted');
      setIsDeleteInviteConfirmOpen(false);
      setSelectedInvitationId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete invitation');
    }
  };

  return (
    <div className="px-4 sm:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-[#D946EF] text-3xl font-boogaloo font-bold">Team</h1>
        <InviteSheet>
          <button className="bg-[#D946EF] text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-[#c026d3] transition-all text-sm sm:text-base w-full sm:w-auto">
            Invite Team Member
          </button>
        </InviteSheet>
      </div>

      <div className="flex gap-2 sm:gap-4 mb-6 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('members')}
          className={`px-3 sm:px-4 py-2 rounded-lg transition-all whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'members' 
              ? 'bg-[#D946EF] text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
          }`}
        >
          Team Members
        </button>
        <button 
          onClick={() => setActiveTab('invitations')}
          className={`px-3 sm:px-4 py-2 rounded-lg transition-all whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'invitations' 
              ? 'bg-[#D946EF] text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
          }`}
        >
          Pending Invitations
        </button>
      </div>
      {activeTab === 'members' ? (
      <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl shadow-none border-none w-full p-6 overflow-x-auto">
        <div className="min-w-[650px]">
          <table className="w-full text-left">
          <thead>
            <tr className="text-xl font-bold text-[#121C2D] dark:text-white tracking-wide dark:font-none dark:tracking-wider">
              <th className="pb-4">Name</th>
              <th className="pb-4">Email</th>
              <th className="pb-4">Role</th>
              <th className="pb-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
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
            ) : !teamData?.filter((member: User) => 
              member.role.name.toLowerCase() !== 'player'
            )?.length ? (
              <tr>
                <td colSpan={4} className="text-center py-6">
                  <NoResults 
                    title="No team members found"
                    message="Your team doesn't have any members yet. Click 'Invite Team Member' to add someone."
                    icon={<RiTeamLine className="w-12 h-12 text-gray-400" />}
                  />
                </td>
              </tr>
            ) : teamData?.filter((member: User) => 
              member.role.name.toLowerCase() !== 'player'
            )?.map((member: User) => (
              <tr
                key={member.id}
                className="border-t border-[#d8d9da] text-md font-pincuk"
              >
                <td className="py-6 text-[#121C2D] dark:text-white">
                  {member.firstName} {member.lastName}
                </td>
                <td className="py-6 text-[#121C2D] dark:text-white">{member.email}</td>
                <td className="py-6">
                  {member.role.name.toLowerCase() === "admin" ? (
                    <span className="bg-[#D946EF] text-white px-3 py-2 rounded-lg text-md">
                      Admin
                    </span>
                  ) : (
                    <span className="bg-[#334154] text-white px-3 py-2 rounded-lg text-md">
                      {member.role.name}
                    </span>
                  )}
                </td>
                <td className="py-6">
                  <button 
                    onClick={() => handleRevokeClick(member)}
                    className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#dc2626] text-white px-3 py-1 rounded-lg text-md transition-all"
                    disabled={revokeRole.isPending && selectedUser?.id === member.id}
                  >
                    <span className="text-xl"><MdOutlineCancel className="w-4 h-4" /></span>
                    {revokeRole.isPending && selectedUser?.id === member.id ? 'Revoking...' : 'Revoke'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        </div>
      ) : (
        <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl shadow-none border-none w-full p-6 overflow-x-auto">
          <div className="min-w-[750px]">
            <table className="w-full text-left">
            <thead>
              <tr className="text-xl font-bold text-[#121C2D] dark:text-white tracking-wide dark:font-none dark:tracking-wider">
                <th className="pb-4">Email</th>
                <th className="pb-4">Role</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Invited By</th>
                <th className="pb-4">Expires At</th>
                <th className="pb-4">Action</th>
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
              ) : !invitationsData?.data?.length ? (
                <tr>
                  <td colSpan={6} className="text-center py-6">
                    <NoResults 
                      title="No pending invitations"
                      message="There are no pending team invitations at the moment."
                      icon={<RiTeamLine className="w-12 h-12 text-gray-400" />}
                    />
                  </td>
                </tr>
              ) : (
                invitationsData.data.map((invitation: any) => (
                  <tr
                    key={invitation.id}
                    className="border-t border-[#d8d9da] text-md font-pincuk"
                  >
                    <td className="py-6 text-[#121C2D] dark:text-white">
                      {invitation.email}
                    </td>
                    <td className="py-6">
                      <span className={`px-3 py-2 rounded-lg text-md ${
                        invitation.role.name.toLowerCase() === "admin"
                          ? "bg-[#D946EF] text-white"
                          : "bg-[#334154] text-white"
                      }`}>
                        {invitation.role.name}
                      </span>
                    </td>
                    <td className="py-6">
                      <span className={`px-3 py-2 rounded-lg text-md ${
                        invitation.isAccepted
                          ? "bg-green-500 text-white"
                          : "bg-yellow-500 text-white"
                      }`}>
                        {invitation.isAccepted ? 'Accepted' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-6 text-[#121C2D] dark:text-white">
                      {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                    </td>
                    <td className="py-6 text-[#121C2D] dark:text-white">
                      {format(new Date(invitation.expiresAt), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="py-6">
                      <button 
                        onClick={() => handleDeleteInviteClick(invitation.id)}
                        className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#dc2626] text-white px-3 py-1 rounded-lg text-md transition-all"
                        disabled={deleteInvitation.isPending && selectedInvitationId === invitation.id}
                      >
                        <span className="text-xl"><MdOutlineCancel className="w-4 h-4" /></span>
                        {deleteInvitation.isPending && selectedInvitationId === invitation.id ? 'Deleting...' : 'Delete'}
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
        description={selectedUser ? `Are you sure you want to revoke ${selectedUser.firstName}'s ${selectedUser.role.name} role? They will be changed to a player.` : ''}
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
