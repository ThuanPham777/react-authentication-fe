import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
    onCredential: (credential: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
}

const SCRIPT_ID = 'google-identity-services';

export function GoogleSignInButton({ onCredential, disabled, isLoading }: GoogleSignInButtonProps) {
    const buttonRef = useRef<HTMLDivElement | null>(null);
    const [scriptReady, setScriptReady] = useState(() => typeof window !== 'undefined' && !!window.google);
    const [rendered, setRendered] = useState(false);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // console.log("clientId", clientId);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.google) {
            setScriptReady(true);
            return;
        }
        const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        const handleLoad = () => setScriptReady(true);
        if (existing) {
            existing.addEventListener('load', handleLoad);
            return () => existing.removeEventListener('load', handleLoad);
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.id = SCRIPT_ID;
        script.onload = handleLoad;
        document.head.appendChild(script);
        return () => {
            script.onload = null;
        };
    }, []);

    const initializeButton = useCallback(() => {
        if (!clientId || !window.google || !buttonRef.current || rendered || disabled) return;
        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: google.accounts.id.CredentialResponse) => {
                console.log("response.credential", response.credential);
                if (response.credential) {
                    onCredential(response.credential);
                }
            },
            ux_mode: 'popup',
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            width: buttonRef.current.clientWidth || 280,
        });
        setRendered(true);
    }, [clientId, disabled, onCredential, rendered]);

    useEffect(() => {
        if (scriptReady) {
            initializeButton();
        }
    }, [initializeButton, scriptReady]);

    if (!clientId) {
        return (
            <Button type="button" variant="outline" disabled className="w-full" title="Google Sign-In is not configured">
                Google Sign-In unavailable
            </Button>
        );
    }

    return (
        <div className="relative w-full">
            <div ref={buttonRef} className={disabled ? 'pointer-events-none opacity-60' : ''} />
            {(!scriptReady || !rendered || isLoading) && (
                <Button type="button" variant="outline" disabled className="w-full absolute inset-0 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Google Sign-In
                </Button>
            )}
        </div>
    );
}


