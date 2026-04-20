export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Terms of Service</h1>

        <p>
          By using Aether.os, you agree to these Terms of Service.
        </p>

        <h2 className="text-xl font-semibold">Use of Platform</h2>
        <p>
          Aether.os provides campaign management tools. You agree to use the
          platform lawfully and responsibly.
        </p>

        <h2 className="text-xl font-semibold">Account Responsibility</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account
          and for all activity under your account.
        </p>

        <h2 className="text-xl font-semibold">Acceptable Use</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>No illegal activity</li>
          <li>No abuse, harassment, or misuse of data</li>
          <li>No attempts to compromise the platform</li>
        </ul>

        <h2 className="text-xl font-semibold">Service Availability</h2>
        <p>
          Aether.os is provided "as is" without guarantees of uptime or
          availability.
        </p>

        <h2 className="text-xl font-semibold">Limitation of Liability</h2>
        <p>
          Aether.os is not liable for damages resulting from use of the platform.
        </p>

        <h2 className="text-xl font-semibold">Changes</h2>
        <p>
          We may update these terms at any time.
        </p>
      </div>
    </div>
  );
}