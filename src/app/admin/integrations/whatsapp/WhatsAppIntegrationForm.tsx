"use client";

import {
  FormEvent,
  useState,
} from "react";

type InitialSettings = {
  enabled: boolean;
  provider: string;
  phoneNumberId: string;
  apiVersion: string;
  predictionTemplateName: string;
  hasAccessToken: boolean;
};

type Props = {
  initialSettings: InitialSettings;
};

export default function WhatsAppIntegrationForm({
  initialSettings,
}: Props) {
  const [enabled, setEnabled] =
    useState(initialSettings.enabled);

  const [
    phoneNumberId,
    setPhoneNumberId,
  ] = useState(
    initialSettings.phoneNumberId
  );

  const [
    apiVersion,
    setApiVersion,
  ] = useState(
    initialSettings.apiVersion
  );

  const [
    predictionTemplateName,
    setPredictionTemplateName,
  ] = useState(
    initialSettings.predictionTemplateName
  );

  const [
    accessToken,
    setAccessToken,
  ] = useState("");

  const [
    hasAccessToken,
    setHasAccessToken,
  ] = useState(
    initialSettings.hasAccessToken
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    testing,
    setTesting,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    testMessage,
    setTestMessage,
  ] = useState("");

  const [
    testError,
    setTestError,
  ] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response =
        await fetch(
          "/api/admin/integrations/whatsapp",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              enabled,
              phoneNumberId,
              apiVersion,
              predictionTemplateName,

              accessToken:
                accessToken.trim()
                  ? accessToken
                  : undefined,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Failed to save WhatsApp settings."
        );

        return;
      }

      if (accessToken.trim()) {
        setHasAccessToken(true);
        setAccessToken("");
      }

      setMessage(
        "WhatsApp integration settings saved."
      );
    } catch {
      setError(
        "Something went wrong while saving the integration."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestMessage("");
    setTestError("");

    try {
      const response =
        await fetch(
          "/api/admin/integrations/whatsapp/test",
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setTestError(
          data.error ||
            "WhatsApp connection test failed."
        );

        return;
      }

      let successMessage =
        "WhatsApp connection is valid.";

      if (
        data.account?.verifiedName
      ) {
        successMessage +=
          ` Account: ${data.account.verifiedName}.`;
      }

      if (
        data.account
          ?.displayPhoneNumber
      ) {
        successMessage +=
          ` Number: ${data.account.displayPhoneNumber}.`;
      }

      setTestMessage(
        successMessage
      );
    } catch {
      setTestError(
        "Unable to test the WhatsApp connection."
      );
    } finally {
      setTesting(false);
    }
  }

  const connectionReady =
    hasAccessToken &&
    Boolean(phoneNumberId.trim());

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Enable section */}
      <section className="rounded-2xl border border-theme-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black">
                Enable WhatsApp
              </h3>

              <span
                className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                  enabled
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-theme-border bg-surface-soft text-text-muted"
                }`}
              >
                {enabled
                  ? "Enabled"
                  : "Disabled"}
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              WhatsApp notifications
              will only be sent when
              this integration is
              enabled and the required
              credentials are properly
              configured.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-3">
            <span className="text-xs font-bold text-text-muted">
              {enabled
                ? "On"
                : "Off"}
            </span>

            <span className="relative inline-flex">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) =>
                  setEnabled(
                    event.target.checked
                  )
                }
                className="peer sr-only"
              />

              <span className="h-7 w-12 rounded-full border border-theme-border bg-surface-muted transition peer-checked:border-emerald-500/30 peer-checked:bg-emerald-500/20" />

              <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-slate-400 transition-transform peer-checked:translate-x-5 peer-checked:bg-emerald-400" />
            </span>
          </label>
        </div>
      </section>

      {/* Provider */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div>
          <label
            htmlFor="whatsapp-provider"
            className="mb-2 block text-sm font-bold text-text-secondary"
          >
            Provider
          </label>

          <input
            id="whatsapp-provider"
            value="Meta WhatsApp Cloud API"
            disabled
            className="w-full rounded-xl border border-theme-border bg-surface-soft px-4 py-3.5 text-sm text-text-muted outline-none"
          />

          <p className="mt-2 text-xs leading-5 text-text-muted">
            This integration currently
            uses Meta&apos;s official
            WhatsApp Cloud API.
          </p>
        </div>

        <div>
          <label
            htmlFor="whatsapp-api-version"
            className="mb-2 block text-sm font-bold text-text-secondary"
          >
            Graph API Version
          </label>

          <input
            id="whatsapp-api-version"
            type="text"
            value={apiVersion}
            onChange={(event) =>
              setApiVersion(
                event.target.value
              )
            }
            placeholder="v23.0"
            className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3.5 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand/50 focus:ring-2 focus:ring-brand/10"
          />

          <p className="mt-2 text-xs leading-5 text-text-muted">
            Example: v23.0
          </p>
        </div>
      </section>

      {/* Access token */}
      <section className="rounded-2xl border border-theme-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <label
              htmlFor="whatsapp-access-token"
              className="block text-sm font-black text-text-primary"
            >
              Access Token
            </label>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-text-muted">
              Leave this field blank
              if you want to keep the
              existing token. Enter a
              value only when adding or
              replacing the credential.
            </p>
          </div>

          <span
            className={`w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
              hasAccessToken
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            }`}
          >
            {hasAccessToken
              ? "Configured"
              : "Not Configured"}
          </span>
        </div>

        <input
          id="whatsapp-access-token"
          type="password"
          value={accessToken}
          onChange={(event) =>
            setAccessToken(
              event.target.value
            )
          }
          placeholder={
            hasAccessToken
              ? "Enter a new token only to replace the existing one"
              : "Enter Meta access token"
          }
          autoComplete="new-password"
          className="mt-5 w-full rounded-xl border border-theme-border bg-surface px-4 py-3.5 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand/50 focus:ring-2 focus:ring-brand/10"
        />

        {hasAccessToken && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-3">
            <span className="mt-0.5 text-emerald-400">
              ✓
            </span>

            <p className="text-xs leading-5 text-emerald-300">
              An access token is already
              stored. Its value is never
              shown here.
            </p>
          </div>
        )}
      </section>

      {/* Account settings */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div>
          <label
            htmlFor="whatsapp-phone-number-id"
            className="mb-2 block text-sm font-bold text-text-secondary"
          >
            Phone Number ID
          </label>

          <input
            id="whatsapp-phone-number-id"
            type="text"
            value={phoneNumberId}
            onChange={(event) =>
              setPhoneNumberId(
                event.target.value
              )
            }
            placeholder="e.g. 123456789012345"
            className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3.5 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand/50 focus:ring-2 focus:ring-brand/10"
          />

          <p className="mt-2 text-xs leading-5 text-text-muted">
            The WhatsApp phone number ID
            from your Meta developer
            account.
          </p>
        </div>

        <div>
          <label
            htmlFor="whatsapp-template-name"
            className="mb-2 block text-sm font-bold text-text-secondary"
          >
            Prediction Template Name
          </label>

          <input
            id="whatsapp-template-name"
            type="text"
            value={
              predictionTemplateName
            }
            onChange={(event) =>
              setPredictionTemplateName(
                event.target.value
              )
            }
            placeholder="new_prediction"
            className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3.5 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand/50 focus:ring-2 focus:ring-brand/10"
          />

          <p className="mt-2 text-xs leading-5 text-text-muted">
            Must match the approved Meta
            message template used for
            prediction alerts.
          </p>
        </div>
      </section>

      {/* Save messages */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm leading-6 text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm leading-6 text-emerald-300">
          {message}
        </div>
      )}

      {/* Actions */}
      <section className="rounded-2xl border border-theme-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-black">
              Save & Verify
            </h3>

            <p className="mt-1 text-xs leading-5 text-text-muted">
              Save your settings first,
              then test the stored
              connection.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-black text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Saving..."
                : "Save WhatsApp Settings"}
            </button>

            <button
              type="button"
              onClick={
                handleTestConnection
              }
              disabled={
                testing ||
                !connectionReady
              }
              className="inline-flex items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-5 py-3 text-sm font-black text-emerald-400 transition hover:bg-emerald-500/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {testing
                ? "Testing..."
                : "Test Connection"}
            </button>
          </div>
        </div>

        {!connectionReady && (
          <p className="mt-4 text-xs leading-5 text-text-muted">
            Testing becomes available
            after a saved access token
            and Phone Number ID are
            configured.
          </p>
        )}
      </section>

      {/* Test responses */}
      {testError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm leading-6 text-red-300">
          <p className="font-bold">
            Connection test failed
          </p>

          <p className="mt-1">
            {testError}
          </p>
        </div>
      )}

      {testMessage && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm leading-6 text-emerald-300">
          <p className="font-bold">
            Connection successful
          </p>

          <p className="mt-1">
            {testMessage}
          </p>
        </div>
      )}

      {/* Development note */}
      <section className="rounded-2xl border border-theme-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-sm">
            i
          </div>

          <div>
            <p className="text-sm font-black">
              Optional during development
            </p>

            <p className="mt-2 text-xs leading-5 text-text-muted">
              The website will continue
              working normally while
              WhatsApp is disabled. The
              site owner can add Meta
              credentials later, save
              them, test the connection,
              and enable notifications
              when ready.
            </p>
          </div>
        </div>
      </section>
    </form>
  );
}