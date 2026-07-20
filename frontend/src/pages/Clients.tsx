import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Mail, Phone, Building2, Users } from 'lucide-react';
import {
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from '../store/api/clientApi.js';
import { IClient } from '../types/api.js';
import { useModal } from '../components/common/ModalContext.js';
import { motion } from 'framer-motion';

import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 sm:space-y-8 text-[ink-black] pb-8 font-sans"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[ink-black]/10">
        <div className="text-right">
          <h1 className="text-2.5xl sm:text-3xl font-medium tracking-tight text-[ink-black] font-heading flex items-center gap-2">
            <span>ספר לקוחות ושותפים</span>
          </h1>
          <p className="text-xs text-[slate-gray] mt-1 font-sans">ניהול מועדונים, מפיקים, מסעדות ולקוחות פרטיים</p>
        </div>
        <motion.div whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
          <Button variant="default" onClick={openCreateModal} className="w-full justify-center">
            <Plus className="w-4 h-4 stroke-[2.5] ml-1.5" />
            <span>הוסף לקוח</span>
          </Button>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-[slate-gray] text-xs font-medium">טוען לקוחות...</div>
      ) : clients.length === 0 ? (
        <div className="border border-dashed border-[ink-black]/15 rounded-2xl p-10 bg-canvas-cream/50 flex flex-col items-center justify-center space-y-2 text-center my-4">
          <Users className="w-8 h-8 text-[slate-gray] stroke-[1.5]" />
          <p className="text-xs text-[slate-gray] font-bold font-heading">טרם נרשמו לקוחות במערכת</p>
          <span className="text-[10px] text-[slate-gray]">לחץ על "הוסף לקוח" ליצירת כרטיס לקוח חדש</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {clients.map((c) => (
            <motion.div key={c._id} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} className="will-change-transform">
              <Card className="p-5 sm:p-6 space-y-4 relative group hover:border-[ink-black]/30 transition-all rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="p-3 bg-canvas-cream text-[ink-black] rounded-xl border border-[ink-black]/10">
                        <Building2 className="w-5 h-5 text-[ink-black]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[ink-black] text-sm font-heading">{c.name}</h3>
                        <Badge variant="secondary" className="mt-1 font-semibold text-[ink-black]">
                          {getClientTypeHebrew(c.type)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(c)}
                        title="ערוך לקוח"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c._id)}
                        className="hover:text-[#CF4500]"
                        title="הסר לקוח"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-[ink-black]/10 text-xs text-[slate-gray]">
                    {c.contactInfo?.email ? (
                      <div className="flex items-center space-x-2 space-x-reverse truncate">
                        <Mail className="w-3.5 h-3.5 text-[ink-black] shrink-0" />
                        <span className="truncate">{c.contactInfo.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 space-x-reverse text-[slate-gray]">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span>אין כתובת אימייל</span>
                      </div>
                    )}
                    {c.contactInfo?.phone ? (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Phone className="w-3.5 h-3.5 text-[ink-black] shrink-0" />
                        <span>{c.contactInfo.phone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 space-x-reverse text-[slate-gray]">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>אין מס טלפון</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Shadcn Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{editingClient ? 'עריכת לקוח' : 'הוספת לקוח חדש'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-[slate-gray] mb-1 uppercase tracking-wider font-heading">שם הלקוח / עסק</label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="מועדון זנית / חברת אקמי"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[slate-gray] mb-1 uppercase tracking-wider font-heading">סוג לקוח</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IClient['type'])}
                className="w-full h-10 bg-canvas-cream border border-[ink-black]/15 rounded-xl px-4 py-2 text-xs text-[ink-black] focus:outline-none focus:border-[ink-black] focus:bg-white transition-all"
              >
                <option value="Club">מועדון</option>
                <option value="Producer">מפיק</option>
                <option value="Restaurant">מסעדה</option>
                <option value="Private">לקוח פרטי</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[slate-gray] mb-1 uppercase tracking-wider font-heading">אימייל (אופציונלי)</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="booking@clubzenith.com"
                className="text-left"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[slate-gray] mb-1 uppercase tracking-wider font-heading">טלפון (אופציונלי)</label>
              <Input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-0000000"
                className="text-left"
                dir="ltr"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2 space-x-reverse border-t border-[ink-black]/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? 'שומר...' : editingClient ? 'עדכן לקוח' : 'שמור לקוח'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

