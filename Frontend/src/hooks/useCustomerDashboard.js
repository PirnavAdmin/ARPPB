import { useEffect, useState } from "react";
import { customerService } from "../services/customerService";

export function useCustomerDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const result =
                    await customerService.getDashboard();

                if (active) {
                    setData(result);
                }
            } catch (error) {
                if (active) {
                    setError("Unable to load dashboard data.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            active = false;
        };
    }, []);

    return {
        data,
        loading,
        error,
    };
}