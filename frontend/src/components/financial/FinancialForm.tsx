"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

const formSchema = z.object({
    type: z.enum(["PAYABLE", "RECEIVABLE"]),
    status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]),
    description: z.string().min(1, "A descrição é obrigatória"),
    amount: z.coerce.number().min(0.01, "O valor deve ser maior que zero"),
    dueDate: z.string().nonempty("A data de vencimento é obrigatória"),
    paymentDate: z.string().optional(),
    paymentMethod: z.string().min(1, "O método de pagamento é obrigatório"),
    category: z.string().optional(),
    entityName: z.string().optional(),
});

const FINANCIAL_CATEGORIES = [
    "Materiais",
    "Salários / Pró-labore",
    "Aluguel",
    "Energia Elétrica",
    "Internet / Telefone",
    "Impostos",
    "Equipamentos",
    "Venda de Serviços",
    "Comissões",
    "Manutenção",
    "Outro",
] as const;

export type FinancialFormValues = z.infer<typeof formSchema>;

interface FinancialFormProps {
    initialValues?: Partial<FinancialFormValues> & { id?: string; dueDate?: Date; paymentDate?: Date | null };
    onSubmit: (values: FinancialFormValues) => void;
    isPending?: boolean;
}

export function FinancialForm({ initialValues, onSubmit, isPending }: FinancialFormProps) {
    const form = useForm<FinancialFormValues>({
        resolver: zodResolver(formSchema) as Resolver<FinancialFormValues>,
        defaultValues: {
            type: initialValues?.type || "PAYABLE",
            status: initialValues?.status || "PENDING",
            description: initialValues?.description || "",
            amount: initialValues?.amount || 0,
            dueDate: initialValues?.dueDate ? format(initialValues.dueDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
            paymentDate: initialValues?.paymentDate ? format(initialValues.paymentDate, "yyyy-MM-dd") : undefined,
            paymentMethod: initialValues?.paymentMethod || "",
            category: initialValues?.category || "",
            entityName: initialValues?.entityName || "",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="PAYABLE">A Pagar (Despesa)</SelectItem>
                                        <SelectItem value="RECEIVABLE">A Receber (Receita)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="PENDING">Pendente</SelectItem>
                                        <SelectItem value="PAID">Pago/Recebido</SelectItem>
                                        <SelectItem value="OVERDUE">Atrasado</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Conta de Luz, Venda NF-123" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor (R$)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data de Vencimento</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a categoria..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {FINANCIAL_CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="entityName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Entidade (Cliente/Fornecedor)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nome da pessoa ou empresa" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Método de Pagamento</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="PIX">PIX</SelectItem>
                                        <SelectItem value="BOLETO">Boleto</SelectItem>
                                        <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                                        <SelectItem value="CASH">Dinheiro</SelectItem>
                                        <SelectItem value="TRANSFER">Transferência</SelectItem>
                                        <SelectItem value="OTHER">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="paymentDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data de Pagamento (Opcional)</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar"}
                </Button>
            </form>
        </Form>
    );
}
