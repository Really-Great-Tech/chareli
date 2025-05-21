import { useState } from "react";
import { MdOutlineCancel } from "react-icons/md";
import { InviteSheet } from "../../../components/single/Invite-Sheet";
import { useAllTeamMembers, useRevokeRole } from "../../../backend/teams.service";
import { DeleteConfirmationModal } from "../../../components/modals/DeleteConfirmationModal";
import { NoResults } from '../../../components/single/NoResults';
import { RiTeamLine } from 'react-icons/ri';
import { toast } from "sonner";
import type { User } from "../../../backend/types";

export default function TeamManagement() {
  const { data: teamData, isLoading, error } = useAllTeamMembers();
  const revokeRole = useRevokeRole();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  return (
    <div className="px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#D946EF] text-3xl font-boogaloo font-bold">Team</h1>
        <InviteSheet>
          <button className="bg-[#D946EF] text-white px-4 py-3 rounded-lg hover:bg-[#c026d3] transition-all">
            Invite Team Member
          </button>
        </InviteSheet>
      </div>
      <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-2xl shadow-none border-none w-full p-6">
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
            ) : !(teamData || []).filter((member: User) => 
              member.role.name.toLowerCase() !== 'player'
            ).length ? (
              <tr>
                <td colSpan={4} className="text-center py-6">
                  <NoResults 
                    title="No team members found"
                    message="Your team doesn't have any members yet. Click 'Invite Team Member' to add someone."
                    icon={<RiTeamLine className="w-12 h-12 text-gray-400" />}
                  />
                </td>
              </tr>
            ) : (teamData || []).filter((member: User) => 
              member.role.name.toLowerCase() !== 'player'
            ).map((member: User) => (
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
    </div>
  );
}
