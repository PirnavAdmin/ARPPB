
import { useState } from "react";
import {
    UserRound,
    Mail,
    Phone,
    Building2,
    MapPin,
    Pencil,
    Save,
    X,
    CalendarDays,
    ShieldCheck,
} from "lucide-react";

import { customerProfile } from "../../data/customerMockData";
import "../../styles/profile.css";

const STORAGE_KEY = "arppb_customer_profile";

function getInitialProfile() {
    try {
        const savedProfile = localStorage.getItem(STORAGE_KEY);

        if (savedProfile) {
            return {
                ...customerProfile,
                ...JSON.parse(savedProfile),
            };
        }
    } catch (error) {
        console.error("Unable to load profile:", error);
    }

    return { ...customerProfile };
}

function CustomerProfile() {
    const [profile, setProfile] = useState(getInitialProfile);
    const [formData, setFormData] = useState({ ...profile });
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState("");

    const initials = (profile.name || "Customer")
        .trim()
        .split(/\s+/)
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleEdit = () => {
        setFormData({ ...profile });
        setMessage("");
        setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData({ ...profile });
        setIsEditing(false);
        setMessage("");
    };

    const handleSave = (event) => {
        event.preventDefault();

        if (!formData.name.trim() || !formData.email.trim()) {
            setMessage("Name and email are required.");
            return;
        }

        const updatedProfile = {
            ...formData,
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            company: formData.company.trim(),
            address: formData.address.trim(),
        };

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(updatedProfile)
            );

            setProfile(updatedProfile);
            setFormData(updatedProfile);
            setIsEditing(false);
            setMessage("Profile updated successfully!");
        } catch (error) {
            console.error("Unable to save profile:", error);
            setMessage("Unable to save profile. Please try again.");
        }
    };

    const fields = [
        {
            label: "Full Name",
            name: "name",
            icon: UserRound,
            type: "text",
        },
        {
            label: "Email Address",
            name: "email",
            icon: Mail,
            type: "email",
        },
        {
            label: "Phone Number",
            name: "phone",
            icon: Phone,
            type: "tel",
        },
        {
            label: "Company Name",
            name: "company",
            icon: Building2,
            type: "text",
        },
    ];

    return (
        <section className="profile-page">

            <div className="profile-page-header">
                <div>
                    <span className="profile-eyebrow">
                        CUSTOMER ACCOUNT
                    </span>
                    <h1>My Profile</h1>
                    <p>Manage your personal and business information.</p>
                </div>

                {!isEditing && (
                    <button
                        className="profile-edit-btn"
                        onClick={handleEdit}
                    >
                        <Pencil size={17} />
                        Edit Profile
                    </button>
                )}
            </div>

            {message && (
                <div className="profile-message">
                    {message}
                </div>
            )}

            <div className="profile-overview-card">
                <div className="profile-avatar">
                    {initials}
                </div>

                <div className="profile-overview-info">
                    <h2>{profile.name || "Customer Name"}</h2>
                    <p>{profile.company || "Company Name"}</p>

                    <span className="profile-status">
                        <span className="profile-status-dot"></span>
                        Active Customer
                    </span>
                </div>

                <div className="profile-customer-id">
                    <span>Customer ID</span>
                    <strong>{profile.id}</strong>
                </div>
            </div>

            <form onSubmit={handleSave}>

                <div className="profile-details-card">

                    <div className="profile-section-heading">
                        <div>
                            <h3>Personal Information</h3>
                            <p>Your registered account details</p>
                        </div>
                    </div>

                    <div className="profile-fields-grid">

                        {fields.map((field) => {
                            const Icon = field.icon;

                            return (
                                <div
                                    className="profile-field"
                                    key={field.name}
                                >
                                    <label htmlFor={field.name}>
                                        {field.label}
                                    </label>

                                    <div className="profile-input-wrapper">
                                        <Icon size={18} />

                                        <input
                                            id={field.name}
                                            type={field.type}
                                            name={field.name}
                                            value={formData[field.name] || ""}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            required={
                                                field.name === "name" ||
                                                field.name === "email"
                                            }
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        <div className="profile-field profile-address-field">
                            <label htmlFor="address">
                                Address
                            </label>

                            <div className="profile-input-wrapper profile-textarea-wrapper">
                                <MapPin size={18} />

                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="profile-field">
                            <label>Member Since</label>

                            <div className="profile-input-wrapper">
                                <CalendarDays size={18} />

                                <input
                                    type="text"
                                    value={profile.memberSince || ""}
                                    disabled
                                    readOnly
                                />
                            </div>
                        </div>

                    </div>

                    {isEditing && (
                        <div className="profile-form-actions">
                            <button
                                type="button"
                                className="profile-cancel-btn"
                                onClick={handleCancel}
                            >
                                <X size={17} />
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="profile-save-btn"
                            >
                                <Save size={17} />
                                Save Changes
                            </button>
                        </div>
                    )}

                </div>
            </form>

            <div className="profile-security-card">
                <div className="profile-security-icon">
                    <ShieldCheck size={23} />
                </div>

                <div>
                    <h3>Your account is secure</h3>
                    <p>
                        Your profile information is stored locally
                        in this frontend demo.
                    </p>
                </div>
            </div>

        </section>
    );
}

export default CustomerProfile;
