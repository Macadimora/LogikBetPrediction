"use client";

import { useEffect, useState } from "react";

type SiteSettings = {
  id: string;
  siteName: string;
  logoUrl: string | null;
  homeLabel: string;
  predictionsLabel: string;
  vipLabel: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  themeColor: string;
  heroHeading: string;
  heroHighlight: string;
  heroDescription: string;
};

export default function SiteSettingsPage() {
  const [settings, setSettings] =
    useState<SiteSettings | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploadingLogo, setUploadingLogo] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/admin/site-settings",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to load settings."
          );
        }

        setSettings(data.settings);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load settings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateField(
    field: keyof SiteSettings,
    value: string
  ) {
    setSettings((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  async function handleLogoUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file || !settings) {
      return;
    }

    try {
      setUploadingLogo(true);
      setMessage("");
      setError("");

      const formData =
        new FormData();

      formData.append(
        "logo",
        file
      );

      const response =
        await fetch(
          "/api/admin/site-settings/logo",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to upload logo."
        );
      }

      setSettings((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          logoUrl: data.logoUrl,
        };
      });

      setMessage(
        "Logo uploaded. Click Save Site Settings to apply it."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to upload logo."
      );
    } finally {
      setUploadingLogo(false);

      event.target.value = "";
    }
  }

  function handleRemoveLogo() {
    setSettings((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        logoUrl: null,
      };
    });

    setMessage(
      "Logo removed from settings. Click Save Site Settings to apply."
    );

    setError("");
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!settings) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(
        "/api/admin/site-settings",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            siteName:
              settings.siteName,

            logoUrl:
              settings.logoUrl || "",

            homeLabel:
              settings.homeLabel,

            predictionsLabel:
              settings.predictionsLabel,

            vipLabel:
              settings.vipLabel,

            primaryCtaLabel:
              settings.primaryCtaLabel,

            primaryCtaUrl:
              settings.primaryCtaUrl,

            themeColor:
              settings.themeColor,

            heroHeading:
              settings.heroHeading,

            heroHighlight:
              settings.heroHighlight,

            heroDescription:
              settings.heroDescription,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save settings."
        );
      }

      setSettings(data.settings);

      setMessage(
        "Site settings updated successfully."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto max-w-5xl">
          <p className="text-text-secondary">
            Loading site settings...
          </p>
        </div>
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto max-w-5xl">
          <p className="text-red-400">
            {error ||
              "Unable to load site settings."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              Admin
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Site Settings
            </h1>

            <p className="mt-2 max-w-2xl text-text-secondary">
              Manage your site branding
              and public header navigation.
            </p>
          </div>

          <a
            href="/admin"
            className="inline-flex w-fit rounded-xl border border-theme-border px-4 py-2 text-sm font-semibold text-text-secondary transition hover:bg-surface-soft hover:text-text-primary"
          >
            ← Admin Dashboard
          </a>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          <section className="rounded-3xl border border-theme-border bg-surface p-6 sm:p-8">
            <div>
              <h2 className="text-xl font-semibold">
                Branding
              </h2>

              <p className="mt-2 text-sm text-text-secondary">
                Control the logo and site
                name shown in your public
                header.
              </p>
            </div>

            <div className="mt-6 grid gap-6">
              <div>
                <label
                  htmlFor="siteName"
                  className="mb-2 block text-sm font-medium text-text-secondary"
                >
                  Site name
                </label>

                <input
                  id="siteName"
                  value={
                    settings.siteName
                  }
                  onChange={(event) =>
                    updateField(
                      "siteName",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3 outline-none transition focus:border-brand"
                  maxLength={100}
                  required
                />
              </div>

              <div className="rounded-2xl border border-theme-border bg-surface-soft p-5">
                <p className="text-sm font-medium text-text-secondary">
                  Logo
                </p>

                <div className="mt-4 flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-theme-border bg-surface-soft p-6">
                  {settings.logoUrl ? (
                    <img
                      src={
                        settings.logoUrl
                      }
                      alt={
                        settings.siteName
                      }
                      className="max-h-20 max-w-[260px] object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <p className="font-semibold">
                        No logo uploaded
                      </p>

                      <p className="mt-1 text-sm text-text-muted">
                        Your site name will
                        be used as a fallback.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover">
                    {uploadingLogo
                      ? "Uploading..."
                      : settings.logoUrl
                      ? "Replace Logo"
                      : "Upload Logo"}

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={
                        handleLogoUpload
                      }
                      disabled={
                        uploadingLogo
                      }
                      className="hidden"
                    />
                  </label>

                  {settings.logoUrl && (
                    <button
                      type="button"
                      onClick={
                        handleRemoveLogo
                      }
                      className="rounded-xl border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>

                <p className="mt-3 text-xs text-text-muted">
                  PNG, JPG or WEBP.
                  Maximum file size: 2MB.
                </p>
              </div>

              <div className="rounded-2xl border border-theme-border bg-surface-soft p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Header preview
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    {settings.logoUrl ? (
                      <img
                        src={
                          settings.logoUrl
                        }
                        alt={
                          settings.siteName
                        }
                        className="h-11 w-auto max-w-[180px] object-contain"
                      />
                    ) : (
                      <span className="text-xl font-bold">
                        {
                          settings.siteName
                        }
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-5 text-sm text-text-secondary">
                    <span>
                      {
                        settings.homeLabel
                      }
                    </span>

                    <span>
                      {
                        settings.predictionsLabel
                      }
                    </span>

                    <span>
                      {
                        settings.vipLabel
                      }
                    </span>

                    <span className="rounded-lg bg-brand px-3 py-2 font-semibold text-brand-foreground">
                      {
                        settings.primaryCtaLabel
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-theme-border bg-surface p-6 sm:p-8">
            <div>
              <h2 className="text-xl font-semibold">
                Appearance & Homepage
              </h2>

              <p className="mt-2 text-sm text-text-secondary">
                Choose the website accent color and edit the main homepage hero content.
              </p>
            </div>

            <div className="mt-6 grid gap-6">
              <div>
                <label
                  htmlFor="themeColor"
                  className="mb-2 block text-sm font-medium text-text-secondary"
                >
                  Theme color
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    id="themeColorPicker"
                    type="color"
                    value={settings.themeColor}
                    onChange={(event) =>
                      updateField(
                        "themeColor",
                        event.target.value
                      )
                    }
                    className="h-12 w-full cursor-pointer rounded-xl border border-theme-border bg-surface p-1 sm:w-20"
                    aria-label="Choose theme color"
                  />

                  <input
                    id="themeColor"
                    value={settings.themeColor}
                    onChange={(event) =>
                      updateField(
                        "themeColor",
                        event.target.value
                      )
                    }
                    placeholder="#f59e0b"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    maxLength={7}
                    className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3 outline-none transition focus:border-brand sm:max-w-xs"
                    required
                  />

                  <div
                    className="h-12 w-full rounded-xl border border-theme-border sm:w-28"
                    style={{
                      backgroundColor:
                        /^#[0-9A-Fa-f]{6}$/.test(
                          settings.themeColor
                        )
                          ? settings.themeColor
                          : "#f59e0b",
                    }}
                    aria-label="Theme color preview"
                  />
                </div>

                <p className="mt-2 text-xs text-text-muted">
                  Use a 6-digit HEX color such as #f59e0b.
                </p>
              </div>

              <div>
                <label
                  htmlFor="heroHeading"
                  className="mb-2 block text-sm font-medium text-text-secondary"
                >
                  Homepage heading
                </label>

                <input
                  id="heroHeading"
                  value={settings.heroHeading}
                  onChange={(event) =>
                    updateField(
                      "heroHeading",
                      event.target.value
                    )
                  }
                  maxLength={150}
                  className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3 outline-none transition focus:border-brand"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="heroHighlight"
                  className="mb-2 block text-sm font-medium text-text-secondary"
                >
                  Highlighted heading text
                </label>

                <input
                  id="heroHighlight"
                  value={settings.heroHighlight}
                  onChange={(event) =>
                    updateField(
                      "heroHighlight",
                      event.target.value
                    )
                  }
                  maxLength={100}
                  className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3 outline-none transition focus:border-brand"
                  required
                />

                <p className="mt-2 text-xs text-text-muted">
                  This part of the hero heading will use your selected theme color.
                </p>
              </div>

              <div>
                <label
                  htmlFor="heroDescription"
                  className="mb-2 block text-sm font-medium text-text-secondary"
                >
                  Homepage paragraph
                </label>

                <textarea
                  id="heroDescription"
                  value={settings.heroDescription}
                  onChange={(event) =>
                    updateField(
                      "heroDescription",
                      event.target.value
                    )
                  }
                  rows={5}
                  maxLength={500}
                  className="w-full resize-y rounded-xl border border-theme-border bg-surface px-4 py-3 outline-none transition focus:border-brand"
                  required
                />

                <div className="mt-2 flex justify-end text-xs text-text-muted">
                  {settings.heroDescription.length}/500
                </div>
              </div>

              <div className="rounded-2xl border border-theme-border bg-surface-soft p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Homepage preview
                </p>

                <h3 className="mt-4 text-3xl font-black leading-tight tracking-tight">
                  {settings.heroHeading}{" "}
                  <span
                    style={{
                      color:
                        /^#[0-9A-Fa-f]{6}$/.test(
                          settings.themeColor
                        )
                          ? settings.themeColor
                          : "#f59e0b",
                    }}
                  >
                    {settings.heroHighlight}
                  </span>
                </h3>

                <p className="mt-4 max-w-2xl leading-7 text-text-secondary">
                  {settings.heroDescription}
                </p>

                <button
                  type="button"
                  className="mt-5 rounded-xl px-5 py-3 font-semibold text-slate-950"
                  style={{
                    backgroundColor:
                      /^#[0-9A-Fa-f]{6}$/.test(
                        settings.themeColor
                      )
                        ? settings.themeColor
                        : "#f59e0b",
                  }}
                >
                  Theme color preview
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-theme-border bg-surface p-6 sm:p-8">
            <h2 className="text-xl font-semibold">
              Header Navigation
            </h2>

            <p className="mt-2 text-sm text-text-secondary">
              Change the labels displayed
              in the public website menu.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  Home label
                </label>

                <input
                  value={
                    settings.homeLabel
                  }
                  onChange={(event) =>
                    updateField(
                      "homeLabel",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3 outline-none focus:border-brand"
                  maxLength={50}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  Predictions label
                </label>

                <input
                  value={
                    settings.predictionsLabel
                  }
                  onChange={(event) =>
                    updateField(
                      "predictionsLabel",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3 outline-none focus:border-brand"
                  maxLength={50}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  VIP label
                </label>

                <input
                  value={
                    settings.vipLabel
                  }
                  onChange={(event) =>
                    updateField(
                      "vipLabel",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3 outline-none focus:border-brand"
                  maxLength={50}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  Primary CTA label
                </label>

                <input
                  value={
                    settings.primaryCtaLabel
                  }
                  onChange={(event) =>
                    updateField(
                      "primaryCtaLabel",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3 outline-none focus:border-brand"
                  maxLength={50}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  Primary CTA URL
                </label>

                <input
                  value={
                    settings.primaryCtaUrl
                  }
                  onChange={(event) =>
                    updateField(
                      "primaryCtaUrl",
                      event.target.value
                    )
                  }
                  placeholder="/subscribe"
                  className="w-full rounded-xl border border-theme-border bg-surface px-4 py-3 outline-none focus:border-brand"
                  required
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                saving ||
                uploadingLogo
              }
              className="rounded-xl bg-brand px-6 py-3 font-semibold text-brand-foreground transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save Site Settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}