import StoreNavbar from "@/components/store/StoreNavbar";
import MinimalStoreFooter from "@/components/store/MinimalStoreFooter";
import CartDrawer from "@/components/store/CartDrawer";
import QuickViewDialog from "@/components/store/QuickViewDialog";
import SearchCommandDialog from "@/components/store/SearchCommandDialog";
import ToastViewport from "@/components/store/ToastViewport";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col text-slate-900">
      <StoreNavbar />
      <main className="flex-1">{children}</main>
      <MinimalStoreFooter />
      <CartDrawer />
      <QuickViewDialog />
      <SearchCommandDialog />
      <ToastViewport />
    </div>
  );
}
