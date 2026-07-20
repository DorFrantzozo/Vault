import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Mail, Phone, Building2, X, Users } from 'lucide-react';
import {
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from '../store/api/clientApi.js';
import { IClient } from '../types/api.js';
import { useModal } from '../components/common/ModalContext.js';

export default function Clients() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<IClient | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<IClient['type']>('Club');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const { data: clientsData, isLoading } = useGetClientsQuery();
  const [createClient, { isLoading: isCreating }] = useCreateClientMutation();
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
  const [deleteClient] = useDeleteClientMutation();
  const { confirm } = useModal();

  const clients = clientsData?.data?.clients || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      if (editingClient) {
        await updateClient({
          id: editingClient._id,
          name,
          type,
          contactInfo: { email: email || undefined, phone: phone || undefined },
        }).unwrap();
      } else {
        await createClient({
          name,
          type,
          contactInfo: { email: email || undefined, phone: phone || undefined },
        }).unwrap();
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save client', err);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const openEditModal = (client: IClient) => {
    setName(client.name);
    setType(client.type);
    setEmail(client.contactInfo?.email || '');
    setPhone(client.contactInfo?.phone || '');
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'הסרת לקוח',
      message: 'האם אתה בטוח שברצונך להסיר לקוח זה?',
      confirmText: 'מחק לקוח',
      type: 'danger',
    });

    if (isConfirmed) {
      try {
        await deleteClient(id).unwrap();
      } catch (err) {
        console.error('Failed to delete client', err);
      }
    }
  };

  const resetForm = () => {
    setName('');
    setType('Club');
    setEmail('');
    setPhone('');
    setEditingClient(null);
  };

  const getClientTypeHebrew = (t: IClient['type']) => {
    switch (t) {
      case 'Club':
        return 'מועדון';
      case 'Producer':
        return 'מפיק';
      case 'Restaurant':
        return 'מסעדה';
      case 'Private':
        return 'לקוח פרטי';
      default:
        return t;
    }
  };

  return (
    <div className="space-y-6 text-zinc-100 pb-6">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="text-right">
          <h1 className="text-xl font-bold tracking-tight text-white">ספר לקוחות ושותפים</h1>
          <p className="text-xs text-zinc-400 mt-0.5">ניהול מועדונים, מפיקים, מסעדות ולקוחות פרטיים</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-1.5 space-x-reverse bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-4 py-2 rounded-lg shadow-md shadow-indigo-500/20 transition-all text-xs border border-indigo-400/20 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>הוסף לקוח</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-zinc-400 text-xs">טוען לקוחות...</div>
      ) : clients.length === 0 ? (
        <div className="border border-dashed border-zinc-800/80 rounded-xl p-10 bg-zinc-950/40 flex flex-col items-center justify-center space-y-2 text-center my-4">
          <Users className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
          <p className="text-xs text-zinc-300 font-medium">טרם נרשמו לקוחות במערכת</p>
          <span className="text-[10px] text-zinc-500">לחץ על "הוסף לקוח" ליצירת כרטיס לקוח חדש</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <div
              key={c._id}
              className="bg-[#12131c] border border-zinc-800/90 rounded-xl p-5 shadow-md shadow-black/40 space-y-4 relative group hover:border-zinc-700/90 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{c.name}</h3>
                    <span className="inline-block px-2 py-0.5 mt-1 rounded bg-zinc-800 text-zinc-300 text-[10px] font-medium border border-zinc-700/60">
                      {getClientTypeHebrew(c.type)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 space-x-reverse">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1 rounded-md text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                    title="ערוך לקוח"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="p-1 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="הסר לקוח"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-zinc-800/80 text-xs text-zinc-300">
                {c.contactInfo?.email ? (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{c.contactInfo.email}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 space-x-reverse text-zinc-500">
                    <Mail className="w-3.5 h-3.5" />
                    <span>אין כתובת אימייל</span>
                  </div>
                )}
                {c.contactInfo?.phone ? (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{c.contactInfo.phone}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 space-x-reverse text-zinc-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span>אין מס טלפון</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative z-10 bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingClient ? 'עריכת לקוח' : 'הוספת לקוח חדש'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">שם הלקוח / עסק</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="מועדון זנית / חברת אקמי"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">סוג לקוח</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as IClient['type'])}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                >
                  <option value="Club">מועדון</option>
                  <option value="Producer">מפיק</option>
                  <option value="Restaurant">מסעדה</option>
                  <option value="Private">לקוח פרטי</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">אימייל (אופציונלי)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="booking@clubzenith.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700 text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">טלפון (אופציונלי)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="050-0000000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700 text-left"
                  dir="ltr"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-4 py-1.5 rounded-lg shadow-md shadow-indigo-500/20 transition-all text-xs border border-indigo-400/20 disabled:opacity-50"
                >
                  {isCreating || isUpdating ? 'שומר...' : editingClient ? 'עדכן לקוח' : 'שמור לקוח'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
