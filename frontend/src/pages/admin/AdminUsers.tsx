import React, { useEffect, useState } from 'react'
import { Users, CheckCircle, XCircle, Search, Shield, GraduationCap } from 'lucide-react'
import { adminGetUsers, adminUpdateUser } from '../../services/api'

interface UserRow {
    id: number
    name: string
    email: string
    is_admin: boolean
    is_active: boolean
    department_id: number | null
    semester: number | null
    created_at: string
    exams_count: number
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserRow[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [updating, setUpdating] = useState<number | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await adminGetUsers()
            setUsers(res.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const toggleActive = async (user: UserRow) => {
        setUpdating(user.id)
        try {
            const res = await adminUpdateUser(user.id, { is_active: !user.is_active })
            setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)))
        } catch (e) {
            console.error(e)
        } finally {
            setUpdating(null)
        }
    }

    const filtered = users.filter(
        (u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900">User Management</h1>
                <p className="text-gray-500 mt-1">View and manage all registered users</p>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-6 py-4 font-semibold text-gray-600">User</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-600">Role</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-600">Sem</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-600">Exams</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-600">Joined</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-600">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{user.name}</p>
                                                    <p className="text-gray-400 text-xs">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_admin ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                                                    <Shield className="w-3 h-3" /> Admin
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                                                    <GraduationCap className="w-3 h-3" /> Student
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {user.semester ? `Sem ${user.semester}` : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-gray-900">{user.exams_count}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_active ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                                                    <CheckCircle className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold">
                                                    <XCircle className="w-3 h-3" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {!user.is_admin && (
                                                <button
                                                    onClick={() => toggleActive(user)}
                                                    disabled={updating === user.id}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${user.is_active
                                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                                                        } disabled:opacity-50`}
                                                >
                                                    {updating === user.id ? '…' : user.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-400">{filtered.length} user{filtered.length !== 1 ? 's' : ''} shown</p>
        </div>
    )
}
