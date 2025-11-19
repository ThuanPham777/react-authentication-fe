export { };

declare global {
    namespace google.accounts.id {
        interface CredentialResponse {
            credential: string;
            select_by: string;
        }

        interface IdConfiguration {
            client_id: string;
            callback: (response: CredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: 'signin' | 'signup' | 'use';
            ux_mode?: 'popup' | 'redirect';
        }
    }

    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: google.accounts.id.IdConfiguration) => void;
                    renderButton: (parent: HTMLElement, options?: Record<string, unknown>) => void;
                    prompt: () => void;
                    cancel: () => void;
                };
            };
        };
    }
}


