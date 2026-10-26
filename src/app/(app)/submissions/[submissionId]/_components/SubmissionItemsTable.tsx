import { Plus, Trash2 } from "lucide-react";

export interface SubmissionItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number | string;
  description: string;
  specification: string;
}
const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 2,
});

function formatRupiah(amount: number) {
  return rupiahFormatter.format(Number.isFinite(amount) ? amount : 0);
}

function totalForItem(item: SubmissionItem) {
  return item.quantity * Number(item.unitPrice);
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
    field:
      | "name"
      | "quantity"
      | "unitPrice"
      | "description"
      | "specification",
    value: string | number,
  ) => void;
  onCancelEdit: () => void;
  onSaveRevision: () => void;
}) {
  const displayedItems = isEditing ? editItems : items;
  const grandTotal = displayedItems.reduce(
    (total, item) => total + totalForItem(item),
    0,
  );

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Daftar Barang yang Diajukan
          </h2>
          <p className="text-[11px] text-slate-500">
            Rincian harga, keterangan, dan spesifikasi barang untuk disetujui.
          </p>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={onStartAdd}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-[#1E3A5F] bg-slate-100 hover:bg-slate-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Tambah Barang
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {editItems.map((item, index) => {
            const itemTotal = totalForItem(item);
            const fieldPrefix = `edit-item-${item.id}`;

            return (
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
                      aria-label={`Hapus barang ${index + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <div className="sm:col-span-3">
                    <label htmlFor={`${fieldPrefix}-name`} className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Barang
                    </label>
                    <input
                      id={`${fieldPrefix}-name`}
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        onEditItemChange(item.id, "name", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${fieldPrefix}-quantity`} className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jumlah
                    </label>
                    <input
                      id={`${fieldPrefix}-quantity`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        onEditItemChange(
                          item.id,
                          "quantity",
                          Math.max(1, parseInt(e.target.value, 10) || 1),
                        )
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`${fieldPrefix}-unit-price`} className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Harga Satuan
                    </label>
                    <input
                      id={`${fieldPrefix}-unit-price`}
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        onEditItemChange(
                          item.id,
                          "unitPrice",
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor={`${fieldPrefix}-specification`} className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Spesifikasi
                    </label>
                    <textarea
                      id={`${fieldPrefix}-specification`}
                      rows={2}
                      value={item.specification}
                      onChange={(e) =>
                        onEditItemChange(
                          item.id,
                          "specification",
                          e.target.value,
                        )
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${fieldPrefix}-description`} className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Keterangan
                    </label>
                    <textarea
                      id={`${fieldPrefix}-description`}
                      rows={2}
                      value={item.description}
                      onChange={(e) =>
                        onEditItemChange(item.id, "description", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>
                </div>

                <output
                  htmlFor={`${fieldPrefix}-quantity ${fieldPrefix}-unit-price`}
                  className="block text-right text-xs text-slate-600"
                  aria-live="polite"
                >
                  Total harga:{" "}
                  <span className="font-bold text-slate-900">
                    {formatRupiah(itemTotal)}
                  </span>
                </output>
              </div>
            );
          })}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-[#1E3A5F]">
              Total seluruh barang: {formatRupiah(grandTotal)}
            </span>
            <div className="flex justify-end gap-2">
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
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Nama Barang</th>
                  <th className="py-2.5 px-3 text-center">Jumlah</th>
                  <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                  <th className="py-2.5 px-3 text-right">Total Harga</th>
                  <th className="py-2.5 px-3">Spesifikasi</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {formatRupiah(Number(item.unitPrice))}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {formatRupiah(totalForItem(item))}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-pre-line">
                      {item.specification}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-pre-line">
                      {item.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-3 text-sm">
            <span className="text-slate-600">Total seluruh barang</span>
            <span className="ml-4 font-bold text-[#1E3A5F]">
              {formatRupiah(grandTotal)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
