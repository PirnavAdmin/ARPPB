import { LoaderCircle } from "lucide-react";

function PageLoader({ message = "Loading..." }) {
    return (
        <div className="page-loader">
            <LoaderCircle className="loader-icon" size={32} />
            <p>{message}</p>
        </div>
    );
}

export default PageLoader;