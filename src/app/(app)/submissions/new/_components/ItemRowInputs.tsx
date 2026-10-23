import { Plus, Trash2 } from "lucide-react";

export interface ItemInput {
  id: string;
  name: string;
  quantity: number;
  description: string;
}

export function ItemRowInputs({
  items,
  onAddItem,
  onRemoveItem,
  onItemChange,
}: {
  items: ItemInput[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onItemChange: (
    id: string,
    field: "name" | "quantity" | "description",
    value: string | number,
  ) => void;
}) {
  return (
    <div className="pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Daftar Barang yang Diajukan
          </h3>
          <p className="text-[11px] text-slate-500">
            Minimal 1 barang belanja dengan jumlah dan spesifikasi lengkap.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-[#1E3A5F] bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Barang
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Barang #{index + 1}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                  title="Hapus baris barang"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Barang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    onItemChange(item.id, "name", e.target.value)
                  }
                  placeholder="Contoh: Laptop Core i7 16GB RAM"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Jumlah (Unit / Pcs) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={item.quantity}
                  onChange={(e) =>
                    onItemChange(
                      item.id,
                      "quantity",
                      Math.max(1, parseInt(e.target.value) || 1),
                    )
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Keterangan / Spesifikasi Teknis{" "}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={item.description}
                onChange={(e) =>
                  onItemChange(item.id, "description", e.target.value)
                }
                placeholder="Spesifikasi teknis, merek, kelengkapan, estimasi penggunaan..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
