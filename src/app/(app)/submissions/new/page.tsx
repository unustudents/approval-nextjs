"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  AlertCircle,
  Send,
  Save,
  Trash2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useCurrentUser } from "@/app/(app)/_components/AppShell";
import { ItemRowInputs, ItemInput } from "./_components/ItemRowInputs";

interface CategoryOption {
  id: string;
  name: string;
}

interface ManagedUnitOption {
  id: string;
  name: string;
}

export default function NewSubmissionPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const isManager = user?.roles.includes("UNIT_MANAGER") ?? false;
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [managedUnits, setManagedUnits] = useState<ManagedUnitOption[]>([]);
  const [requestingUnitId, setRequestingUnitId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [items, setItems] = useState<ItemInput[]>([
    {
      id: "1",
      name: "",
      quantity: 1,
      unitPrice: 0,
      description: "",
      specification: "",
    },
  ]);
  const [files, setFiles] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [catList, unitList] = await Promise.all([
          api.get<CategoryOption[]>("/api/categories"),
          isManager
            ? api.get<ManagedUnitOption[]>("/api/submissions/create-options")
            : Promise.resolve([]),
        ]);
        setCategories(catList);
        setManagedUnits(unitList);
        if (catList.length > 0) {
          setCategoryId(catList[0].id);
        }
        if (unitList.length === 1) {
          setRequestingUnitId(unitList[0].id);
        }
        if (isManager && unitList.length === 0) {
          setErrorMsg("Anda belum ditetapkan sebagai Manager pada unit kerja aktif.");
        }
      } catch (err) {
        console.error("Gagal inisialisasi form pengajuan", err);
      } finally {
        setInitialLoading(false);
      }
    }
    init();
  }, [isManager]);

  function handleAddItem() {
    setItems((prev) => [
      ...prev,
      {
        id: String(performance.now()),
        name: "",
        quantity: 1,
        unitPrice: 0,
        description: "",
        specification: "",
      },
    ]);
  }

  function handleRemoveItem(id: string) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleItemChange(
    id: string,
    field: "name" | "quantity" | "unitPrice" | "description" | "specification",
    val: string | number,
  ) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: val };
        }
        return item;
      }),
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    const valid = incoming.filter((f) => {
      const isAllowed = ["application/pdf", "image/png", "image/jpeg"].includes(
        f.type,
      );
      const isSizeOk = f.size <= 10 * 1024 * 1024;
      return isAllowed && isSizeOk;
    });

    if (valid.length < incoming.length) {
      setErrorMsg(
        "Beberapa file diabaikan: Hanya format PDF, PNG, JPG (maks 10MB) yang diizinkan.",
      );
    }

    setFiles((prev) => [...prev, ...valid].slice(0, 10));
    e.target.value = "";
  }

  function handleRemoveFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(shouldSubmitNow: boolean) {
    setErrorMsg("");

    if (!categoryId) {
      setErrorMsg("Pilih kategori pengajuan");
      return;
    }
    if (isManager && !requestingUnitId) {
      setErrorMsg("Pilih unit kerja yang akan mengajukan pengadaan");
      return;
    }
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.name.trim()) {
        setErrorMsg(`Barang ke-${i + 1}: Nama barang wajib diisi`);
        return;
      }
      if (!it.quantity || it.quantity <= 0) {
        setErrorMsg(`Barang ke-${i + 1}: Jumlah barang minimal 1`);
        return;
      }
      if (!it.unitPrice || it.unitPrice <= 0) {
        setErrorMsg(`Barang ke-${i + 1}: Harga satuan harus lebih dari 0`);
        return;
      }
    }

    setLoading(true);

    try {
      const created = await api.post<{ id: string }>("/api/submissions", {
        categoryId,
        ...(isManager ? { unitId: requestingUnitId } : {}),
        items: items.map((it) => ({
          name: it.name.trim(),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          description: it.description.trim(),
          specification: it.specification.trim(),
        })),
      });

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post(`/api/submissions/${created.id}/attachments`, formData);
      }

      if (shouldSubmitNow) {
        await api.post(`/api/submissions/${created.id}/submit`);
      }

      router.push(`/submissions/${created.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Gagal menyimpan pengajuan");
      } else {
        setErrorMsg("Terjadi kesalahan sistem saat menyimpan pengajuan");
      }
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Menyiapkan formulir pengajuan...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/submissions"
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Kembali ke Daftar"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Buat Pengajuan Pembelian Baru
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lengkapi rincian kebutuhan barang dan lampiran penawaran harga
            sebelum dikirimkan ke workflow approval.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <label
            htmlFor="category"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Kategori Pengadaan <span className="text-rose-500">*</span>
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full sm:max-w-md px-3 py-2 border border-slate-300 rounded-md text-xs focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] bg-white transition-colors"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Kategori menentukan alur rantai persetujuan dan verifikator teknis
            yang bertugas.
          </p>
        </div>

        {isManager && (
          <div>
            <label
              htmlFor="requesting-unit"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Unit Pemohon <span className="text-rose-500">*</span>
            </label>
            <select
              id="requesting-unit"
              required
              value={requestingUnitId}
              onChange={(event) => setRequestingUnitId(event.target.value)}
              aria-describedby="requesting-unit-help"
              className="w-full sm:max-w-md px-3 py-2 border border-slate-300 rounded-md text-xs focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] bg-white transition-colors"
            >
              <option value="">Pilih unit kerja</option>
              {managedUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
            <p id="requesting-unit-help" className="text-[11px] text-slate-400 mt-1">
              Pengajuan Manager langsung diteruskan ke tahap approval berikutnya.
            </p>
          </div>
        )}

        <ItemRowInputs
          items={items}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onItemChange={handleItemChange}
        />

        <div className="pt-4 border-t border-slate-100">
          <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Lampiran Pendukung (Opsional)
            </h3>
            <p className="text-[11px] text-slate-500">
              Dokumen penawaran harga, spesifikasi teknis vendor, atau foto
              fisik (PDF, PNG, JPG, maks 10MB per file).
            </p>
          </div>

          <div className="mt-2">
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-lg cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-700">
                Pilih file untuk diunggah
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Klik untuk mencari file di komputer Anda
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md bg-slate-100 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Batal lampirkan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(false)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? "Menyimpan..." : "Simpan sebagai Draft"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-md text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C47] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {loading ? "Mengirim..." : "Kirim Pengajuan Sekarang"}
          </button>
        </div>
      </div>
    </div>
  );
}
