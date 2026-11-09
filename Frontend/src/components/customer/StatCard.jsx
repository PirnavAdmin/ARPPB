import {
    ShoppingBag,
    Package,
    Clock,
    Wallet,
    TrendingUp,
} from "lucide-react";

const icons = {
    "shopping-bag": ShoppingBag,
    package: Package,
    clock: Clock,
    wallet: Wallet,
};

function StatCard({ stat }) {
    const Icon = icons[stat.icon] || Package;

    return (
        <article className="stat-card">

            <div className="stat-card-top">

                <div className="stat-icon">
                    <Icon size={21} />
                </div>

                {stat.trend && (
                    <span className="stat-trend">
                        <TrendingUp size={13} />
                        {stat.trend}
                    </span>
                )}

            </div>

            <p className="stat-title">{stat.title}</p>

            <h2 className="stat-value">{stat.value}</h2>

            <p className="stat-description">
                {stat.description}
            </p>

        </article>
    );
}

export default StatCard;