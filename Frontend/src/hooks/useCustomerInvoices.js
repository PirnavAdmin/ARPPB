import { useEffect, useState } from "react";
import { customerService } from "../services/customerService";

export function useCustomerInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const loadInvoices = async () => {
            try {
                setLoading(true);
                setError("");

                const result = await customerService.getInvoices();

                if (active) {
                    setInvoices(result);
                }
            } catch (error) {
                if (active) {
                    setError("Unable to load invoices.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadInvoices();

        return () => {
            active = false;
        };
    }, []);

    return { invoices, loading, error };
}