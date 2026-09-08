"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

type NotificationPreferences = {
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  phoneNumber: string;
};

export default function NotificationPreferencesForm() {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>({
      emailEnabled: true,
      whatsappEnabled: false,
      phoneNumber: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch(
          "/api/account/notifications",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load notification preferences."
          );
        }

        setPreferences({
          emailEnabled:
            data.preferences.emailEnabled,

          whatsappEnabled:
            data.preferences.whatsappEnabled,

          phoneNumber:
            data.preferences.phoneNumber ||
            "",
        });
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load notification preferences."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/account/notifications",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            preferences
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update notification preferences."
        );
      }

      setPreferences({
        emailEnabled:
          data.preferences.emailEnabled,

        whatsappEnabled:
          data.preferences.whatsappEnabled,

        phoneNumber:
          data.preferences.phoneNumber ||
          "",
      });

      setMessage(
        data.message ||
          "Notification preferences updated successfully."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating notification preferences."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-theme-border bg-surface px-5 py-4">
        <p className="text-sm text-text-secondary">
          Loading notification settings...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-6"
    >
      <div className="space-y-3">
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-theme-border bg-surface-soft p-4 transition hover:bg-surface-muted sm:p-5">
          <div className="min-w-0">
            <p className="font-semibold text-text-primary">
              Email notifications
            </p>

            <p className="mt-1 text-sm leading-6 text-text-muted">
              Receive new predictions,
              subscription updates and
              account notifications by
              email.
            </p>
          </div>

          <input
            type="checkbox"
            checked={
              preferences.emailEnabled
            }
            onChange={(event) =>
              setPreferences(
                (current) => ({
                  ...current,
                  emailEnabled:
                    event.target.checked,
                })
              )
            }
            disabled={saving}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-brand disabled:cursor-not-allowed"
          />
        </label>

        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-theme-border bg-surface-soft p-4 transition hover:bg-surface-muted sm:p-5">
          <div className="min-w-0">
            <p className="font-semibold text-text-primary">
              WhatsApp notifications
            </p>

            <p className="mt-1 text-sm leading-6 text-text-muted">
              Receive football tips and
              account notifications
              through WhatsApp.
            </p>
          </div>

          <input
            type="checkbox"
            checked={
              preferences.whatsappEnabled
            }
            onChange={(event) =>
              setPreferences(
                (current) => ({
                  ...current,
                  whatsappEnabled:
                    event.target.checked,
                })
              )
            }
            disabled={saving}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-brand disabled:cursor-not-allowed"
          />
        </label>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="notification-phone"
          className="block text-sm font-semibold text-text-secondary"
        >
          WhatsApp phone number
        </label>

        <input
          id="notification-phone"
          type="tel"
          value={
            preferences.phoneNumber
          }
          onChange={(event) =>
            setPreferences(
              (current) => ({
                ...current,
                phoneNumber:
                  event.target.value,
              })
            )
          }
          disabled={saving}
          placeholder="+2348012345678"
          className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3.5 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <p className="text-xs leading-5 text-text-muted">
          Include your country code,
          for example +234 for Nigeria.
        </p>
      </div>

      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm leading-6 text-emerald-400"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm leading-6 text-red-400"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end border-t border-theme-border pt-5">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-w-52 items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-black text-brand-foreground transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : "Save Notification Settings"}
        </button>
      </div>
    </form>
  );
}
