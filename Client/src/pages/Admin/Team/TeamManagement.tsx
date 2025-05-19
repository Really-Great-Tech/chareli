// import React from "react";
import { MdOutlineCancel } from "react-icons/md";
import { InviteSheet } from "../../../components/single/Invite-Sheet"

const teamMembers = [
  {
    name: "John Doe",
    email: "john@email.com",
    role: "Admin",
  },
  {
    name: "John Doe",
    email: "john@email.com",
    role: "Admin",
  },
  {
    name: "John Doe",
    email: "john@email.com",
    role: "Super Admin",
  },
];

export default function TeamManagement() {
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
            {teamMembers.map((member, idx) => (
              <tr
                key={idx}
                className="border-t border-[#d8d9da] text-md font-pincuk"
              >
                <td className="py-6 text-[#121C2D] dark:text-white">{member.name}</td>
                <td className="py-6 text-[#121C2D] dark:text-white">{member.email}</td>
                <td className="py-6">
                  {member.role === "Admin" ? (
                    <span className="bg-[#D946EF] text-white px-3 py-2 rounded-lg text-md">
                      Admin
                    </span>
                  ) : (
                    <span className="bg-[#334154] text-white px-3 py-2 rounded-lg text-md">
                      Super Admin
                    </span>
                  )}
                </td>
                <td className="py-6">
                  <button className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#dc2626] text-white px-3  py-1 rounded-lg text-md transition-all">
                    <span className="text-xl"><MdOutlineCancel className="w-4 h-4" /></span> Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
