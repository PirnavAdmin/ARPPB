import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import CustomerRoutes from "./routes/CustomerRoutes";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/customer/*"
                    element={<CustomerRoutes />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/customer/dashboard" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;