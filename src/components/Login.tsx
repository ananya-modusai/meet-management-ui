import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { GoogleG, PhoneCallIcon } from './icons';

const SCOPES = 'openid email profile https://www.googleapis.com/auth/calendar.events';
const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const REDIRECT_URI = window.location.origin;

interface Props {
  onToken: (token: string) => void;
  error: string | null;
}

export function Login({ onToken, error }: Props) {
  const [failed, setFailed] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const login = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (r) => {
      try {
        if (API_BASE) {
          const res = await fetch(`${API_BASE}/auth/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: r.code, redirectUri: REDIRECT_URI }),
          });
          if (!res.ok) throw new Error(`exchange failed: ${res.status}`);
          const data = await res.json();
          // Use the access token returned by the server (avoids a second Google round-trip).
          onToken(data.accessToken);
        } else {
          onToken('');
        }
      } catch (e) {
        setErrMsg(e instanceof Error ? e.message : 'Sign-in failed.');
      }
    },
    onError: () => setFailed(true),
    scope: SCOPES,
    // @ts-expect-error prompt is required by Google API to force refresh token but missing in library types
    prompt: 'consent',   // always request refresh token (offline access implied by auth-code flow)
  });

  const notice = errMsg ?? (failed ? "That didn't go through. Try again." : error);

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-indigo p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange">
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <span className="font-display text-lg font-extrabold text-white">Meet-Alert</span>
        </div>

        <div className="relative">
          <div className="relative mb-10 grid h-20 w-20 place-items-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute h-12 w-12 rounded-full border border-orange/50 motion-safe:animate-[pulse-ring_3s_ease-out_infinite]"
                style={{ animationDelay: `${i}s` }}
              />
            ))}
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange text-white">
              <PhoneCallIcon width={24} height={24} />
            </span>
          </div>
          <h2 className="max-w-md font-display text-4xl font-extrabold leading-tight text-white">
            The meetings you can’t miss get a phone call.
          </h2>
          <p className="mt-4 max-w-sm text-periwinkle">
            Meet-Alert rings your phone minutes before a meeting starts — so a missed
            notification never costs you the room.
          </p>
        </div>

        <p className="font-mono text-xs uppercase tracking-[0.18em] text-periwinkle/60">
          reads &amp; manages your calendar · calls only what you arm
        </p>
      </section>

      {/* Sign-in panel */}
      <section className="grid place-items-center bg-canvas px-6">
        <div className="w-full max-w-sm text-center motion-safe:animate-[rise_0.5s_ease-out]">
          <div className="mb-6 inline-grid h-12 w-12 place-items-center rounded-2xl bg-orange text-white lg:hidden">
            <PhoneCallIcon width={22} height={22} />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-ink-2">Sign in to manage your meeting alerts.</p>

          <button
            type="button"
            onClick={() => login()}
            className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-border-strong bg-surface px-6 py-3.5 font-semibold text-ink shadow-sm transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower"
          >
            <GoogleG />
            Sign in with Google
          </button>

          {notice && (
            <p className="mt-4 text-sm text-danger" role="alert">
              {notice}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
