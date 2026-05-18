export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>

        <p>
          Aether.os ("we", "our", "us") respects your privacy. This Privacy Policy
          explains how we collect, use, and protect your information when you use
          our platform.
        </p>

        <h2 className="text-xl font-semibold">Information We Collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>User account information (email, login credentials)</li>
          <li>Campaign and contact data you upload or manage</li>
          <li>Usage data to improve platform performance</li>
        </ul>

        <h2 className="text-xl font-semibold">How We Use Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>To operate and improve Aether.os</li>
          <li>To provide campaign insights and automation</li>
          <li>To maintain platform security and integrity</li>
        </ul>

        <h2 className="text-xl font-semibold">Data Security</h2>
        <p>
          We take reasonable measures to protect your data, but no system is
          completely secure. You are responsible for maintaining the security of
          your account credentials.
        </p>

        <h2 className="text-xl font-semibold">Data Ownership</h2>
        <p>
          You retain ownership of your data. Aether.os does not sell your data to
          third parties.
        </p>

        <h2 className="text-xl font-semibold">Contact</h2>
        <p>
          If you have questions, contact us at: support@aetheros.pro
        </p>
      </div>
    </div>
  );
}