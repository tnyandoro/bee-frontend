import React from "react";

const Settings = () => {
  return (
    <div className="p-6 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>

      <div className="space-y-6">
        {/* Organization Details */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Organization Details</h2>
          <p>
            Update your organization name, logo, contact info, and regional
            settings.
          </p>
        </section>

        {/* User Roles & Permissions */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            User Roles & Permissions
          </h2>
          <p>Manage what different roles can do in the system.</p>
        </section>

        {/* Ticket Configurations */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Ticket Configurations</h2>
          <p>
            Customize default ticket rules, SLA timers, and escalation logic.
          </p>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Notifications</h2>
          <p>
            Set up how your organization receives alerts (email, SMS, push).
          </p>
        </section>

        {/* Branding */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Branding</h2>
          <p>Upload logo and customize UI branding to match your company.</p>
        </section>

        {/* Integrations */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Integrations</h2>
          <p>Manage external system integrations and webhooks.</p>
        </section>

        {/* Audit Logs */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Audit Logs</h2>
          <p>Review all actions performed in the system.</p>
        </section>
      </div>
    </div>
  );
};

export default Settings;
