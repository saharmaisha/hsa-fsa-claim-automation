import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  console.log('SignUpPage rendered');
  return <SignUp routing="path" path="/sign-up" />;
}
