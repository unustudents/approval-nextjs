"use client";

import { Plus, Trash2 } from "lucide-react";

export interface ItemInput {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
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
    field:
      | "name"
      | "quantity"
      | "unitPrice"
      | "description"
      | "specification",
    value: string | number,
  ) => void;
}) {
  const grandTotal = items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );

  return (
    <section className="pt-4 border-t border-slate-100" aria-labelledby="items-heading">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3
            id="items-heading"
            className="text-xs font-bold text-slate-800 uppercase tracking-wider"
          >
            Daftar Barang yang Diajukan
          </h3>
          <p className="text-[11px] text-slate-500">
            Isi harga satuan, keterangan, dan spesifikasi untuk setiap barang.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-[#1E3A5F] bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          Tambah Barang
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const itemTotal = item.quantity * item.unitPrice;
          const fieldPrefix = `item-${item.id}`;

          return (
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
                    aria-label={`Hapus barang ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <div className="sm:col-span-3">
                  <label
                    htmlFor={`${fieldPrefix}-name`}
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Nama Barang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id={`${fieldPrefix}-name`}
                    type="text"
                    value={item.name}
                    onChange={(e) => onItemChange(item.id, "name", e.target.value)}
                    placeholder="Contoh: Laptop Core i7"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label
                    htmlFor={`${fieldPrefix}-quantity`}
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Jumlah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id={`${fieldPrefix}-quantity`}
                    type="number"
                    min="1"
                    max="10000"
                    value={item.quantity}
                    onChange={(e) =>
                      onItemChange(
                        item.id,
                        "quantity",
                        Math.max(1, parseInt(e.target.value, 10) || 1),
                      )
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor={`${fieldPrefix}-unit-price`}
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Harga Satuan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id={`${fieldPrefix}-unit-price`}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={item.unitPrice || ""}
                    onChange={(e) =>
                      onItemChange(
                        item.id,
                        "unitPrice",
                        Math.max(0, Number(e.target.value) || 0),
                      )
                    }
                    placeholder="0"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor={`${fieldPrefix}-specification`}
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Spesifikasi
                  </label>
                  <textarea
                    id={`${fieldPrefix}-specification`}
                    rows={3}
                    value={item.specification}
                    onChange={(e) =>
                      onItemChange(item.id, "specification", e.target.value)
                    }
                    placeholder="Merek, ukuran, material, atau detail teknis"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`${fieldPrefix}-description`}
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Keterangan
                  </label>
                  <textarea
                    id={`${fieldPrefix}-description`}
                    rows={3}
                    value={item.description}
                    onChange={(e) =>
                      onItemChange(item.id, "description", e.target.value)
                    }
                    placeholder="Contoh: Untuk staf baru"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200">
                <output
                  htmlFor={`${fieldPrefix}-quantity ${fieldPrefix}-unit-price`}
                  className="text-xs text-slate-600"
                  aria-live="polite"
                >
                  Total harga:{" "}
                  <span className="font-bold text-slate-900">
                    {formatRupiah(itemTotal)}
                  </span>
                </output>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex justify-end rounded-lg border border-[#1E3A5F]/20 bg-blue-50 px-4 py-3 text-sm">
        <span className="text-slate-600">Total seluruh barang</span>
        <span className="ml-4 font-bold text-[#1E3A5F]" aria-live="polite">
          {formatRupiah(grandTotal)}
        </span>
      </div>
    </section>
  );
}
