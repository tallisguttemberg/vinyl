import { OrderEditClient } from "./client";

export default async function EditOrderPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    return <OrderEditClient id={params.id} />;
}
