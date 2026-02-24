import OrderDetailsClient from "./client";

export default async function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    return <OrderDetailsClient id={params.id} />;
}
