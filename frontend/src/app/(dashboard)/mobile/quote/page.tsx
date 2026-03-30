"use client";

import { useState, useCallback } from "react";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    ChevronRight,
    ChevronLeft,
    Plus,
    Trash2,
    CheckCircle2,
    User,
    Package,
    Receipt,
    Loader2,
    Search,
    X,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuoteItem {
    id: string; // local UUID
    serviceTypeId: string;
    serviceTypeName: string;
    billingType: "FIXED" | "PER_M2";
    materialId: string | null;
    materialName: string | null;
    width: number;
    height: number;
    mlUsed: number;
    quantity: number;
    unitPrice: number;
    wastePercentage: number;
}

type Step = 1 | 2 | 3;

// ─── Helpers ────────────────────────────────────────────────────────────────

function uid() {
    return Math.random().toString(36).slice(2);
}

function calcItemTotal(item: QuoteItem): number {
    if (item.billingType === "FIXED") return item.unitPrice * item.quantity;
    return item.unitPrice * item.width * item.height * item.quantity;
}

function fmt(n: number) {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MobileQuotePage() {
    const router = useRouter();

    // ── Step state ──
    const [step, setStep] = useState<Step>(1);

    // ── Step 1: client ──
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);

    // ── Step 2: items ──
    const [items, setItems] = useState<QuoteItem[]>([]);
    const [addingItem, setAddingItem] = useState(false);
    // New item form fields
    const [newSvcId, setNewSvcId] = useState("");
    const [newMatId, setNewMatId] = useState("");
    const [newWidth, setNewWidth] = useState(0);
    const [newHeight, setNewHeight] = useState(0);
    const [newMl, setNewMl] = useState(0);
    const [newQty, setNewQty] = useState(1);
    const [newPrice, setNewPrice] = useState(0);
    const [newWaste, setNewWaste] = useState(10);

    // ── Step 3: discount ──
    const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
    const [discountValue, setDiscountValue] = useState(0);
    const [aplicadorId, setAplicadorId] = useState("");
    const [commissionRate, setCommissionRate] = useState(0);

    // ── Data queries ──
    const { data: customers } = api.customer.getAll.useQuery();
    const { data: serviceTypes } = api.serviceType.getAll.useQuery();
    const { data: materials } = api.material.getAll.useQuery();
    const { data: users } = api.user.getAll.useQuery();

    // ── Mutations ──
    const createOrder = api.order.create.useMutation({
        onSuccess: (data) => {
            toast.success("Orçamento salvo com sucesso!", {
                description: `Cliente: ${customerName}`,
            });
            router.push(`/orders/${data.id}`);
        },
        onError: (err) => toast.error("Erro ao salvar orçamento", { description: err.message }),
    });

    // ── Derived values ──
    const subtotal = items.reduce((sum, i) => sum + calcItemTotal(i), 0);
    const discountAmount = discountType === "FIXED"
        ? discountValue
        : subtotal * (discountValue / 100);
    const total = Math.max(0, subtotal - discountAmount);

    const selectedSvc = serviceTypes?.find((s: any) => s.id === newSvcId);
    const isPerM2 = selectedSvc?.billingType === "PER_M2";
    const selectedMat = materials?.find((m: any) => m.id === newMatId);
    const isLiquid = (selectedMat as any)?.category === "LIQUID";

    // ── Filtered customers ──
    const filteredCustomers = customers?.filter((c: any) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.phone || "").includes(customerSearch)
    );

    // ── Add item ──
    function handleAddItem() {
        if (!newSvcId || newQty < 1 || newPrice <= 0) {
            toast.error("Preencha o serviço, quantidade e preço.");
            return;
        }
        const svc = serviceTypes?.find((s: any) => s.id === newSvcId);
        const mat = materials?.find((m: any) => m.id === newMatId);
        const item: QuoteItem = {
            id: uid(),
            serviceTypeId: newSvcId,
            serviceTypeName: svc?.name || "",
            billingType: (svc?.billingType ?? "FIXED") as "FIXED" | "PER_M2",
            materialId: newMatId || null,
            materialName: mat?.name || null,
            width: newWidth,
            height: newHeight,
            mlUsed: newMl,
            quantity: newQty,
            unitPrice: newPrice,
            wastePercentage: newWaste,
        };
        setItems((prev) => [...prev, item]);
        // reset
        setNewSvcId(""); setNewMatId(""); setNewWidth(0); setNewHeight(0);
        setNewMl(0); setNewQty(1); setNewPrice(0); setNewWaste(10);
        setAddingItem(false);
    }

    // ── Submit ──
    function handleSubmit() {
        if (!customerName.trim()) { toast.error("Nome do cliente obrigatório."); return; }
        if (items.length === 0) { toast.error("Adicione pelo menos um serviço."); return; }

        createOrder.mutate({
            customerName: customerName.trim(),
            customerId: customerId || undefined,
            type: "QUOTATION",
            aplicadorId: aplicadorId || null,
            serviceCommissionRate: commissionRate,
            discountType,
            discountValue,
            supplies: [],
            equipment: [],
            items: items.map((i) => ({
                serviceTypeId: i.serviceTypeId,
                materialId: i.materialId || null,
                width: i.width,
                height: i.height,
                mlUsed: i.mlUsed,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                wastePercentage: i.wastePercentage,
                finishings: [],
                priceInputType: "UNIT" as const,
            })),
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">

            {/* ── Topbar ── */}
            <header className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 border-b border-white/10">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-white/60 hover:text-white">
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="text-base font-bold tracking-tight">Novo Orçamento</h1>
                <div className="w-10" />
            </header>

            {/* ── Step indicator ── */}
            <div className="flex items-center gap-2 px-4 py-3">
                {([1, 2, 3] as Step[]).map((s) => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                        <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                            step >= s ? "bg-violet-500" : "bg-white/10"
                        }`} />
                    </div>
                ))}
            </div>
            <div className="flex justify-between px-4 text-[11px] text-white/40 mb-2">
                <span className={step === 1 ? "text-violet-400 font-bold" : ""}>Cliente</span>
                <span className={step === 2 ? "text-violet-400 font-bold" : ""}>Serviços</span>
                <span className={step === 3 ? "text-violet-400 font-bold" : ""}>Resumo</span>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 px-4 pb-32 overflow-y-auto">

                {/* ════════════ STEP 1: CLIENTE ════════════ */}
                {step === 1 && (
                    <div className="space-y-5 mt-2">
                        <div className="flex items-center gap-2 text-violet-400 font-bold">
                            <User className="h-5 w-5" />
                            <span>Dados do Cliente</span>
                        </div>

                        {/* Customer search */}
                        <button
                            onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                            className="w-full flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/8 transition"
                        >
                            <Search className="h-4 w-4" />
                            {customerId ? `✓ ${customerName}` : "Buscar cliente cadastrado (opcional)"}
                        </button>

                        {showCustomerSearch && (
                            <div className="bg-slate-800 rounded-xl border border-white/10 overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
                                    <Search className="h-4 w-4 text-white/40" />
                                    <input
                                        autoFocus
                                        placeholder="Buscar por nome ou telefone..."
                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                    />
                                    {customerSearch && (
                                        <button onClick={() => setCustomerSearch("")}>
                                            <X className="h-4 w-4 text-white/40" />
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {filteredCustomers?.map((c: any) => (
                                        <button
                                            key={c.id}
                                            className="w-full flex flex-col items-start px-4 py-3 hover:bg-white/5 transition border-b border-white/5 text-left"
                                            onClick={() => {
                                                setCustomerId(c.id);
                                                setCustomerName(c.name);
                                                setCustomerPhone(c.phone || "");
                                                setShowCustomerSearch(false);
                                                setCustomerSearch("");
                                            }}
                                        >
                                            <span className="font-semibold text-sm">{c.name}</span>
                                            <span className="text-xs text-white/40">{c.phone || c.email || "–"}</span>
                                        </button>
                                    ))}
                                    {filteredCustomers?.length === 0 && (
                                        <p className="text-center text-sm text-white/30 py-6">Nenhum cliente encontrado.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-white/50 uppercase tracking-wider pl-1 block mb-1">
                                    Nome do Cliente *
                                </label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:bg-violet-500/5 transition"
                                    placeholder="Ex: João da Silva"
                                    value={customerName}
                                    onChange={(e) => {
                                        setCustomerName(e.target.value);
                                        if (customerId) setCustomerId(null);
                                    }}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 uppercase tracking-wider pl-1 block mb-1">
                                    Telefone / WhatsApp
                                </label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 focus:bg-violet-500/5 transition"
                                    placeholder="(00) 00000-0000"
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════ STEP 2: SERVIÇOS ════════════ */}
                {step === 2 && (
                    <div className="space-y-4 mt-2">
                        <div className="flex items-center gap-2 text-violet-400 font-bold">
                            <Package className="h-5 w-5" />
                            <span>Serviços do Pedido</span>
                        </div>

                        {/* Items list */}
                        {items.map((item) => (
                            <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm">{item.serviceTypeName}</p>
                                        {item.materialName && (
                                            <p className="text-xs text-white/50">{item.materialName}</p>
                                        )}
                                        <p className="text-xs text-white/40 mt-0.5">
                                            {item.billingType === "PER_M2"
                                                ? `${item.width}m × ${item.height}m × ${item.quantity}un`
                                                : `${item.quantity} un`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-violet-300 font-bold text-lg">
                                            {fmt(calcItemTotal(item))}
                                        </span>
                                        <button
                                            className="p-1.5 text-red-400/70 hover:text-red-400"
                                            onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {items.length === 0 && !addingItem && (
                            <div className="flex flex-col items-center justify-center py-12 text-white/30 space-y-2">
                                <Package className="h-10 w-10" />
                                <p className="text-sm">Nenhum serviço adicionado</p>
                            </div>
                        )}

                        {/* Add item form */}
                        {addingItem ? (
                            <div className="bg-slate-800/80 border border-violet-500/30 rounded-2xl p-4 space-y-3">
                                <p className="font-bold text-violet-400 text-sm">+ Novo Serviço</p>

                                {/* Service type */}
                                <div>
                                    <label className="text-[11px] text-white/40 uppercase tracking-wider block mb-1">Tipo de Serviço *</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                                        value={newSvcId}
                                        onChange={(e) => {
                                            setNewSvcId(e.target.value);
                                            const svc = serviceTypes?.find((s: any) => s.id === e.target.value);
                                            if (svc?.defaultPrice) setNewPrice(Number(svc.defaultPrice));
                                            if (svc?.wastePercentage) setNewWaste(Number(svc.wastePercentage));
                                        }}
                                    >
                                        <option value="">Selecione...</option>
                                        {serviceTypes?.map((s: any) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.billingType === "FIXED" ? "Fixo" : "m²"})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Material */}
                                <div>
                                    <label className="text-[11px] text-white/40 uppercase tracking-wider block mb-1">Material</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                                        value={newMatId}
                                        onChange={(e) => setNewMatId(e.target.value)}
                                    >
                                        <option value="">Sem material</option>
                                        {materials?.map((m: any) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({(m as any).category === "LIQUID" ? "Líquido/ml" : "m²"})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Dimensions */}
                                {isPerM2 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[11px] text-white/40 uppercase tracking-wider block mb-1">Larg. (m)</label>
                                            <input type="number" step="0.01" min="0"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-violet-500"
                                                value={newWidth || ""}
                                                onChange={(e) => setNewWidth(Number(e.target.value))} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-white/40 uppercase tracking-wider block mb-1">Alt. (m)</label>
                                            <input type="number" step="0.01" min="0"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-violet-500"
                                                value={newHeight || ""}
                                                onChange={(e) => setNewHeight(Number(e.target.value))} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-white/40 uppercase tracking-wider block mb-1">Qtd</label>
                                            <input type="number" min="1"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-violet-500"
                                                value={newQty}
                                                onChange={(e) => setNewQty(Number(e.target.value))} />
                                        </div>
                                    </div>
                                )}

                                {!isPerM2 && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[11px] text-white/40 uppercase tracking-wider block mb-1">Quantidade</label>
                                            <input type="number" min="1"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-violet-500"
                                                value={newQty}
                                                onChange={(e) => setNewQty(Number(e.target.value))} />
                                        </div>
                                        {isLiquid && (
                                            <div>
                                                <label className="text-[11px] text-white/40 uppercase tracking-wider block mb-1">ML / un</label>
                                                <input type="number" min="0" step="0.1"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-violet-500"
                                                    value={newMl || ""}
                                                    onChange={(e) => setNewMl(Number(e.target.value))} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Price */}
                                <div>
                                    <label className="text-[11px] text-white/40 uppercase tracking-wider block mb-1">
                                        {isPerM2 ? "Preço por m² (R$)" : "Preço Unitário (R$)"}
                                    </label>
                                    <input type="number" step="0.01" min="0"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3.5 text-lg font-bold text-violet-300 focus:outline-none focus:border-violet-500"
                                        placeholder="0,00"
                                        value={newPrice || ""}
                                        onChange={(e) => setNewPrice(Number(e.target.value))} />
                                </div>

                                {/* Preview */}
                                {newPrice > 0 && (
                                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 flex justify-between items-center">
                                        <span className="text-xs text-violet-300">Subtotal deste item:</span>
                                        <span className="text-lg font-bold text-violet-300">
                                            {fmt(isPerM2 ? newPrice * newWidth * newHeight * newQty : newPrice * newQty)}
                                        </span>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-1">
                                    <Button variant="ghost" className="flex-1 text-white/50" onClick={() => setAddingItem(false)}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                                        onClick={handleAddItem}
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Adicionar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setAddingItem(true)}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-white/15 text-white/40 hover:border-violet-500/50 hover:text-violet-400 hover:bg-violet-500/5 transition text-sm font-medium"
                            >
                                <Plus className="h-5 w-5" />
                                Adicionar Serviço
                            </button>
                        )}
                    </div>
                )}

                {/* ════════════ STEP 3: RESUMO ════════════ */}
                {step === 3 && (
                    <div className="space-y-5 mt-2">
                        <div className="flex items-center gap-2 text-violet-400 font-bold">
                            <Receipt className="h-5 w-5" />
                            <span>Resumo do Orçamento</span>
                        </div>

                        {/* Client card */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Cliente</p>
                            <p className="font-bold text-lg">{customerName}</p>
                            {customerPhone && <p className="text-sm text-white/50">{customerPhone}</p>}
                        </div>

                        {/* Items summary */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{items.length} Serviço(s)</p>
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <span className="text-white/70">{item.quantity}× {item.serviceTypeName}</span>
                                    <span className="font-medium">{fmt(calcItemTotal(item))}</span>
                                </div>
                            ))}
                            <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                                <span>Subtotal</span>
                                <span>{fmt(subtotal)}</span>
                            </div>
                        </div>

                        {/* Discount */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                            <p className="text-xs text-white/40 uppercase tracking-wider">Desconto</p>
                            <div className="flex gap-2">
                                <button
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition border ${discountType === "PERCENTAGE" ? "bg-violet-600 border-violet-500 text-white" : "bg-white/5 border-white/10 text-white/50"}`}
                                    onClick={() => setDiscountType("PERCENTAGE")}
                                >%</button>
                                <button
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition border ${discountType === "FIXED" ? "bg-violet-600 border-violet-500 text-white" : "bg-white/5 border-white/10 text-white/50"}`}
                                    onClick={() => setDiscountType("FIXED")}
                                >R$</button>
                            </div>
                            <input
                                type="number" min="0" step="0.01"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xl font-bold text-amber-300 text-center focus:outline-none focus:border-violet-500"
                                placeholder="0"
                                value={discountValue || ""}
                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                            />
                            {discountValue > 0 && (
                                <p className="text-xs text-amber-400 text-center">
                                    Desconto: {discountType === "PERCENTAGE" ? `${discountValue}%` : ""} = {fmt(discountAmount)}
                                </p>
                            )}
                        </div>

                        {/* Aplicador (optional) */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                            <p className="text-xs text-white/40 uppercase tracking-wider">Aplicador / Comissão (opcional)</p>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                                value={aplicadorId}
                                onChange={(e) => setAplicadorId(e.target.value)}
                            >
                                <option value="">Nenhum</option>
                                {users?.map((u: any) => (
                                    <option key={u.id} value={u.id}>{u.nomeCompleto}</option>
                                ))}
                            </select>
                            {aplicadorId && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-white/40">Comissão (%)</span>
                                    <input type="number" min="0" max="100" step="0.5"
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                                        value={commissionRate || ""}
                                        onChange={(e) => setCommissionRate(Number(e.target.value))}
                                    />
                                </div>
                            )}
                        </div>

                        {/* TOTAL – big display for customer to see */}
                        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 p-6 text-center shadow-xl shadow-violet-900/40">
                            <p className="text-xs text-violet-200 uppercase tracking-widest mb-1">Total do Orçamento</p>
                            <p className="text-5xl font-black tracking-tight text-white">{fmt(total)}</p>
                            {discountAmount > 0 && (
                                <p className="text-violet-200 text-sm mt-2">
                                    Desconto aplicado: {fmt(discountAmount)}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Bottom Action Bar ── */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-lg border-t border-white/10 px-4 py-4 pb-safe flex gap-3">
                {step > 1 && (
                    <Button
                        variant="ghost"
                        className="flex-none px-4 text-white/60 hover:text-white hover:bg-white/5"
                        onClick={() => setStep((s) => (s - 1) as Step)}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                )}

                {step < 3 ? (
                    <Button
                        className="flex-1 h-14 text-base font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-2xl shadow-lg shadow-violet-900/40"
                        onClick={() => {
                            if (step === 1 && !customerName.trim()) {
                                toast.error("Informe o nome do cliente.");
                                return;
                            }
                            if (step === 2 && items.length === 0) {
                                toast.error("Adicione pelo menos um serviço.");
                                return;
                            }
                            setStep((s) => (s + 1) as Step);
                        }}
                    >
                        Próximo <ChevronRight className="h-5 w-5 ml-1" />
                    </Button>
                ) : (
                    <Button
                        className="flex-1 h-14 text-base font-bold bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg shadow-green-900/40"
                        onClick={handleSubmit}
                        disabled={createOrder.isPending}
                    >
                        {createOrder.isPending ? (
                            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Salvando...</>
                        ) : (
                            <><CheckCircle2 className="h-5 w-5 mr-2" /> Salvar Orçamento</>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
