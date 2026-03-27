"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ShoppingCart } from "lucide-react";

export interface PurchaseData {
    totalPaid: number;
    paymentMethod: string;
    paymentDate: string;
}

interface PurchaseFieldsProps {
    value: PurchaseData;
    onChange: (data: PurchaseData) => void;
    title?: string;
}

export function PurchaseFields({ value, onChange, title = "Dados da Compra (Obrigatório)" }: PurchaseFieldsProps) {
    return (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-sm font-semibold">{title}</span>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
                O estoque só é adicionado quando a compra for registrada como paga.
            </p>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="purchase-amount">Valor Total Pago (R$)</Label>
                    <Input
                        id="purchase-amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0,00"
                        value={value.totalPaid || ""}
                        onChange={(e) => onChange({ ...value, totalPaid: Number(e.target.value) })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="purchase-date">Data do Pagamento</Label>
                    <Input
                        id="purchase-date"
                        type="date"
                        value={value.paymentDate || format(new Date(), "yyyy-MM-dd")}
                        onChange={(e) => onChange({ ...value, paymentDate: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="purchase-method">Método de Pagamento</Label>
                <Select
                    value={value.paymentMethod}
                    onValueChange={(v) => onChange({ ...value, paymentMethod: v })}
                >
                    <SelectTrigger id="purchase-method">
                        <SelectValue placeholder="Como foi pago?" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="BOLETO">Boleto</SelectItem>
                        <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                        <SelectItem value="CASH">Dinheiro</SelectItem>
                        <SelectItem value="TRANSFER">Transferência</SelectItem>
                        <SelectItem value="OTHER">Outro</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
