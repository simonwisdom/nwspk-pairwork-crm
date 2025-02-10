import AuthForm from '@/components/auth/sign-in-form'

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E1F7F7]">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div>
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-[#E1F7F7] flex items-center justify-center">
              <span className="text-[#17BEBB] font-bold text-2xl">P</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#2E282A]">
            Newspeak House Pairwork CRM
          </h2>
          <p className="mt-2 text-center text-sm text-[#2E282A]/70">
            Sign in to your account or create a new one
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
} 