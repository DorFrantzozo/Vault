import React, {useState, useMemo, useEffect} from "react";
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Pencil,
  FileSpreadsheet,
  Users,
  Search,
  Paperclip,
} from "lucide-react";
import {
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} from "../store/api/transactionApi.js";
import {
  useGetClientsQuery,
  useCreateClientMutation,
} from "../store/api/clientApi.js";
import {ITransaction} from "../types/api.js";
import {FileDropzone} from "../components/ledger/FileDropzone.js";
import {useModal} from "../components/common/ModalContext.js";

import {Card} from "../components/ui/card";
import {Button} from "../components/ui/button";
import {Badge} from "../components/ui/badge";
import {Input} from "../components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import {Pagination} from "../components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

export default function Ledger() {
  const {confirm} = useModal();
  const [filterType, setFilterType] = useState<"ALL" | "Income" | "Expense">(
    "ALL",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<
    string | null
  >(null);

  // Quick Client State inside modal
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientType, setNewClientType] = useState<
    "Club" | "Producer" | "Restaurant" | "Private"
  >("Club");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [quickClientError, setQuickClientError] = useState("");

  // Form State
  const [type, setType] = useState<"Income" | "Expense">("Income");
  const [amount, setAmount] = useState<string>("");
  const [serviceType, setServiceType] = useState<
    "DJ Gig" | "Software Development" | "Maintenance" | "Consulting" | "General"
  >("DJ Gig");
  const [clientId, setClientId] = useState("");
  const [eventId, setEventId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Queries
  const {data: transData, isLoading} = useGetTransactionsQuery();
  const {data: clientsData} = useGetClientsQuery();

  // Mutations
  const [createTransaction, {isLoading: isCreating}] =
    useCreateTransactionMutation();
  const [updateTransaction, {isLoading: isUpdating}] =
    useUpdateTransactionMutation();
  const [deleteTransaction] = useDeleteTransactionMutation();
  const [createClient, {isLoading: isCreatingClient}] =
    useCreateClientMutation();

  const transactions = transData?.data?.transactions || [];
  const clients = clientsData?.data?.clients || [];

  const handleOpenCreateModal = () => {
    resetForm();
    setEditingTransactionId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: ITransaction) => {
    setEditingTransactionId(t._id);
    setType(t.type);
    setAmount(t.amount.toString());
    setServiceType(t.serviceType || "General");
    setClientId(typeof t.client === "object" ? t.client._id : t.client || "");
    setEventId(
      typeof t.relatedEvent === "object"
        ? t.relatedEvent._id
        : t.relatedEvent || "",
    );
    setDate(new Date(t.date).toISOString().split("T")[0]);
    setNotes(t.notes || "");
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleQuickClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) {
      setQuickClientError("שם לקוח הוא שדה חובה");
      return;
    }
    setQuickClientError("");
    try {
      const res = await createClient({
        name: newClientName,
        type: newClientType,
        contactInfo: {
          email: newClientEmail || undefined,
          phone: newClientPhone || undefined,
        },
      }).unwrap();

      if (res.data?.client?._id) {
        setClientId(res.data.client._id);
      }
      setIsQuickClientOpen(false);
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPhone("");
    } catch (err: any) {
      setQuickClientError(err?.data?.message || "שגיאה ביצירת לקוח חדש");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("amount", amount);
      if (type === "Income" && serviceType) {
        formData.append("serviceType", serviceType);
      }
      if (clientId) formData.append("client", clientId);
      if (eventId) formData.append("relatedEvent", eventId);
      formData.append("date", new Date(date).toISOString());
      if (notes) formData.append("notes", notes);
      if (selectedFile) formData.append("receipt", selectedFile);

      if (editingTransactionId) {
        await updateTransaction({id: editingTransactionId, formData}).unwrap();
      } else {
        await createTransaction(formData).unwrap();
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Failed to save transaction", err);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "מחיקת תנועה",
      message: "האם אתה בטוח שברצונך למחוק תנועה זו מעסקת התקציב?",
      confirmText: "מחק תנועה",
      type: "danger",
    });

    if (isConfirmed) {
      try {
        await deleteTransaction(id).unwrap();
      } catch (err) {
        console.error("Failed to delete transaction", err);
      }
    }
  };

  const resetForm = () => {
    setType("Income");
    setAmount("");
    setServiceType("DJ Gig");
    setClientId("");
    setEventId("");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setSelectedFile(null);
    setEditingTransactionId(null);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesType = filterType === "ALL" || t.type === filterType;
      const clientName = typeof t.client === "object" ? t.client?.name : "";
      const matchesSearch =
        searchQuery === "" ||
        (t.notes && t.notes.includes(searchQuery)) ||
        (t.serviceType && t.serviceType.includes(searchQuery)) ||
        (clientName && clientName.includes(searchQuery));
      return matchesType && matchesSearch;
    });
  }, [transactions, filterType, searchQuery]);

  const PAGE_SIZE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, currentPage]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === "Income") income += t.amount;
      else expense += t.amount;
    });
    return {income, expense, net: income - expense};
  }, [filteredTransactions]);

  const getServiceTypeHebrew = (st?: string) => {
    switch (st) {
      case "DJ Gig":
        return "תקליטנות (DJ)";
      case "Software Development":
        return "פיתוח תוכנה";
      case "Maintenance":
        return "תחזוקה";
      case "Consulting":
        return "ייעוץ";
      case "General":
        return "כללי";
      default:
        return st || "-";
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ["תאריך", "סוג", "סכום", "שירות", "לקוח", "הערות"];
    const rows = filteredTransactions.map((t) => [
      new Date(t.date).toLocaleDateString("he-IL"),
      t.type === "Income" ? "הכנסה" : "הוצאה",
      t.amount,
      getServiceTypeHebrew(t.serviceType),
      typeof t.client === "object" ? t.client.name : "-",
      t.notes || "-",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ledger_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 text-ink-black pb-8 font-sans">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dust-taupe">
        <div className="text-right">
          <h1 className="text-3xl font-medium tracking-tight text-ink-black font-heading flex items-center gap-2">
            <span>ספר תנועות כספיות</span>
          </h1>
          <p className="text-xs text-slate-gray mt-1 font-sans">
            ניהול, סיווג ותיעוד הכנסות והוצאות בזמן אמת
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse self-start sm:self-auto">
          <Button variant="outline" onClick={handleExportCSV}>
            <FileSpreadsheet className="w-4 h-4 text-slate-gray ml-1.5" />
            <span>ייצא ל-CSV</span>
          </Button>

          <Button variant="default" onClick={handleOpenCreateModal}>
            <Plus className="w-4 h-4 stroke-[2.5] ml-1.5" />
            <span>תנועה חדשה</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        {/* Type Filter Buttons */}
        <div className="flex items-center space-x-2 space-x-reverse w-full md:w-auto">
          <Button
            variant={filterType === "ALL" ? "dark" : "outline"}
            onClick={() => setFilterType("ALL")}
            className="flex-1 md:flex-initial"
          >
            הכל
          </Button>
          <Button
            variant={filterType === "Income" ? "success" : "outline"}
            onClick={() => setFilterType("Income")}
            className="flex-1 md:flex-initial"
          >
            <ArrowUpRight className="w-4 h-4 ml-1" />
            <span>הכנסות</span>
          </Button>
          <Button
            variant={filterType === "Expense" ? "destructive" : "outline"}
            onClick={() => setFilterType("Expense")}
            className="flex-1 md:flex-initial"
          >
            <ArrowDownLeft className="w-4 h-4 ml-1" />
            <span>הוצאות</span>
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-gray" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש תנועה..."
            className="pr-11"
          />
        </div>
      </Card>

      {/* Transactions Table Section */}
      <Card className="overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        {isLoading ? (
          <div className="p-16 text-center text-slate-gray text-xs font-medium">
            טוען תנועות כספיות...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 sm:p-16 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-canvas-cream flex items-center justify-center text-slate-gray mb-1">
              <FileSpreadsheet className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-ink-black font-bold font-heading">
                לא נמצאו תנועות כספיות
              </p>
              <p className="text-xs text-slate-gray">
                לחץ על "תנועה חדשה" ליצירת רישום הכנסה/הוצאה
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>סוג</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>שירות</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead>הערות</TableHead>
                <TableHead>קובץ</TableHead>
                <TableHead className="text-left">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((t) => (
                <TableRow key={t._id}>
                  <TableCell className="font-bold text-ink-black">
                    {new Date(t.date).toLocaleDateString("he-IL")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={t.type === "Income" ? "completed" : "unpaid"}
                    >
                      {t.type === "Income" ? "הכנסה" : "הוצאה"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`font-bold font-heading whitespace-nowrap ${t.type === "Income" ? "text-success" : "text-danger"}`}
                  >
                    {t.type === "Income" ? "+" : "-"}₪{t.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-slate-gray">
                    {getServiceTypeHebrew(t.serviceType)}
                  </TableCell>
                  <TableCell className="font-medium text-slate-gray">
                    {typeof t.client === "object" ? t.client?.name : "-"}
                  </TableCell>
                  <TableCell className="text-slate-gray max-w-xs truncate">
                    {t.notes || "-"}
                  </TableCell>
                  <TableCell>
                    {t.attachmentUrl ? (
                      <a
                        href={t.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-ink-black hover:underline font-semibold"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>מסמך</span>
                      </a>
                    ) : (
                      <span className="text-slate-gray text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end space-x-1 space-x-reverse">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditModal(t)}
                        title="ערוך תנועה"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(t._id)}
                        className="hover:text-danger"
                        title="מחק תנועה"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!isLoading && filteredTransactions.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="border-t border-dust-taupe"
          />
        )}

        {/* Table Footer Summary */}
        <div className="p-4 px-6 bg-canvas-cream/60 border-t border-dust-taupe flex flex-wrap items-center justify-between gap-4 text-xs font-bold font-heading">
          <div>סה"כ תנועות: {filteredTransactions.length}</div>
          <div className="flex items-center space-x-6 space-x-reverse">
            <span className="text-success">
              סך הכנסות: ₪{totals.income.toLocaleString()}
            </span>
            <span className="text-danger">
              סך הוצאות: ₪{totals.expense.toLocaleString()}
            </span>
            <span className="text-ink-black">
              מאזן נקי: ₪{totals.net.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>

      {/* Transaction Form Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>
                {editingTransactionId
                  ? "עריכת תנועה כספית"
                  : "רישום תנועה כספית חדשה"}
              </span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Type Toggle */}
            <div className="flex bg-canvas-cream p-1 rounded-full border border-dust-taupe">
              <button
                type="button"
                onClick={() => setType("Income")}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                  type === "Income"
                    ? "bg-ink-black text-white shadow-sm"
                    : "text-slate-gray hover:text-ink-black"
                }`}
              >
                הכנסה (+)
              </button>
              <button
                type="button"
                onClick={() => setType("Expense")}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                  type === "Expense"
                    ? "bg-danger text-white shadow-sm"
                    : "text-slate-gray hover:text-ink-black"
                }`}
              >
                הוצאה (-)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">
                  סכום (₪)
                </label>
                <Input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">
                  תאריך
                </label>
                <Input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {type === "Income" && (
              <div>
                <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">
                  סוג שירות
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className="w-full h-10 bg-canvas-cream border border-dust-taupe rounded-2xl px-4 py-2 text-xs text-ink-black focus:outline-none focus:border-ink-black focus:bg-lifted-cream transition-all"
                >
                  <option value="DJ Gig">תקליטנות (DJ)</option>
                  <option value="Software Development">פיתוח תוכנה</option>
                  <option value="Maintenance">תחזוקה</option>
                  <option value="Consulting">ייעוץ</option>
                  <option value="General">כללי</option>
                </select>
              </div>
            )}

            {/* Client Picker with Quick Create Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-gray uppercase tracking-wider font-heading">
                  לקוח (אופציונלי)
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickClientOpen(!isQuickClientOpen)}
                  className="text-[11px] font-bold text-ink-black hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>הוסף לקוח חדש</span>
                </button>
              </div>

              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-10 bg-canvas-cream border border-dust-taupe rounded-2xl px-4 py-2 text-xs text-ink-black focus:outline-none focus:border-ink-black focus:bg-lifted-cream transition-all"
              >
                <option value="">-- ללא לקוח --</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Client Embedded Panel */}
            {isQuickClientOpen && (
              <div className="p-4 rounded-2xl bg-canvas-cream border border-dust-taupe space-y-3">
                <h4 className="text-xs font-bold text-ink-black flex items-center gap-1.5 font-heading">
                  <Users className="w-3.5 h-3.5 text-ink-black" />
                  <span>הוספת לקוח מהירה</span>
                </h4>

                {quickClientError && (
                  <div className="text-[10px] text-danger font-semibold">
                    {quickClientError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="text"
                    placeholder="שם הלקוח / העסק"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                  />
                  <select
                    value={newClientType}
                    onChange={(e) => setNewClientType(e.target.value as any)}
                    className="h-10 bg-lifted-cream border border-dust-taupe rounded-2xl px-3 text-xs text-ink-black"
                  >
                    <option value="Club">מועדון</option>
                    <option value="Producer">מפיק</option>
                    <option value="Restaurant">מסעדה</option>
                    <option value="Private">לקוח פרטי</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsQuickClientOpen(false)}
                  >
                    ביטול
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleQuickClientSubmit}
                    disabled={isCreatingClient}
                  >
                    {isCreatingClient ? "יוצר..." : "שמור לקוח"}
                  </Button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">
                קבלה / קובץ אסמכתא
              </label>
              <FileDropzone
                onFileSelect={(file) => setSelectedFile(file)}
                selectedFile={selectedFile}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-gray mb-1 uppercase tracking-wider font-heading">
                תיאור / הערות
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="פרטים נוספים לגבי התנועה..."
                className="w-full bg-canvas-cream border border-dust-taupe rounded-2xl px-4 py-2 text-xs text-ink-black placeholder-slate-gray focus:outline-none focus:border-ink-black focus:bg-lifted-cream transition-all"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2 space-x-reverse border-t border-dust-taupe">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
              >
                ביטול
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating
                  ? "שומר..."
                  : editingTransactionId
                    ? "עדכן תנועה"
                    : "שמור תנועה"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
