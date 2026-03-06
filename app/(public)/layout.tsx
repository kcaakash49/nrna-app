import Footer from "@/components/client/Footer";
import MainNavbar from "@/components/client/MainNavbar";
import TopNavbar from "@/components/client/TopNavbar";
import { getNavbarMenu } from "@/lib/getNavbarMenu";

export const revalidate = 3600;

export default async function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const menu = await getNavbarMenu("MAIN_NAVBAR");

    return (
        <div className="flex min-h-screen flex-col">
            <TopNavbar />
            <MainNavbar menu={menu} />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}