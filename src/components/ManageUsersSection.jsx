import React from 'react';

const STYLES = {
  input: "p-3 border-4 border-gray-200 rounded-xl text-lg bg-white focus:outline-none transition flex-1",
  addButton: "bg-green-700 text-white w-12 h-12 rounded-xl text-2xl font-bold hover:bg-green-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center",
  table: {
    container: "bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden",
    header: "px-6 py-3 text-left text-sm font-semibold text-gray-700",
    cell: "px-6 py-4 text-gray-800",
    removeButton: "text-red-600 hover:text-red-800 font-semibold transition-colors",
  },
};

export default function ManageUsersSection({
  users,
  searchQuery,
  newUserName,
  onSearchChange,
  onNewNameChange,
  onAddUser,
  onDeleteUser,
}) {
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-green-800 mb-6">Manage Customers</h2>
      
      {/* Search and Add User - Full Width */}
      <div className="flex gap-4 mb-6 items-center w-full">
        <input
          type="text"
          placeholder="🔍 search name"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={STYLES.input}
        />
        <input
          type="text"
          placeholder="enter name to add"
          value={newUserName}
          onChange={(e) => onNewNameChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAddUser()}
          className={STYLES.input}
        />
        <button onClick={onAddUser} className={STYLES.addButton}>
          +
        </button>
      </div>

      {/* Users List */}
      <div className={STYLES.table.container}>
        {users.length === 0 ? (
          <p className="text-center text-gray-600 p-6">No approved users yet.</p>
        ) : (
          <>
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className={`${STYLES.table.header} w-3/4`}>Name</th>
                  <th className={`${STYLES.table.header} w-1/4`}>Actions</th>
                </tr>
              </thead>
            </table>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full table-fixed">
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className={`${STYLES.table.cell} w-3/4`}>{u.name}</td>
                      <td className="px-6 py-4 w-1/4">
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className={STYLES.table.removeButton}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {searchQuery && filteredUsers.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No users found matching "{searchQuery}"
              </p>
            )}
          </>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-2">{users.length} total users</p>
    </div>
  );
}

