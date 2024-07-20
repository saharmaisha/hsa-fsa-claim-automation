import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  console.log('SignInPage rendered');
  return <SignIn routing="path" path="/sign-in" />;
}
