import { Plus, Trash2 } from "lucide-react";

export interface SubmissionItem {
  id: string;
  name: string;
  quantity: number;
  description: string;
}

export function SubmissionItemsTable({
  items,
  isEditing,
  editItems,
  actionLoading,
  onStartAdd,
  onRemoveEditItem,
  onEditItemChange,
  onCancelEdit,
  onSaveRevision,
}: {
  items: SubmissionItem[];
  isEditing: boolean;
  editItems: SubmissionItem[];
  actionLoading: boolean;
  onStartAdd: () => void;
  onRemoveEditItem: (id: string) => void;
  onEditItemChange: (
    id: string,
    field: "name" | "quantity" | "description",
    value: string | number,
  ) => void;
  onCancelEdit: () => void;
  onSaveRevision: () => void;
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Daftar Barang yang Diajukan
          </h2>
          <p className="text-[11px] text-slate-500">
            Rincian spesifikasi barang yang diajukan untuk disetujui.
          </p>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={onStartAdd}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-[#1E3A5F] bg-slate-100 hover:bg-slate-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Barang
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {editItems.map((item, index) => (
            <div
              key={item.id}
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Barang #{index + 1}
                </span>
                {editItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveEditItem(item.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    onEditItemChange(item.id, "name", e.target.value)
                  }
                  placeholder="Nama barang"
                  className="sm:col-span-2 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    onEditItemChange(
                      item.id,
                      "quantity",
                      Math.max(1, parseInt(e.target.value) || 1),
                    )
                  }
                  placeholder="Jumlah"
                  className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>
              <textarea
                rows={2}
                value={item.description}
                onChange={(e) =>
                  onEditItemChange(item.id, "description", e.target.value)
                }
                placeholder="Spesifikasi teknis..."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
              />
            </div>
          ))}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onSaveRevision}
              disabled={actionLoading}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C47] rounded cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? "Menyimpan..." : "Simpan & Kirim Ulang Revisi"}
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Nama Barang</th>
                <th className="py-2.5 px-3 text-center">Jumlah</th>
                <th className="py-2.5 px-3">Keterangan / Spesifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((it, idx) => (
                <tr key={it.id}>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {it.name}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                    {it.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {it.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
