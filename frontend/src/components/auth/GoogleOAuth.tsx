import { useGoogleLogin, useGoogleOneTapLogin } from "@react-oauth/google";
import { LoginButton } from "../shared/LoginButton";

interface GoogleOAuthProps {
    onSuccess: (provider: string, token: string) => void;
    onError: () => void;
}


export default function GoogleOAuth({ onSuccess, onError }: GoogleOAuthProps) {

    useGoogleOneTapLogin({
      onSuccess: credentialResponse => {
        return onSuccess('google-signin', credentialResponse.credential as string);
      },
      onError: () => {
        return onError();
      },
    });



    const login = useGoogleLogin({
      onSuccess: credentialResponse => {
        return onSuccess('google', credentialResponse.access_token as string);
      },
      onError: () => {
        onError();
      },
    });

    return (
      <LoginButton onClick={() => login()}>
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
          fill="currentColor"
        />
      </svg>
      <span>Continue with Google</span>
      </LoginButton>
      );
}