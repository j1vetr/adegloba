import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  // Note: This would need a proper API endpoint for user management
  // For now, we'll show a placeholder structure
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: false // Disabled since endpoint doesn't exist yet
  });

  // Mock data for demonstration
  const mockUsers = [
    {
      id: '1',
      email: 'captain@atlantis.com',
      firstName: 'John',
      lastName: 'Smith',
      role: 'user',
      createdAt: '2024-01-15T10:00:00Z',
      lastLogin: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      email: 'admin@starlink.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: '2024-01-21T09:15:00Z'
    }
  ];

  const filteredUsers = mockUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Users Management</h3>
        <div className="flex space-x-2">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glassmorphism border-slate-600 text-white w-64"
            data-testid="search-users-input"
          />
        </div>
      </div>

      <Card className="glassmorphism rounded-xl border-transparent overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">User</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Role</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Joined</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Last Login</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-700/50" data-testid={`user-row-${user.id}`}>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium" data-testid={`user-name-${user.id}`}>
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-300" data-testid={`user-email-${user.id}`}>
                    {user.email}
                  </td>
                  <td className="py-4 px-4" data-testid={`user-role-${user.id}`}>
                    <Badge 
                      className={`${
                        user.role === 'admin' 
                          ? 'bg-neon-purple/20 text-neon-purple' 
                          : 'bg-neon-cyan/20 text-neon-cyan'
                      } border-transparent`}
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-slate-400" data-testid={`user-joined-${user.id}`}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-slate-400" data-testid={`user-last-login-${user.id}`}>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-4 px-4" data-testid={`user-status-${user.id}`}>
                    <Badge className="bg-neon-green/20 text-neon-green border-transparent">
                      Active
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12" data-testid="no-users">
          <i className="fas fa-users text-6xl text-slate-500 mb-4"></i>
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No users found</h3>
          <p className="text-slate-500">
            {searchTerm ? `No users match "${searchTerm}"` : 'No users registered yet.'}
          </p>
        </div>
      )}

      {/* Note for implementation */}
      <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
        <div className="flex items-start space-x-2">
          <i className="fas fa-info-circle text-yellow-500 mt-0.5"></i>
          <div>
            <h4 className="text-yellow-500 font-medium">Implementation Note</h4>
            <p className="text-slate-400 text-sm">
              User management is currently showing mock data. The backend needs a proper user management API endpoint 
              to enable full functionality including role changes and user status management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
