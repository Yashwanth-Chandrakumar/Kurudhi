"use client"; // Required for Client Component

import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyMail() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Verification Email Sent</h1>
      <p className="text-lg mb-4">
        A verification email has been sent to{" "}
        <span className="font-semibold">{email}</span>. Please verify and then login.
      </p>
      <button
        onClick={() => router.push("/login")}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Login Here
      </button>
    </div>
  );
}
