import SignUp from '@/components/sign-up';
import { isSignUpDisabled } from '@/lib/auth';

export async function getServerSideProps() {
  if (isSignUpDisabled) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-linear-to-br from-muted/80 via-primary/10 to-muted/80 px-4 py-12">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(from_var(--color-primary)_l_c_h/0.15)transparent_55%)]"
        aria-hidden="true"
      />
      <form className="relative z-10 w-full max-w-md">
        <SignUp />
      </form>
    </div>
  );
}
