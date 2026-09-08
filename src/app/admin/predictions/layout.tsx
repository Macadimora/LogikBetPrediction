import AdminHeader from "@/components/AdminHeader";

export default function AdminPredictionsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AdminHeader activePage="predictions" />
      {children}
    </>
  );
}
