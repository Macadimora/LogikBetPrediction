import AdminHeader from "@/components/AdminHeader";

export default function AdminSiteSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AdminHeader activePage="settings" />
      {children}
    </>
  );
}
